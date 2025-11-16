import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
  try {
    console.log('📝 Fetching all tasks...');
    const { projectId } = req.query;
    const where = projectId ? { projectId: projectId as string } : {};
    
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        creator: true,
        assignees: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Found ${tasks.length} tasks`);
    
    // Transform to match frontend format
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignedTo: task.assignees.map(a => a.user),
      comments: task.comments.map(comment => ({
        ...comment,
        user: comment.user,
      })),
      tags: task.tags.map(t => t.tag),
    }));
    
    res.json(transformedTasks);
  } catch (error: any) {
    console.error('❌ Failed to fetch tasks:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: 'Failed to fetch tasks', 
      details: error.message,
      code: error.code 
    });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        creator: true,
        assignees: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true,
        tags: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const transformedTask = {
      ...task,
      assignedTo: task.assignees.map(a => a.user),
      comments: task.comments.map(comment => ({
        ...comment,
        user: comment.user,
      })),
      tags: task.tags.map(t => t.tag),
    };
    
    res.json(transformedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, projectId, status, priority, dueDate, createdBy, assignedTo, tags } = req.body;
    
    console.log('📝 Task creation request:', {
      title,
      description,
      projectId,
      status,
      priority,
      dueDate,
      createdBy,
      assignedTo,
      tags
    });
    
    // Validate required fields
    if (!title || !projectId || !dueDate || !createdBy) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'projectId', 'dueDate', 'createdBy'],
        received: { title: !!title, projectId: !!projectId, dueDate: !!dueDate, createdBy: !!createdBy }
      });
    }
    
    // Validate projectId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.error('❌ Invalid projectId format:', projectId);
      return res.status(400).json({ 
        error: 'Invalid projectId format. Expected UUID.', 
        received: projectId 
      });
    }
    
    // Validate date
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: 'Invalid dueDate format', received: dueDate });
    }
    
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        projectId,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: parsedDueDate,
        createdBy,
        assignees: {
          create: (assignedTo || []).map((userId: string) => ({
            userId,
          })),
        },
        tags: {
          create: (tags || []).map((tag: string) => ({
            tag,
          })),
        },
      },
      include: {
        project: true,
        creator: true,
        assignees: {
          include: {
            user: true,
          },
        },
        comments: true,
        attachments: true,
        tags: true,
      },
    });
    
    const transformedTask = {
      ...task,
      assignedTo: task.assignees.map(a => a.user),
      comments: [],
      attachments: [],
      tags: task.tags.map(t => t.tag),
    };
    
    console.log('✅ Task created successfully:', transformedTask.id);
    res.status(201).json(transformedTask);
  } catch (error: any) {
    console.error('❌ Failed to create task:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: 'Failed to create task', 
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;
    
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
      include: {
        project: true,
        creator: true,
        assignees: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true,
        tags: true,
      },
    });
    
    // Update assignees if provided
    if (assignedTo) {
      await prisma.taskAssignee.deleteMany({
        where: { taskId: req.params.id },
      });
      await prisma.taskAssignee.createMany({
        data: assignedTo.map((userId: string) => ({
          taskId: req.params.id,
          userId,
        })),
      });
    }
    
    // Update tags if provided
    if (tags) {
      await prisma.taskTag.deleteMany({
        where: { taskId: req.params.id },
      });
      await prisma.taskTag.createMany({
        data: tags.map((tag: string) => ({
          taskId: req.params.id,
          tag,
        })),
      });
    }
    
    // Fetch updated task
    const updatedTask = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        creator: true,
        assignees: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true,
        tags: true,
      },
    });
    
    const transformedTask = {
      ...updatedTask!,
      assignedTo: updatedTask!.assignees.map(a => a.user),
      comments: updatedTask!.comments.map(comment => ({
        ...comment,
        user: comment.user,
      })),
      tags: updatedTask!.tags.map(t => t.tag),
    };
    
    res.json(transformedTask);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export { router as tasksRouter };

