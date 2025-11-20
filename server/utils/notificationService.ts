import { prisma } from '../index.js';

/**
 * Create a deadline reminder notification for a task
 * Only creates notification if deadline is within the reminder window
 */
export async function createDeadlineReminder(
  taskId: string,
  taskTitle: string,
  dueDate: Date,
  userId: string,
  reminderDays: number[] = [3, 1] // Default: remind 3 days before and 1 day before
): Promise<void> {
  try {
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`🔔 Checking deadline reminder for task "${taskTitle}":`, {
      taskId,
      dueDate: dueDate.toISOString(),
      now: now.toISOString(),
      daysUntilDue,
      reminderDays,
    });
    
    // Only create reminder if deadline is approaching (within reminder window)
    // and deadline hasn't passed
    if (daysUntilDue < 0) {
      console.log(`🔔 Skipping reminder: deadline has passed (${daysUntilDue} days)`);
      return; // Deadline has passed, no reminder needed
    }
    
    // Check if we should create a reminder based on daysUntilDue
    // For reminderDays [3, 1], create reminders when:
    // - daysUntilDue is 3 or less (within 3 days)
    // - daysUntilDue is 1 or less (within 1 day)
    // - daysUntilDue is 0 (due today)
    // We create a reminder if the task is due within any of the reminder windows
    const maxReminderDays = Math.max(...reminderDays);
    const shouldRemind = daysUntilDue <= maxReminderDays && daysUntilDue >= 0;
    
    if (!shouldRemind) {
      console.log(`🔔 Skipping reminder: not within reminder window (${daysUntilDue} days until due, max reminder window: ${maxReminderDays} days)`);
      return; // Not time for a reminder yet
    }
    
    // Check if notification already exists for this task and reminder day
    const existingNotification = await prisma.notification.findFirst({
      where: {
        type: 'deadline_approaching',
        userId,
        relatedId: taskId,
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
    });
    
    if (existingNotification) {
      return; // Already reminded recently
    }
    
    // Determine message based on days until due
    let message: string;
    if (daysUntilDue === 0) {
      message = `Task "${taskTitle}" is due today!`;
    } else if (daysUntilDue === 1) {
      message = `Task "${taskTitle}" is due tomorrow!`;
    } else {
      message = `Task "${taskTitle}" is due in ${daysUntilDue} days`;
    }
    
    // Create the notification
    await prisma.notification.create({
      data: {
        type: 'deadline_approaching',
        title: 'Deadline Approaching',
        message,
        userId,
        relatedId: taskId,
        read: false,
      },
    });
    
    console.log(`🔔 Created deadline reminder for task "${taskTitle}" (${daysUntilDue} days until due)`);
  } catch (error) {
    console.error('❌ Failed to create deadline reminder:', error);
    // Don't throw - notification creation failure shouldn't break task operations
  }
}

/**
 * Check all tasks for upcoming deadlines and create reminders
 * This can be called periodically (e.g., daily cron job)
 */
export async function checkAllUpcomingDeadlines(userId?: string): Promise<number> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    // Find all tasks with deadlines in the next 3 days that aren't completed
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: { not: 'completed' },
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
        ...(userId && {
          OR: [
            { createdBy: userId },
            { assignees: { some: { userId } } },
          ],
        }),
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
    });
    
    let remindersCreated = 0;
    
    for (const task of upcomingTasks) {
      // For single-user app, use task creator or first assignee
      const taskUserId = userId || task.createdBy || task.assignees[0]?.userId;
      
      if (!taskUserId) {
        continue;
      }
      
      // Create reminder for this task
      await createDeadlineReminder(
        task.id,
        task.title,
        task.dueDate,
        taskUserId,
        [3, 1] // Remind 3 days before and 1 day before
      );
      
      remindersCreated++;
    }
    
    console.log(`✅ Checked ${upcomingTasks.length} tasks, created ${remindersCreated} deadline reminders`);
    return remindersCreated;
  } catch (error) {
    console.error('❌ Failed to check upcoming deadlines:', error);
    return 0;
  }
}

