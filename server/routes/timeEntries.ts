import { Router } from 'express';
import { prisma } from '../index.js';
import { withRetry } from '../utils/prismaRetry.js';

const router = Router();

// GET /api/time-entries - Get all time entries
router.get('/', async (req, res) => {
  try {
    const { customerId, projectId, userId } = req.query;
    const where: any = {};
    if (customerId) where.customerId = customerId as string;
    if (projectId) where.projectId = projectId as string;
    if (userId) where.userId = userId as string;
    
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        customer: true,
        task: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// GET /api/time-entries/:id - Get time entry by ID
router.get('/:id', async (req, res) => {
  try {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        task: true,
        user: true,
      },
    });
    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.json(timeEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time entry' });
  }
});

// POST /api/time-entries - Create time entry
router.post('/', async (req, res) => {
  const requestStartTime = Date.now();
  try {
    const { customerId, projectId, taskId, description, startTime: startTimeStr, endTime: endTimeStr, hourlyRate, userId } = req.body;
    
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000); // in seconds
    // Use Number() to ensure proper numeric conversion and handle large values
    const income = Number(((duration / 3600) * hourlyRate).toFixed(2));
    
    // Create time entry without includes for faster write
    // The frontend can fetch the full entry if needed
    const createStartTime = Date.now();
    const timeEntry = await withRetry(prisma, async () => {
      return await prisma.timeEntry.create({
        data: {
          customerId,
          projectId,
          taskId,
          description,
          startTime: start,
          endTime: end,
          duration,
          hourlyRate,
          income,
          userId,
        },
        // Removed includes for faster write - frontend can fetch separately if needed
      });
    });
    const createDuration = Date.now() - createStartTime;
    
    // Log slow saves for debugging (only in production or if > 5 seconds)
    if (createDuration > 5000 || process.env.NODE_ENV === 'production') {
      console.log(`⏱️  Time entry created in ${createDuration}ms (duration: ${duration}s, income: ${income})`);
    }
    
    // Fetch relations separately if needed (optional optimization)
    // For now, return the created entry without relations for faster response
    res.status(201).json(timeEntry);
  } catch (error: any) {
    const totalDuration = Date.now() - requestStartTime;
    console.error(`❌ Failed to create time entry after ${totalDuration}ms:`, error.message);
    res.status(500).json({ error: 'Failed to create time entry', details: error.message });
  }
});

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', async (req, res) => {
  try {
    const { startTime, endTime, hourlyRate, ...otherData } = req.body;
    const data: any = { ...otherData };
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      data.startTime = start;
      data.endTime = end;
      data.duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    }
    
    if (hourlyRate !== undefined) {
      data.hourlyRate = hourlyRate;
    }
    
    if (data.duration && data.hourlyRate) {
      data.income = (data.duration / 3600) * data.hourlyRate;
    }
    
    const timeEntry = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: true,
        task: true,
        user: true,
      },
    });
    res.json(timeEntry);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// DELETE /api/time-entries/:id - Delete time entry
router.delete('/:id', async (req, res) => {
  try {
    await prisma.timeEntry.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

export { router as timeEntriesRouter };

