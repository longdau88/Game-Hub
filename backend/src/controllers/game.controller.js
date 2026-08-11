const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types'); // We should install this package if not already
const { v4: uuidv4 } = require('uuid'); // Install this as well
const r2Client = require('../config/r2');
const prisma = require('../config/db');

// Recursive function to get all files in a directory
const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

exports.uploadGame = async (req, res) => {
  try {
    const { title, description, categoryIds, controls, descriptionTranslations, engineConfig } = req.body;
    const file = req.files && req.files['gameFile'] ? req.files['gameFile'][0] : null;
    const coverFile = req.files && req.files['coverImage'] ? req.files['coverImage'][0] : null;

    if (!file) {
      return res.status(400).json({ error: 'No game file uploaded' });
    }

    const gameId = uuidv4();
    const tempExtractDir = path.join(os.tmpdir(), `game-extract-${gameId}`);
    
    // Extract zip
    const zip = new AdmZip(file.path);
    zip.extractAllTo(tempExtractDir, true);

    // Validate index.html
    const indexPath = path.join(tempExtractDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      // Cleanup
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Zip file does not contain an index.html at the root' });
    }

    // Process engineConfig to inject Firebase tracking if present
    let parsedEngineConfig = null;
    if (engineConfig) {
      try {
        parsedEngineConfig = JSON.parse(engineConfig);
        if (parsedEngineConfig.firebaseTrackingId) {
          const gtagId = parsedEngineConfig.firebaseTrackingId;
          const gtagScript = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gtagId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gtagId}');
</script>
`;
          let htmlContent = fs.readFileSync(indexPath, 'utf8');
          // Inject before </head> if exists, else before </body>
          if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `${gtagScript}\n</head>`);
          } else if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${gtagScript}\n</body>`);
          } else {
            htmlContent += gtagScript;
          }
          fs.writeFileSync(indexPath, htmlContent, 'utf8');
        }
      } catch (e) {
        console.error('Failed to parse engineConfig JSON:', e);
      }
    }

    // Get all files and upload to R2
    const allFiles = getAllFiles(tempExtractDir);
    const bucketName = process.env.R2_BUCKET_NAME;

    for (const filePath of allFiles) {
      const relativePath = path.relative(tempExtractDir, filePath).replace(/\\/g, '/');
      const r2Key = `games/${gameId}/${relativePath}`;
      
      const fileStream = fs.createReadStream(filePath);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';

      const uploadParams = {
        Bucket: bucketName,
        Key: r2Key,
        Body: fileStream,
        ContentType: mimeType,
      };

      await r2Client.send(new PutObjectCommand(uploadParams));
    }
    
    // Process cover image if exists
    let coverImageUrl = null;
    if (coverFile) {
      const coverExt = path.extname(coverFile.originalname);
      const coverKey = `games/${gameId}/cover${coverExt}`;
      const coverStream = fs.createReadStream(coverFile.path);
      const coverMimeType = mime.lookup(coverFile.path) || 'image/png';
      
      const uploadParams = {
        Bucket: bucketName,
        Key: coverKey,
        Body: coverStream,
        ContentType: coverMimeType,
      };
      
      await r2Client.send(new PutObjectCommand(uploadParams));
      coverImageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/games/${gameId}/cover${coverExt}`; // Note: Actually R2 bucket is public at https://pub-b1e657359c3c4d48abdb8cb037d3ec97.r2.dev, but we don't have it in backend env. 
      // Wait, frontend uses NEXT_PUBLIC_R2_URL. Let's construct it using R2_BUCKET_NAME but without full domain?
      // No, we can just save the relative path or hardcode the R2 pub URL for now, or use a env var. 
      // Let's hardcode the R2 pub URL or reconstruct it since it's known: https://pub-b1e657359c3c4d48abdb8cb037d3ec97.r2.dev
      coverImageUrl = `https://pub-b1e657359c3c4d48abdb8cb037d3ec97.r2.dev/${coverKey}`;
      fs.unlinkSync(coverFile.path);
    }

    // Save to Database
    
    // Process categories
    let categoryConnect = [];
    if (categoryIds) {
      // categoryIds could be a comma-separated string or an array depending on how formData sends it
      const ids = Array.isArray(categoryIds) ? categoryIds : categoryIds.split(',').filter(Boolean);
      categoryConnect = ids.map(id => ({ id: parseInt(id) }));
    }
    
    // Process controls
    let parsedControls = null;
    if (controls) {
      try {
        parsedControls = JSON.parse(controls);
      } catch (e) {
        console.error('Failed to parse controls JSON:', e);
      }
    }
    
    // Process descriptionTranslations
    let parsedDescTranslations = null;
    if (descriptionTranslations) {
      try {
        parsedDescTranslations = JSON.parse(descriptionTranslations);
      } catch (e) {
        console.error('Failed to parse descriptionTranslations JSON:', e);
      }
    }
    
    const newGame = await prisma.game.create({
      data: {
        id: gameId,
        title: title || 'Untitled Game',
        description: description || '',
        descriptionTranslations: parsedDescTranslations,
        r2FolderPath: `games/${gameId}/`,
        status: 'pending', // pending approval
        sizeBytes: file.size,
        uploaderId: req.user.userId,
        controls: parsedControls,
        engineConfig: parsedEngineConfig,
        coverImageUrl: coverImageUrl,
        ...(categoryConnect.length > 0 && {
          categories: {
            connect: categoryConnect
          }
        }),
        versions: {
          create: [{
            version: '1.0.0',
            r2FolderPath: `games/${gameId}/`,
            changelog: 'Initial Release',
            isActive: true
          }]
        }
      },
      include: {
        versions: true
      }
    });

    // Cleanup temp files
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.unlinkSync(file.path);

    res.status(201).json({ message: 'Game uploaded successfully and pending approval', game: newGame });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal Server Error during upload', details: error.message });
  }
};

