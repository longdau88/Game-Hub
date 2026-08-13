const prisma = require('../config/db');
const auditLogService = require('../services/audit.service');

exports.createReport = async (req, res) => {
  try {
    const { gameId, reason } = req.body;
    const userId = req.user.userId;

    if (!gameId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const report = await prisma.report.create({
      data: {
        userId,
        gameId,
        reason
      }
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        game: { select: { id: true, title: true, coverImageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.update({
      where: { id: parseInt(id) },
      data: { status: 'resolved' }
    });
    await auditLogService.log(req.user.userId, 'RESOLVE_REPORT', 'Report', {
      reportId: report.id, gameId: report.gameId, reporterId: report.userId
    });
    res.json({ message: 'Report resolved successfully', report });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};
