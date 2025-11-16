import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/timers - Get all active timers
router.get('/', async (req, res) => {
  try {
    const { userId, customerId } = req.query;
    const where: any = { isRunning: true };
    if (userId) where.userId = userId as string;
    if (customerId) where.customerId = customerId as string;
    
    const timers = await prisma.activeTimer.findMany({
      where,
      include: {
        customer: true,
        user: true,
      },
      orderBy: { startTime: 'desc' },
    });
    res.json(timers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timers' });
  }
});

// GET /api/timers/:id - Get timer by ID
router.get('/:id', async (req, res) => {
  try {
    const timer = await prisma.activeTimer.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        user: true,
      },
    });
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    res.json(timer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timer' });
  }
});

// POST /api/timers - Start timer
router.post('/', async (req, res) => {
  try {
    const { customerId, projectId, taskId, description, userId } = req.body;
    
    // Stop any existing running timers for this user
    await prisma.activeTimer.updateMany({
      where: {
        userId,
        isRunning: true,
      },
      data: {
        isRunning: false,
      },
    });
    
    const timer = await prisma.activeTimer.create({
      data: {
        customerId,
        projectId,
        taskId,
        description,
        startTime: new Date(),
        isRunning: true,
        userId,
      },
      include: {
        customer: true,
        user: true,
      },
    });
    res.status(201).json(timer);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to start timer', details: error.message });
  }
});

// PUT /api/timers/:id - Update timer (stop, update description, etc.)
router.put('/:id', async (req, res) => {
  try {
    const timer = await prisma.activeTimer.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        customer: true,
        user: true,
      },
    });
    res.json(timer);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Timer not found' });
    }
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

// DELETE /api/timers/:id - Stop/delete timer
router.delete('/:id', async (req, res) => {
  try {
    await prisma.activeTimer.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Timer not found' });
    }
    res.status(500).json({ error: 'Failed to delete timer' });
  }
});

export { router as timersRouter };

