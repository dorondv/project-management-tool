import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/dashboard/initial-data - Get all initial data in one optimized request
router.get('/initial-data', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    console.log('📊 Fetching initial dashboard data...', userId ? `for user: ${userId}` : 'for all users');
    const startTime = Date.now();

    const projectWhere = userId
      ? {
          OR: [
            { createdBy: userId },
            { members: { some: { userId } } },
          ],
        }
      : undefined;

    const taskWhere = userId
      ? {
          OR: [
            { createdBy: userId },
            { assignees: { some: { userId } } },
            ...(projectWhere ? [{ project: projectWhere }] : []),
          ],
        }
      : undefined;

    const timeEntryWhere = userId ? { userId } : {};
    const notificationWhere = userId ? { userId } : {};
    const activityWhere = userId ? { userId } : {};

    const fetchWithTiming = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
      const labelWithPadding = label.padEnd(15, ' ');
      const started = Date.now();
      const result = await fn();
      const duration = Date.now() - started;
      console.log(`   ⏱️ ${labelWithPadding}: ${duration}ms`);
      return result;
    };

    console.log('   ▶️ Running parallel queries (connection_limit=10 allows parallel execution)...');

    // Run independent queries in parallel for better performance
    const [
      projects,
      tasks,
      customers,
      timeEntries,
      incomes,
      notifications,
      activities,
    ] = await Promise.all([
      fetchWithTiming('projects', () =>
        prisma.project.findMany({
          ...(projectWhere && { where: projectWhere }),
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
          take: 500,
        })
      ),
      fetchWithTiming('tasks', () =>
        prisma.task.findMany({
          ...(taskWhere && { where: taskWhere }),
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
              take: 10,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
      ),
      fetchWithTiming('customers', () =>
        prisma.customer.findMany({
          orderBy: { createdAt: 'desc' },
          take: 500,
        })
      ),
      fetchWithTiming('timeEntries', () =>
        prisma.timeEntry.findMany({
          where: timeEntryWhere,
          select: {
            id: true,
            customerId: true,
            projectId: true,
            taskId: true,
            description: true,
            startTime: true,
            endTime: true,
            duration: true,
            hourlyRate: true,
            income: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
      ),
      fetchWithTiming('incomes', () =>
        prisma.income.findMany({
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
      ),
      fetchWithTiming('notifications', () =>
        prisma.notification.findMany({
          where: notificationWhere,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            userId: true,
            read: true,
            relatedId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      ),
      fetchWithTiming('activities', () =>
        prisma.activity.findMany({
          where: activityWhere,
          select: {
            id: true,
            type: true,
            description: true,
            userId: true,
            projectId: true,
            taskId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        })
      ),
    ]);

    const users: any[] = [];

    // Transform data to match frontend format
    const transformedProjects = projects.map(project => ({
      ...project,
      members: project.members.map(m => m.user),
      tasks: [], // Tasks are fetched separately
    }));

    const transformedTasks = tasks.map(task => ({
      ...task,
      assignedTo: task.assignees.map(a => a.user),
      comments: [], // Comments loaded on demand
      attachments: [], // Attachments loaded on demand
      tags: task.tags.map(t => t.tag),
    }));

    const response = {
      users,
      projects: transformedProjects,
      tasks: transformedTasks,
      customers,
      timeEntries,
      incomes,
      notifications,
      activities,
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Initial data fetched in ${duration}ms:`, {
      users: users.length,
      projects: transformedProjects.length,
      tasks: transformedTasks.length,
      customers: customers.length,
      timeEntries: timeEntries.length,
      incomes: incomes.length,
      notifications: notifications.length,
      activities: activities.length,
    });

    res.json(response);
  } catch (error: any) {
    console.error('❌ Failed to fetch initial data:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({
      error: 'Failed to fetch initial data',
      details: error.message,
      code: error.code,
    });
  }
});

export { router as dashboardRouter };

