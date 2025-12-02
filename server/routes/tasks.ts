import { Router } from 'express';
import { prisma } from '../index.js';
import { createDeadlineReminder } from '../utils/notificationService.js';

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
    
    // Check if deadline reminder should be created
    const taskUserId = createdBy || task.assignees[0]?.userId;
    if (taskUserId) {
      console.log(`🔔 Attempting to create deadline reminder for task "${task.title}" (due: ${parsedDueDate.toISOString()}, userId: ${taskUserId})`);
      createDeadlineReminder(
        task.id,
        task.title,
        parsedDueDate,
        taskUserId
      ).catch(err => 
        console.error('❌ Failed to create deadline reminder after task creation:', err)
      );
    } else {
      console.log(`⚠️ Cannot create deadline reminder: no userId found (createdBy: ${createdBy}, assignees: ${task.assignees.length})`);
    }
    
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
    const { title, description, projectId, status, priority, dueDate, assignedTo, tags } = req.body;
    
    console.log(`📝 Updating task ${req.params.id}:`, { title, description, projectId, status, priority, dueDate, assignedTo, tags });
    
    // Build update data object - only include fields that are provided
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (status !== undefined) updateData.status = status; // Allow status updates even if empty string
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    
    console.log(`📝 Update data:`, updateData);
    
    // Update task (without transaction to avoid pgbouncer timeout issues)
    await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    console.log(`✅ Task ${req.params.id} updated successfully`);
    
    // Update assignees if provided
    if (assignedTo && Array.isArray(assignedTo)) {
      // Get current assignees
      const currentAssignees = await prisma.taskAssignee.findMany({
        where: { taskId: req.params.id },
        select: { userId: true },
      });
      // Normalize assignedTo to array of user ID strings
      const userIds = assignedTo.map((item: any) => {
        // If it's already a string, use it; if it's an object, extract the id
        return typeof item === 'string' ? item : (item?.id || item);
      }).filter(Boolean); // Remove any null/undefined values
      
      const currentUserIds = new Set(currentAssignees.map(a => a.userId));
      const newUserIds = new Set(userIds);
      
      // Find assignees to add and remove
      const toAdd = userIds.filter((userId: string) => !currentUserIds.has(userId));
      const toRemove = currentAssignees
        .map(a => a.userId)
        .filter((userId: string) => !newUserIds.has(userId));
      
      // Remove assignees that are no longer assigned
      if (toRemove.length > 0) {
        await prisma.taskAssignee.deleteMany({
          where: {
            taskId: req.params.id,
            userId: { in: toRemove },
          },
        });
      }
      
      // Add new assignees (only if they don't already exist)
      if (toAdd.length > 0) {
        await prisma.taskAssignee.createMany({
          data: toAdd.map((userId: string) => ({
            taskId: req.params.id,
            userId,
          })),
          skipDuplicates: true, // Prevent unique constraint errors
        });
      }
    }
    
    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      await prisma.taskTag.deleteMany({
        where: { taskId: req.params.id },
      });
      if (tags.length > 0) {
        await prisma.taskTag.createMany({
          data: tags.map((tag: string) => ({
            taskId: req.params.id,
            tag,
          })),
        });
      }
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
    
    // Check if deadline reminder should be created (if dueDate changed and task not completed)
    if (dueDate && updatedTask.status !== 'completed') {
      const taskUserId = updatedTask.createdBy || updatedTask.assignees[0]?.userId;
      if (taskUserId) {
        createDeadlineReminder(
          updatedTask.id,
          updatedTask.title,
          new Date(dueDate),
          taskUserId
        ).catch(err => 
          console.error('Failed to create deadline reminder after task update:', err)
        );
      }
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

