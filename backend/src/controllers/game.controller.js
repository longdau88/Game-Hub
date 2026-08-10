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
    const { title, description, categoryIds } = req.body;
    const file = req.file;

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

    // Save to Database
    
    // Process categories
    let categoryConnect = [];
    if (categoryIds) {
      // categoryIds could be a comma-separated string or an array depending on how formData sends it
      const ids = Array.isArray(categoryIds) ? categoryIds : categoryIds.split(',').filter(Boolean);
      categoryConnect = ids.map(id => ({ id: parseInt(id) }));
    }
    
    const newGame = await prisma.game.create({
      data: {
        id: gameId,
        title: title || 'Untitled Game',
        description: description || '',
        r2FolderPath: `games/${gameId}/`,
        status: 'pending', // pending approval
        sizeBytes: file.size,
        uploaderId: req.user.id, // Fixed from req.user.userId
        ...(categoryConnect.length > 0 && {
          categories: {
            connect: categoryConnect
          }
        })
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
        uploader: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
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
    res.json(game);
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
      where: { uploaderId: req.user.id },
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
    const userId = req.user.id;

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
      where: { userId: req.user.id },
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


// Admin Endpoints
exports.getPendingGames = async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending games' });
  }
};

exports.approveGame = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGame = await prisma.game.update({
      where: { id },
      data: { status: 'published' }
    });
    res.json({ message: 'Game approved successfully', game: updatedGame });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve game' });
  }
};
