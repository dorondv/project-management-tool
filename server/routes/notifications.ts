import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/notifications - Get all notifications
router.get('/', async (req, res) => {
  try {
    const { userId, read } = req.query;
    const where: any = {};
    if (userId) where.userId = userId as string;
    if (read !== undefined) where.read = read === 'true';
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// POST /api/notifications - Create notification
router.post('/', async (req, res) => {
  try {
    const notification = await prisma.notification.create({
      data: req.body,
    });
    res.status(201).json(notification);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create notification', details: error.message });
  }
});

// PUT /api/notifications/:id - Update notification (e.g., mark as read)
router.put('/:id', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(notification);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export { router as notificationsRouter };

