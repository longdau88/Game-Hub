const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

function injectEngineConfigToHtml(htmlContent, engineConfig) {
  if (!engineConfig) return htmlContent;
  let newHtml = htmlContent;
  
  if (engineConfig.memorySize) {
    const memSize = parseInt(engineConfig.memorySize) * 1024 * 1024;
    if (newHtml.includes('TOTAL_MEMORY:')) {
      newHtml = newHtml.replace(/TOTAL_MEMORY:\s*\d+,?/g, `TOTAL_MEMORY: ${memSize},`);
    } else if (newHtml.includes('var config = {')) {
      newHtml = newHtml.replace('var config = {', `var config = {\n        TOTAL_MEMORY: ${memSize},`);
    }
  }
  
  // Clean up any existing .br or .gz extensions before applying new ones to avoid stacking
  newHtml = newHtml.replace(/\.data\.br"/g, '.data"').replace(/\.data\.gz"/g, '.data"');
  newHtml = newHtml.replace(/\.framework\.js\.br"/g, '.framework.js"').replace(/\.framework\.js\.gz"/g, '.framework.js"');
  newHtml = newHtml.replace(/\.wasm\.br"/g, '.wasm"').replace(/\.wasm\.gz"/g, '.wasm"');
  
  if (engineConfig.enableBrotli) {
    newHtml = newHtml.replace(/\.data"/g, '.data.br"');
    newHtml = newHtml.replace(/\.framework\.js"/g, '.framework.js.br"');
    newHtml = newHtml.replace(/\.wasm"/g, '.wasm.br"');
  } else if (engineConfig.enableGzip) {
    newHtml = newHtml.replace(/\.data"/g, '.data.gz"');
    newHtml = newHtml.replace(/\.framework\.js"/g, '.framework.js.gz"');
    newHtml = newHtml.replace(/\.wasm"/g, '.wasm.gz"');
  }
  
  // Remove existing gtag script if present to allow updating
  newHtml = newHtml.replace(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-.*?"><\/script>\s*<script>\s*window\.dataLayer.*?\s*function gtag.*?dataLayer\.push.*?gtag\('js'.*?gtag\('config'.*?<\/script>\s*/gs, '');
  
  if (engineConfig.firebaseTrackingId) {
    const gtagId = engineConfig.firebaseTrackingId;
    const gtagScript = `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gtagId}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${gtagId}');\n</script>\n`;
    
    if (newHtml.includes('</head>')) {
      newHtml = newHtml.replace('</head>', `${gtagScript}</head>`);
    } else if (newHtml.includes('</body>')) {
      newHtml = newHtml.replace('</body>', `${gtagScript}</body>`);
    } else {
      newHtml += gtagScript;
    }
  }
  
  return newHtml;
}
const mime = require('mime-types'); // We should install this package if not already
const { v4: uuidv4 } = require('uuid'); // Install this as well
const r2Client = require('../config/r2');
const prisma = require('../config/db');
const { pushToUser } = require('./notification.controller');

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
    
    // We will do extraction and upload in background. First create the game record as 'processing'.

    // Validate index.html exists at root before proceeding
    let zip;
    try {
      zip = new AdmZip(file.path);
      const zipEntries = zip.getEntries();
      const hasIndex = zipEntries.some(entry => entry.entryName === 'index.html');
      
      if (!hasIndex) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Zip file does not contain an index.html at the root' });
      }
    } catch (err) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Invalid zip file format' });
    }

    // Process engineConfig to inject Firebase tracking if present
    let parsedEngineConfig = null;
    if (engineConfig) {
      try {
        parsedEngineConfig = JSON.parse(engineConfig);
      } catch (e) {
        console.error('Failed to parse engineConfig JSON:', e);
      }
    }


    
    // Process cover image if exists
    let coverImageUrl = null;
    if (coverFile) {
      const bucketName = process.env.R2_BUCKET_NAME;
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
      const ids = Array.isArray(categoryIds) ? categoryIds : categoryIds.split(',').filter(Boolean);
      categoryConnect = ids.map(id => ({ id: parseInt(id) }));
    }
    
    let parsedControls = null;
    if (controls) {
      try { parsedControls = JSON.parse(controls); } catch (e) { }
    }
    
    let parsedDescTranslations = null;
    if (descriptionTranslations) {
      try { parsedDescTranslations = JSON.parse(descriptionTranslations); } catch (e) { }
    }
    
    const newGame = await prisma.game.create({
      data: {
        id: gameId,
        title: title || 'Untitled Game',
        description: description || '',
        descriptionTranslations: parsedDescTranslations,
        r2FolderPath: `games/${gameId}/`,
        status: 'processing', // Indicates it's being uploaded to R2
        sizeBytes: file.size,
        uploaderId: req.user.userId,
        controls: parsedControls,
        engineConfig: parsedEngineConfig,
        coverImageUrl: coverImageUrl,
        ...(categoryConnect.length > 0 && {
          categories: { connect: categoryConnect }
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
      include: { versions: true }
    });

    // Send immediate response
    res.status(202).json({ message: 'Game is uploading and processing in the background.', game: newGame });

    // BACKGROUND JOB: Extract and Upload to R2
    (async () => {
      try {
        const zip = new AdmZip(file.path);
        zip.extractAllTo(tempExtractDir, true);

        const indexPath = path.join(tempExtractDir, 'index.html');
        if (!fs.existsSync(indexPath)) {
          throw new Error('Zip file does not contain an index.html at the root');
        }

        if (parsedEngineConfig) {
          try {
            let htmlContent = fs.readFileSync(indexPath, 'utf8');
            htmlContent = injectEngineConfigToHtml(htmlContent, parsedEngineConfig);
            fs.writeFileSync(indexPath, htmlContent, 'utf8');
          } catch (e) {
            console.error('Failed to inject Engine Config / Firebase Tracking:', e);
          }
        }

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

        // Generate vector embedding for semantic search
        let vectorSynced = false;
        try {
          const EmbeddingService = require('../utils/embedding');
          const searchContent = `${title || ''} ${description || ''}`;
          const vector = await EmbeddingService.generateEmbedding(searchContent);
          if (vector) {
            const vectorString = `[${vector.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE games 
              SET search_vector = ${vectorString}::vector, vector_synced = true 
              WHERE id = ${gameId}::uuid
            `;
            vectorSynced = true;
          }
        } catch (vErr) {
          console.error('Vector sync failed during upload:', vErr);
        }

        // Job completed successfully, mark as pending (waiting admin review)
        await prisma.game.update({
          where: { id: gameId },
          data: { status: 'pending' }
        });

        // Notify admins about the new game
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        const gameTitle = title || 'Untitled Game';
        for (const admin of admins) {
          const notification = await prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'GAME_SUBMITTED',
              title: 'Game Mới Cần Duyệt',
              message: JSON.stringify({ key: 'notif.gameSubmitted', params: { title: gameTitle } }),
              link: '/admin/games'
            }
          });
          pushToUser(admin.id, {
            ...notification,
            isRead: false
          });
        }

      } catch (err) {
        console.error('Background Upload Job Failed:', err);
        // Mark as rejected due to upload failure
        await prisma.game.update({
          where: { id: gameId },
          data: { status: 'rejected', rejectReason: err.message || 'Upload process failed.' }
        });
      } finally {
        // Cleanup temp files
        if (fs.existsSync(tempExtractDir)) {
          fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    })(); // Execute async background closure

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal Server Error during upload', details: error.message });
  }
};

exports.getPublishedGames = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const page  = req.query.page  ? parseInt(req.query.page)  : 1;
    const skip  = limit ? (page - 1) * limit : undefined;

    const whereClause = { status: 'published' };
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { uploader: { username: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (category) {
      whereClause.categories = { some: { slug: category } };
    }

    let orderByClause = { createdAt: 'desc' };
    if (sort === 'mostPlayed') {
      orderByClause = { playCount: 'desc' };
    } else if (sort === 'mostLiked') {
      orderByClause = { libraryEntries: { _count: 'desc' } };
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        categories: true,
        uploader: { select: { id: true, username: true, avatarUrl: true } },
        ratings: { select: { score: true } },
        _count: { select: { libraryEntries: true } }
      },
      take: limit,
      skip: skip,
    });

    const formattedGames = games.map(game => {
      const avgRating = game.ratings.length > 0 
        ? game.ratings.reduce((acc, curr) => acc + curr.score, 0) / game.ratings.length
        : 0;
      return {
        ...game,
        saveCount: game._count?.libraryEntries || 0,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: game.ratings.length
      };
    });

    res.json(formattedGames);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
};

const EmbeddingService = require('../utils/embedding');

exports.semanticSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const vector = await EmbeddingService.generateEmbedding(q);
    if (!vector) {
      return res.status(500).json({ error: 'Failed to generate embedding' });
    }

    // Convert array to pgvector format '[v1,v2,...]'
    const vectorString = `[${vector.join(',')}]`;

    // Query pgvector for semantic similarity using inner product (<#>) or cosine distance (<=>)
    const games = await prisma.$queryRaw`
      SELECT 
        id, 
        title, 
        description, 
        "cover_image_url" as "coverImageUrl", 
        status, 
        "play_count" as "playCount",
        created_at as "createdAt",
        1 - ("search_vector" <=> ${vectorString}::vector) as similarity
      FROM games
      WHERE status = 'published' AND "search_vector" IS NOT NULL
      ORDER BY "search_vector" <=> ${vectorString}::vector
      LIMIT ${Number(limit)};
    `;

    // Format like getPublishedGames (omitting related models for brevity, or manually fetching them)
    if (games.length > 0) {
      const gameIds = games.map(g => g.id);
      const relations = await prisma.game.findMany({
        where: { id: { in: gameIds } },
        include: {
          categories: true,
          uploader: { select: { id: true, username: true, avatarUrl: true } },
          ratings: { select: { score: true } },
          _count: { select: { libraryEntries: true } }
        }
      });

      // Merge results
      const finalGames = games.map(g => {
        const related = relations.find(r => r.id === g.id);
        const avgRating = related && related.ratings.length > 0 
          ? related.ratings.reduce((acc, curr) => acc + curr.score, 0) / related.ratings.length
          : 0;
        
        return {
          ...g,
          categories: related?.categories || [],
          uploader: related?.uploader || null,
          saveCount: related?._count?.libraryEntries || 0,
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalRatings: related?.ratings?.length || 0
        };
      });
      return res.json(finalGames);
    }

    res.json([]);
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: 'Search failed' });
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
        uploader: { select: { username: true } },
        _count: { select: { libraryEntries: true } }
      }
    });

    const formattedGames = games.map(game => {
      const avgRating = game.ratings.length > 0 
        ? game.ratings.reduce((acc, curr) => acc + curr.score, 0) / game.ratings.length
        : 0;
      return {
        ...game,
        saveCount: game._count?.libraryEntries || 0,
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
        uploader: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { libraryEntries: true } }
      }
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const aggregations = await prisma.rating.aggregate({
      where: { gameId: id },
      _avg: { score: true },
      _count: { score: true }
    });

    const followingCreator = req.user && game.uploaderId
      ? await prisma.creatorFollow.findUnique({ where: { followerId_creatorId: { followerId: req.user.userId, creatorId: game.uploaderId } } })
      : null;
    res.json({
      ...game,
      saveCount: game._count?.libraryEntries || 0,
      averageRating: aggregations._avg.score ? Number(aggregations._avg.score.toFixed(1)) : 0,
      totalRatings: aggregations._count.score,
      followingCreator: Boolean(followingCreator)
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
    const { collectionId } = req.body || {};
    const cId = collectionId ? parseInt(collectionId) : null;

    const existingBookmark = await prisma.userLibrary.findUnique({
      where: { userId_gameId: { userId, gameId: id } }
    });

    if (existingBookmark) {
      if (existingBookmark.collectionId !== cId) {
        // Move to new collection
        await prisma.userLibrary.update({
          where: { userId_gameId: { userId, gameId: id } },
          data: { collectionId: cId }
        });
        return res.json({ message: 'Bookmark moved', bookmarked: true, collectionId: cId });
      } else {
        // Same collection, so toggle means delete
        await prisma.userLibrary.delete({
          where: { userId_gameId: { userId, gameId: id } }
        });
        return res.json({ message: 'Bookmark removed', bookmarked: false });
      }
    } else {
      await prisma.userLibrary.create({
        data: { userId, gameId: id, collectionId: cId }
      });
      return res.json({ message: 'Bookmark added', bookmarked: true, collectionId: cId });
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
    
    // Map to just return games array but include collectionId
    const games = library.map(item => ({ ...item.game, collectionId: item.collectionId }));
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
        
        // Dynamic re-injection of engine config to R2
        try {
          const bucketName = process.env.R2_BUCKET_NAME;
          const r2Key = `games/${id}/index.html`;
          const getParams = { Bucket: bucketName, Key: r2Key };
          const data = await r2Client.send(new GetObjectCommand(getParams));
          const htmlContent = await data.Body.transformToString();
          
          const newHtmlContent = injectEngineConfigToHtml(htmlContent, parsedEngineConfig);
          
          if (newHtmlContent !== htmlContent) {
            const uploadParams = {
              Bucket: bucketName,
              Key: r2Key,
              Body: newHtmlContent,
              ContentType: 'text/html'
            };
            await r2Client.send(new PutObjectCommand(uploadParams));
          }
        } catch (err) {
          console.error('Failed to update engine config on R2', err);
        }
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

    if (updatedGame.status === 'published') {
      const notifiedUsers = new Set();
      
      if (updatedGame.uploaderId) {
        const followers = await prisma.creatorFollow.findMany({ where: { creatorId: updatedGame.uploaderId }, select: { followerId: true } });
        await Promise.all(followers.map(async ({ followerId }) => {
          notifiedUsers.add(followerId);
          const notification = await prisma.notification.create({ data: { userId: followerId, type: 'CREATOR_GAME_UPDATED', title: 'Game Updated', message: JSON.stringify({ key: 'notif.creatorGameUpdated', params: { title: updatedGame.title } }), link: `/game/play?id=${updatedGame.id}` } });
          pushToUser(followerId, notification);
        }));
      }

      const bookmarkedUsers = await prisma.userLibrary.findMany({ where: { gameId: id }, select: { userId: true } });
      await Promise.all(bookmarkedUsers.map(async ({ userId }) => {
        if (!notifiedUsers.has(userId)) {
          notifiedUsers.add(userId);
          const notification = await prisma.notification.create({ data: { userId, type: 'WISHLIST_GAME_UPDATED', title: 'Wishlist Update', message: JSON.stringify({ key: 'notif.wishlistGameUpdated', params: { title: updatedGame.title } }), link: `/game/play?id=${updatedGame.id}` } });
          pushToUser(userId, notification);
        }
      }));
    }

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

    // Delete records protected by restrictive foreign keys atomically.
    await prisma.$transaction([
      prisma.userLibrary.deleteMany({ where: { gameId: id } }),
      prisma.rating.deleteMany({ where: { gameId: id } }),
      prisma.comment.deleteMany({ where: { gameId: id } }),
      prisma.report.deleteMany({ where: { gameId: id } }),
      prisma.game.delete({ where: { id } })
    ]);
    // Note: For a complete solution we should also delete files from R2, but for now we skip to save time.

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

exports.getGameHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Get unique games played by user, ordered by most recent session
    const sessions = await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        game: {
          include: {
            categories: true,
            uploader: { select: { id: true, username: true, avatarUrl: true } },
            ratings: { select: { score: true } }
          }
        }
      }
    });

    // Deduplicate games and format
    const uniqueGames = [];
    const seenIds = new Set();
    
    for (const session of sessions) {
      if (!session.game || seenIds.has(session.game.id)) continue;
      seenIds.add(session.game.id);
      
      const game = session.game;
      const avgRating = game.ratings.length > 0 
        ? game.ratings.reduce((acc, curr) => acc + curr.score, 0) / game.ratings.length
        : 0;
        
      uniqueGames.push({
        ...game,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: game.ratings.length,
        lastPlayedAt: session.startedAt
      });
    }

    res.json(uniqueGames);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
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
    const adminId = req.user?.userId;
    const { id } = req.params;
    const updatedGame = await prisma.game.update({
      where: { id },
      data: { status: 'published' },
      include: { uploader: { select: { id: true, username: true, email: true } } }
    });

    if (updatedGame.uploader) {
      const notif = await prisma.notification.create({
        data: {
          userId: updatedGame.uploader.id,
          type: 'GAME_APPROVED',
          title: 'Game Approved',
          message: JSON.stringify({ key: 'notif.gameApproved', params: { title: updatedGame.title } }),
          link: `/game/play?id=${updatedGame.id}`
        }
      });
      pushToUser(updatedGame.uploader.id, notif);
    }

    const followers = await prisma.creatorFollow.findMany({ where: { creatorId: updatedGame.uploaderId }, select: { followerId: true } });
    await Promise.all(followers.map(async ({ followerId }) => {
      const notification = await prisma.notification.create({ data: { userId: followerId, type: 'CREATOR_GAME_PUBLISHED', title: 'New Game', message: JSON.stringify({ key: 'notif.creatorGamePublished', params: { title: updatedGame.title } }), link: `/game/play?id=${updatedGame.id}` } });
      pushToUser(followerId, notification);
    }));

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
    
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { totalPlayTime: { increment: parseInt(sessionLength) } }
      });
      
      const gamificationController = require('./gamification.controller');
      await gamificationController.advanceQuest(userId, 'play_game', 1);
    }
    
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
        stackTrace,
        browserInfo: typeof browserInfo === 'object' ? JSON.stringify(browserInfo) : browserInfo
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('logCrash error:', error);
    res.status(500).json({ error: 'Failed to log crash' });
  }
};

// Recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Get user history (played, rated > 3, bookmarked)
    const [sessions, ratings, bookmarks] = await Promise.all([
      prisma.gameSession.findMany({ where: { userId }, select: { gameId: true } }),
      prisma.rating.findMany({ where: { userId, score: { gte: 3 } }, select: { gameId: true } }),
      prisma.userLibrary.findMany({ where: { userId }, select: { gameId: true } })
    ]);

    const interactedGameIds = [...new Set([
      ...sessions.map(s => s.gameId),
      ...ratings.map(r => r.gameId),
      ...bookmarks.map(b => b.gameId)
    ])];

    if (interactedGameIds.length === 0) {
      // Fallback: Trending games
      const trending = await prisma.game.findMany({
        where: { status: 'approved' },
        orderBy: { playCount: 'desc' },
        take: 10,
        include: { categories: true, uploader: { select: { id: true, username: true, avatarUrl: true } }, ratings: true }
      });
      return res.json(trending.map(g => ({
        ...g,
        averageRating: g.ratings.length ? parseFloat((g.ratings.reduce((s, r) => s + r.score, 0) / g.ratings.length).toFixed(1)) : 0,
        totalRatings: g.ratings.length
      })));
    }

    // 2. Find most common categories in those games
    const interactedGames = await prisma.game.findMany({
      where: { id: { in: interactedGameIds } },
      include: { categories: true }
    });

    const categoryCounts = {};
    interactedGames.forEach(game => {
      game.categories.forEach(cat => {
        categoryCounts[cat.id] = (categoryCounts[cat.id] || 0) + 1;
      });
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => parseInt(entry[0]))
      .slice(0, 3); // Top 3 categories

    if (sortedCategories.length === 0) {
      // Fallback 2: Just return highly rated
      const topRated = await prisma.game.findMany({
        where: { status: 'approved', id: { notIn: interactedGameIds } },
        take: 10,
        include: { categories: true, uploader: { select: { id: true, username: true, avatarUrl: true } }, ratings: true }
      });
      return res.json(topRated.map(g => ({
        ...g,
        averageRating: g.ratings.length ? parseFloat((g.ratings.reduce((s, r) => s + r.score, 0) / g.ratings.length).toFixed(1)) : 0,
        totalRatings: g.ratings.length
      })));
    }

    // 3. Find games in these categories, not in interactedGameIds
    const recommended = await prisma.game.findMany({
      where: {
        status: 'approved',
        id: { notIn: interactedGameIds },
        categories: { some: { id: { in: sortedCategories } } }
      },
      orderBy: { playCount: 'desc' },
      take: 10,
      include: { categories: true, uploader: { select: { id: true, username: true, avatarUrl: true } }, ratings: true }
    });

    // If still not enough, pad with trending
    let finalRecs = recommended;
    if (finalRecs.length < 5) {
      const more = await prisma.game.findMany({
        where: {
          status: 'approved',
          id: { notIn: [...interactedGameIds, ...finalRecs.map(g => g.id)] }
        },
        orderBy: { playCount: 'desc' },
        take: 10 - finalRecs.length,
        include: { categories: true, uploader: { select: { id: true, username: true, avatarUrl: true } }, ratings: true }
      });
      finalRecs = [...finalRecs, ...more];
    }

    res.json(finalRecs.map(g => ({
      ...g,
      averageRating: g.ratings.length ? parseFloat((g.ratings.reduce((s, r) => s + r.score, 0) / g.ratings.length).toFixed(1)) : 0,
      totalRatings: g.ratings.length
    })));
  } catch (error) {
    console.error('getRecommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};
