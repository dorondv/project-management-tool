import { Router } from 'express';
import { prisma } from '../index.js';
import { generateRecurringInstances, RecurrenceConfig } from '../utils/recurrenceService.js';
import { createDeadlineReminder } from '../utils/notificationService.js';

const router = Router();

/**
 * Expand recurring events into instances for a date range
 */
function expandRecurringEvents(events: any[], rangeStart: Date, rangeEnd: Date): any[] {
  const expanded: any[] = [];

  for (const event of events) {
    if (event.recurrenceType === 'none') {
      // Single event - include if it falls within range
      if (event.startDate >= rangeStart && event.startDate <= rangeEnd) {
        expanded.push(event);
      }
    } else {
      // Recurring event - generate instances
      const config: RecurrenceConfig = {
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : null,
        recurrenceType: event.recurrenceType,
        recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null,
        recurrenceCount: event.recurrenceCount,
      };

      const instances = generateRecurringInstances(config, rangeStart, rangeEnd);
      
      for (const instance of instances) {
        expanded.push({
          ...event,
          startDate: instance.startDate,
          endDate: instance.endDate,
          // Mark as instance of recurring event
          isRecurringInstance: true,
          originalEventId: event.id,
        });
      }
    }
  }

  return expanded;
}

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, customerId, projectId, taskId } = req.query;
    
    // Build where clause
    const where: any = {};
    
    if (userId) {
      where.userId = userId as string;
    }
    
    if (customerId) {
      where.customerId = customerId as string;
    }
    
    if (projectId) {
      where.projectId = projectId as string;
    }
    
    if (taskId) {
      where.taskId = taskId as string;
    }

    // If date range is provided, filter base events that could occur in that range
    if (startDate || endDate) {
      const rangeStart = startDate ? new Date(startDate as string) : new Date(0);
      const rangeEnd = endDate ? new Date(endDate as string) : new Date('2100-01-01');
      
      // For recurring events, we need to check if they could occur in the range
      // For now, we'll fetch all events and filter/expand them
      where.OR = [
        // Single events within range
        {
          recurrenceType: 'none',
          startDate: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        // Recurring events that start before or during range
        {
          recurrenceType: { not: 'none' },
          startDate: { lte: rangeEnd },
          OR: [
            { recurrenceEndDate: null },
            { recurrenceEndDate: { gte: rangeStart } },
          ],
        },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // If date range is provided, expand recurring events
    if (startDate || endDate) {
      const rangeStart = startDate ? new Date(startDate as string) : new Date(0);
      const rangeEnd = endDate ? new Date(endDate as string) : new Date('2100-01-01');
      const expanded = expandRecurringEvents(events, rangeStart, rangeEnd);
      return res.json(expanded);
    }

    res.json(events);
  } catch (error: any) {
    console.error('❌ Failed to fetch events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error: any) {
    console.error('❌ Failed to fetch event:', error);
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
});

// POST /api/events - Create event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      recurrenceType,
      recurrenceEndDate,
      recurrenceCount,
      meetingLink,
      userId,
      customerId,
      projectId,
      taskId,
    } = req.body;

    // Validation
    if (!title || !startDate || !userId) {
      return res.status(400).json({ error: 'Title, startDate, and userId are required' });
    }

    // Validate endDate is after startDate if provided
    if (endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Validate recurrence end date
    if (recurrenceEndDate && new Date(recurrenceEndDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'Recurrence end date must be after start date' });
    }

    // Validate recurrence count
    if (recurrenceCount !== undefined && recurrenceCount !== null && recurrenceCount < 1) {
      return res.status(400).json({ error: 'Recurrence count must be at least 1' });
    }

    // Validate optional relations exist
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    // Validate meeting link format if provided
    if (meetingLink) {
      try {
        new URL(meetingLink);
      } catch {
        return res.status(400).json({ error: 'Invalid meeting link format' });
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        recurrenceType: recurrenceType || 'none',
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        recurrenceCount: recurrenceCount || null,
        meetingLink: meetingLink || null,
        userId,
        customerId: customerId || null,
        projectId: projectId || null,
        taskId: taskId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create notification for event (if it has a start time)
    if (!allDay && startDate) {
      try {
        const eventDate = new Date(startDate);
        const now = new Date();
        const minutesUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60));
        
        // Create notification 15 minutes before event (or immediately if less than 15 minutes away)
        const reminderMinutes = Math.max(15, minutesUntilEvent);
        
        await prisma.notification.create({
          data: {
            type: 'event_reminder',
            title: 'Event Reminder',
            message: `Event "${title}" is starting ${reminderMinutes <= 15 ? 'now' : `in ${reminderMinutes} minutes`}`,
            userId,
            relatedId: event.id,
            read: false,
          },
        });
      } catch (notificationError) {
        console.error('⚠️ Failed to create event notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    res.status(201).json(event);
  } catch (error: any) {
    console.error('❌ Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      recurrenceType,
      recurrenceEndDate,
      recurrenceCount,
      meetingLink,
      customerId,
      projectId,
      taskId,
    } = req.body;

    // Validation
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    if (recurrenceEndDate && startDate && new Date(recurrenceEndDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'Recurrence end date must be after start date' });
    }

    if (recurrenceCount !== undefined && recurrenceCount !== null && recurrenceCount < 1) {
      return res.status(400).json({ error: 'Recurrence count must be at least 1' });
    }

    // Validate optional relations exist
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    // Validate meeting link format if provided
    if (meetingLink) {
      try {
        new URL(meetingLink);
      } catch {
        return res.status(400).json({ error: 'Invalid meeting link format' });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(allDay !== undefined && { allDay }),
        ...(recurrenceType !== undefined && { recurrenceType }),
        ...(recurrenceEndDate !== undefined && { recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null }),
        ...(recurrenceCount !== undefined && { recurrenceCount }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(customerId !== undefined && { customerId: customerId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(taskId !== undefined && { taskId: taskId || null }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json(updatedEvent);
  } catch (error: any) {
    console.error('❌ Failed to update event:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('❌ Failed to delete event:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

export { router as eventsRouter };