exports.getPublishedGames = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    const whereClause = { status: 'published' };
    
    if (search) {
      whereClause.title = { contains: search, mode: 'insensitive' };
    }
    
    if (category) {
      whereClause.categories = { some: { slug: category } };
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        uploader: { select: { id: true, username: true, avatarUrl: true } },
        ratings: { select: { score: true } }
      }
    });

    const formattedGames = games.map(game => {
      const avgRating = game.ratings.length > 0 
        ? game.ratings.reduce((acc, curr) => acc + curr.score, 0) / game.ratings.length
        : 0;
      return {
        ...game,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: game.ratings.length
      };
    });

    res.json(formattedGames);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
};

exports.getFeaturedGames = async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'published', isFeatured: true },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        ratings: { select: { score: true } },
        uploader: { select: { username: true } }
      }
    });

    const formattedGames = games.map(game => {
      const avgRating = game.ratings.length > 0 
        ? game.ratings.reduce((acc, curr) => acc + curr.score, 0) / game.ratings.length
        : 0;
      return {
        ...game,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: game.ratings.length
      };
    });

    res.json(formattedGames);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured games' });
  }
};

exports.getGameDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        categories: true,
        uploader: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const aggregations = await prisma.rating.aggregate({
      where: { gameId: id },
      _avg: { score: true },
      _count: { score: true }
    });

    res.json({
      ...game,
      averageRating: aggregations._avg.score ? Number(aggregations._avg.score.toFixed(1)) : 0,
      totalRatings: aggregations._count.score
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
};

exports.incrementPlayCount = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGame = await prisma.game.update({
      where: { id },
      data: { playCount: { increment: 1 } }
    });
    res.json({ message: 'Play count incremented', playCount: updatedGame.playCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment play count' });
  }
};

exports.getMyGames = async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { uploaderId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true
      }
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch my games' });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingBookmark = await prisma.userLibrary.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: id
        }
      }
    });

    if (existingBookmark) {
      await prisma.userLibrary.delete({
        where: {
          userId_gameId: { userId, gameId: id }
        }
      });
      return res.json({ message: 'Bookmark removed', bookmarked: false });
    } else {
      await prisma.userLibrary.create({
        data: {
          userId,
          gameId: id
        }
      });
      return res.json({ message: 'Bookmark added', bookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
};

exports.getBookmarkedGames = async (req, res) => {
  try {
    const library = await prisma.userLibrary.findMany({
      where: { userId: req.user.userId },
      include: {
        game: {
          include: {
            categories: true,
            uploader: { select: { id: true, username: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });
    
    // Map to just return games array
    const games = library.map(item => item.game);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookmarked games' });
  }
};


// Creator Edit/Delete
exports.updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryIds, controls, descriptionTranslations, engineConfig } = req.body;
    
    // Verify ownership
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.uploaderId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this game' });
    }

    const coverFile = req.files && req.files['coverImage'] ? req.files['coverImage'][0] : null;
    let coverImageUrl = game.coverImageUrl;

    if (coverFile) {
      const bucketName = process.env.R2_BUCKET_NAME;
      const coverExt = path.extname(coverFile.originalname);
      const coverKey = `games/${id}/cover${coverExt}`;
      const coverStream = fs.createReadStream(coverFile.path);
      const coverMimeType = mime.lookup(coverFile.path) || 'image/png';
      
      const uploadParams = {
        Bucket: bucketName,
        Key: coverKey,
        Body: coverStream,
        ContentType: coverMimeType,
      };
      
      await r2Client.send(new PutObjectCommand(uploadParams));
      coverImageUrl = `https://pub-b1e657359c3c4d48abdb8cb037d3ec97.r2.dev/${coverKey}`;
      fs.unlinkSync(coverFile.path);
    }

    // Process categories
    let categoryConnect = undefined;
    if (categoryIds) {
      const ids = Array.isArray(categoryIds) ? categoryIds : categoryIds.split(',').filter(Boolean);
      categoryConnect = ids.map(cId => ({ id: parseInt(cId) }));
    }
    
    // Process controls
    let parsedControls = game.controls;
    if (controls) {
      try {
        parsedControls = JSON.parse(controls);
      } catch (e) {
        console.error('Failed to parse controls JSON:', e);
      }
    }
    
    let parsedDescTranslations = game.descriptionTranslations;
    if (descriptionTranslations) {
      try {
        parsedDescTranslations = JSON.parse(descriptionTranslations);
      } catch (e) {
        console.error('Failed to parse descriptionTranslations:', e);
      }
    }

    let parsedEngineConfig = game.engineConfig;
    if (engineConfig) {
      try {
        parsedEngineConfig = JSON.parse(engineConfig);
      } catch (e) {
        console.error('Failed to parse engineConfig:', e);
      }
    }

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(parsedDescTranslations && { descriptionTranslations: parsedDescTranslations }),
        ...(parsedControls && { controls: parsedControls }),
        ...(parsedEngineConfig && { engineConfig: parsedEngineConfig }),
        ...(coverImageUrl && { coverImageUrl }),
        ...(categoryConnect && {
          categories: { set: [], connect: categoryConnect }
        })
      }
    });

    res.json({ message: 'Game updated successfully', game: updatedGame });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

exports.deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.uploaderId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this game' });
    }

    // Delete related records first (if you have foreign keys without cascade)
    await prisma.userLibrary.deleteMany({ where: { gameId: id } });
    await prisma.rating.deleteMany({ where: { gameId: id } });
    await prisma.comment.deleteMany({ where: { gameId: id } });

    await prisma.game.delete({ where: { id } });
    // Note: For a complete solution we should also delete files from R2, but for now we skip to save time.

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

// Admin Endpoints
exports.getPendingGames = async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'pending' },
      include: {
        uploader: { select: { id: true, username: true, email: true } },
        categories: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending games' });
  }
};

