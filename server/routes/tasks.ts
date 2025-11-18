import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Helper function to calculate and update project progress based on completed tasks
async function updateProjectProgress(projectId: string) {
  try {
    // Get all tasks for the project
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { status: true },
    });

    if (tasks.length === 0) {
      // No tasks, set progress to 0
      await prisma.project.update({
        where: { id: projectId },
        data: { progress: 0 },
      });
      return 0;
    }

    // Calculate progress: (completed tasks / total tasks) * 100
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    // Update project progress
    await prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });

    return progress;
  } catch (error) {
    console.error('❌ Failed to update project progress:', error);
    // Don't throw - this is a background update
    return null;
  }
}

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
  try {
    console.log('📝 Fetching all tasks...');
    const { projectId } = req.query;
    const where = projectId ? { projectId: projectId as string } : {};
    
    // Optimized: Exclude comments and attachments by default (load on demand)
    // This significantly reduces query time and data transfer
    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        projectId: true,
        status: true,
        priority: true,
        dueDate: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        tags: {
          select: {
            id: true,
            tag: true,
          },
          take: 10, // Limit tags
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit tasks
    });
    
    console.log(`✅ Found ${tasks.length} tasks`);
    
    // Transform to match frontend format
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignedTo: task.assignees.map(a => a.user),
      comments: [], // Comments loaded on demand when viewing task details
      attachments: [], // Attachments loaded on demand when viewing task details
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
    
    // Update project progress asynchronously
    updateProjectProgress(projectId).catch(err => 
      console.error('Failed to update project progress after task creation:', err)
    );
    
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
    
    // Use transaction for atomic updates
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update task
      await tx.task.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
      });
      
      // Update assignees if provided
      if (assignedTo) {
        await tx.taskAssignee.deleteMany({
          where: { taskId: req.params.id },
        });
        await tx.taskAssignee.createMany({
          data: assignedTo.map((userId: string) => ({
            taskId: req.params.id,
            userId,
          })),
        });
      }
      
      // Update tags if provided
      if (tags) {
        await tx.taskTag.deleteMany({
          where: { taskId: req.params.id },
        });
        await tx.taskTag.createMany({
          data: tags.map((tag: string) => ({
            taskId: req.params.id,
            tag,
          })),
        });
      }
      
      // Fetch updated task
      return await tx.task.findUnique({
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
    });
    
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const transformedTask = {
      ...updatedTask,
      assignedTo: updatedTask.assignees.map(a => a.user),
      comments: updatedTask.comments.map(comment => ({
        ...comment,
        user: comment.user,
      })),
      tags: updatedTask.tags.map(t => t.tag),
    };
    
    // Update project progress if task status changed
    if (status) {
      updateProjectProgress(updatedTask.projectId).catch(err => 
        console.error('Failed to update project progress after task update:', err)
      );
    }
    
    res.json(transformedTask);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('❌ Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    // Check if task exists and get projectId
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: { id: true, projectId: true },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const projectId = task.projectId;
    
    // Delete task (cascade will handle related records)
    await prisma.task.delete({
      where: { id: req.params.id },
    });
    
    // Update project progress after task deletion
    updateProjectProgress(projectId).catch(err => 
      console.error('Failed to update project progress after task deletion:', err)
    );
    
    res.status(204).send();
  } catch (error: any) {
    console.error('❌ Failed to delete task:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
});

export { router as tasksRouter };

