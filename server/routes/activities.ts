import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/activities - Get all activities
router.get('/', async (req, res) => {
  try {
    const { userId, projectId, taskId } = req.query;
    const where: any = {};
    if (userId) where.userId = userId as string;
    if (projectId) where.projectId = projectId as string;
    if (taskId) where.taskId = taskId as string;
    
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST /api/activities - Create activity
router.post('/', async (req, res) => {
  try {
    const activity = await prisma.activity.create({
      data: req.body,
      include: {
        user: true,
      },
    });
    res.status(201).json(activity);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create activity', details: error.message });
  }
});

export { router as activitiesRouter };