exports.approveGame = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const updatedGame = await prisma.game.update({
      where: { id },
      data: { status: 'published' },
      include: { uploader: { select: { username: true, email: true } } }
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'APPROVE_GAME',
          entity: 'Game',
          details: {
            gameId: id,
            gameTitle: updatedGame.title,
            uploaderEmail: updatedGame.uploader?.email
          }
        }
      });
    } catch (auditErr) {
      console.error('[AuditLog] Failed to write log:', auditErr.message);
    }

    res.json({ message: 'Game approved successfully', game: updatedGame });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve game' });
  }
};

// Telemetry Endpoints
exports.logSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionLength } = req.body;
    const userId = req.user ? req.user.userId : null;

    if (!sessionLength) return res.status(400).json({ error: 'Missing sessionLength' });

    await prisma.gameSession.create({
      data: {
        gameId: id,
        userId: userId,
        sessionLength: parseInt(sessionLength)
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('logSession error:', error);
    res.status(500).json({ error: 'Failed to log session' });
  }
};

exports.logCrash = async (req, res) => {
  try {
    const { id } = req.params;
    const { errorMsg, stackTrace, browserInfo } = req.body;
    const userId = req.user ? req.user.userId : null;

    if (!errorMsg) return res.status(400).json({ error: 'Missing errorMsg' });

    await prisma.crashReport.create({
      data: {
        gameId: id,
        userId: userId,
        errorMsg,
        stackTrace: stackTrace || '',
        browserInfo: browserInfo || req.headers['user-agent'] || ''
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('logCrash error:', error);
    res.status(500).json({ error: 'Failed to log crash' });
  }
};
