import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    console.log('📝 Fetching all projects...');
    const { customerId } = req.query;
    const where = customerId ? { customerId: customerId as string } : {};
    
    // Optimized: Don't include tasks by default - they're fetched separately
    // This significantly reduces query time and data transfer
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        progress: true,
        priority: true,
        createdBy: true,
        customerId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        members: {
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
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit projects
    });
    
    console.log(`✅ Found ${projects.length} projects`);
    
    // Transform to match frontend format
    const transformedProjects = projects.map(project => ({
      ...project,
      members: project.members.map(m => m.user),
      tasks: [], // Tasks are fetched separately for better performance
    }));
    
    res.json(transformedProjects);
  } catch (error: any) {
    console.error('❌ Failed to fetch projects:', error);
    console.error('Error details:', { message: error.message, code: error.code });
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        creator: true,
        customer: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Transform to match frontend format
    const transformedProject = {
      ...project,
      members: project.members.map(m => m.user),
      tasks: project.tasks.map(task => ({
        ...task,
        assignedTo: task.assignees.map(a => a.user),
      })),
    };
    
    res.json(transformedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create project
router.post('/', async (req, res) => {
  try {
    const { title, description, startDate, endDate, status, progress, priority, createdBy, customerId, members } = req.body;
    
    console.log('📝 Project creation request:', {
      title,
      description,
      startDate,
      endDate,
      status,
      progress,
      priority,
      createdBy,
      customerId,
      membersCount: members?.length || 0
    });
    
    // Validate required fields
    if (!title || !startDate || !endDate || !createdBy) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'startDate', 'endDate', 'createdBy'],
        received: { title: !!title, startDate: !!startDate, endDate: !!endDate, createdBy: !!createdBy }
      });
    }
    
    const project = await prisma.project.create({
      data: {
        title,
        description: description || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'planning',
        progress: progress || 0,
        priority: priority || 'medium',
        createdBy,
        customerId: customerId || null,
        members: {
          create: (members || []).map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        creator: true,
        customer: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
    
    const transformedProject = {
      ...project,
      members: project.members.map(m => m.user),
      tasks: [],
    };
    
    console.log('✅ Project created successfully:', transformedProject.id);
    res.status(201).json(transformedProject);
  } catch (error: any) {
    console.error('❌ Failed to create project:', error);
    console.error('Error details:', { message: error.message, code: error.code, meta: error.meta });
    res.status(500).json({ error: 'Failed to create project', details: error.message, code: error.code });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { title, description, startDate, endDate, status, progress, priority, customerId, members } = req.body;
    
    // Use transaction for atomic updates with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      // Update project
      const project = await tx.project.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(status && { status }),
          ...(progress !== undefined && { progress }),
          ...(priority && { priority }),
          ...(customerId !== undefined && { customerId: customerId || null }),
        },
        include: {
          creator: true,
          customer: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });
      
      // Update members if provided
      if (members) {
        // Delete existing members
        await tx.projectMember.deleteMany({
          where: { projectId: req.params.id },
        });
        
        // Create new members
        if (members.length > 0) {
          await tx.projectMember.createMany({
            data: members.map((userId: string) => ({
              projectId: req.params.id,
              userId,
            })),
          });
        }
        
        // Fetch updated project (without tasks to keep transaction fast)
        const updatedProject = await tx.project.findUnique({
          where: { id: req.params.id },
          include: {
            creator: true,
            customer: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        });
        
        return updatedProject;
      }
      
      return project;
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot
      timeout: 15000, // Maximum time the transaction can run (15 seconds)
    });
    
    // Fetch tasks outside transaction to avoid timeout
    const projectWithTasks = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        creator: true,
        customer: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    
    const transformedProject = {
      ...projectWithTasks!,
      members: projectWithTasks!.members.map(m => m.user),
      tasks: projectWithTasks!.tasks ? projectWithTasks!.tasks.map((task: any) => ({
        ...task,
        assignedTo: task.assignees.map((a: any) => a.user),
      })) : [],
    };
    
    console.log('✅ Project updated successfully:', transformedProject.id);
    res.json(transformedProject);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('❌ Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    // Check if project exists first
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('❌ Failed to delete project:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

export { router as projectsRouter };

