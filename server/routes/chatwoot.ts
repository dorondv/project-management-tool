import { Router } from 'express';
import { prisma } from '../index.js';
import {
  parseWebhookEvent,
  syncUserToChatwoot,
  getActiveConversationsCount,
} from '../utils/chatwootService.js';

const router = Router();

/**
 * Middleware to get user from headers (similar to other routes)
 */
async function authenticateUser(req: any, res: any, next: any) {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = userId;
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * POST /api/chatwoot/webhook - Chatwoot webhook endpoint
 * Handles incoming webhook events from Chatwoot
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = parseWebhookEvent(req.body);
    
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log('📥 Chatwoot webhook received:', event.event);

    // Process webhook asynchronously to respond quickly
    processWebhook(event).catch((error) => {
      console.error('Error processing Chatwoot webhook:', error);
    });

    // Respond immediately to Chatwoot
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling Chatwoot webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Process webhook event
 */
async function processWebhook(event: any) {
  try {
    const eventType = event.event;

    switch (eventType) {
      case 'message_created':
        await handleMessageCreated(event);
        break;

      case 'conversation_created':
        await handleConversationCreated(event);
        break;

      case 'conversation_status_changed':
        await handleConversationStatusChanged(event);
        break;

      default:
        console.log(`⚠️  Unhandled Chatwoot webhook event: ${eventType}`);
    }
  } catch (error: any) {
    console.error('Error processing Chatwoot webhook:', error);
  }
}

/**
 * Handle message_created event
 */
async function handleMessageCreated(event: any) {
  try {
    const message = event.message;
    const conversation = event.conversation;
    const contact = event.contact;

    if (!message || !conversation) {
      return;
    }

    console.log(`💬 Message created in conversation ${conversation.id}:`, {
      messageId: message.id,
      type: message.message_type,
      content: message.content?.substring(0, 50),
    });

    // If it's an incoming message (from user), you could:
    // - Send notification to admin
    // - Update user's support status
    // - Log for analytics

    // For now, we'll just log it
    if (message.message_type === 'incoming' && contact?.identifier) {
      // This is a message from one of our users
      console.log(`📨 User ${contact.identifier} sent a message`);
    }
  } catch (error: any) {
    console.error('Error handling message_created:', error);
  }
}

/**
 * Handle conversation_created event
 */
async function handleConversationCreated(event: any) {
  try {
    const conversation = event.conversation;
    const contact = event.contact;

    if (!conversation) {
      return;
    }

    console.log(`💬 New conversation created:`, {
      conversationId: conversation.id,
      displayId: conversation.display_id,
      status: conversation.status,
      contactId: contact?.id,
      contactIdentifier: contact?.identifier,
    });

    // If contact has an identifier (our user ID), we could:
    // - Link conversation to user in database
    // - Send welcome message
    // - Update user's support status

    if (contact?.identifier) {
      console.log(`🔗 Conversation linked to user: ${contact.identifier}`);
    }
  } catch (error: any) {
    console.error('Error handling conversation_created:', error);
  }
}

/**
 * Handle conversation_status_changed event
 */
async function handleConversationStatusChanged(event: any) {
  try {
    const conversation = event.conversation;

    if (!conversation) {
      return;
    }

    console.log(`🔄 Conversation status changed:`, {
      conversationId: conversation.id,
      status: conversation.status,
    });

    // Could update conversation status in database if tracking
  } catch (error: any) {
    console.error('Error handling conversation_status_changed:', error);
  }
}

/**
 * POST /api/chatwoot/sync-user - Sync a single user to Chatwoot
 * Requires authentication
 */
router.post('/sync-user', authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    const contact = await syncUserToChatwoot(
      user.id,
      user.name,
      user.email,
      user.role,
      user.avatar || undefined
    );

    if (contact) {
      res.json({
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
        },
      });
    } else {
      res.status(500).json({ error: 'Failed to sync user to Chatwoot' });
    }
  } catch (error: any) {
    console.error('Error syncing user to Chatwoot:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

/**
 * Middleware to authenticate and check admin role
 */
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.userId = userId;
    next();
  } catch (error: any) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * POST /api/chatwoot/sync-all-users - Sync all users to Chatwoot
 * Admin only - protected
 */
router.post('/sync-all-users', requireAdmin, async (req, res) => {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    console.log(`🔄 Syncing ${users.length} users to Chatwoot...`);

    const results = await Promise.allSettled(
      users.map((user) =>
        syncUserToChatwoot(
          user.id,
          user.name,
          user.email,
          user.role,
          user.avatar || undefined
        )
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`✅ Synced ${successful} users, ${failed} failed`);

    res.json({
      success: true,
      total: users.length,
      successful,
      failed,
    });
  } catch (error: any) {
    console.error('Error syncing all users to Chatwoot:', error);
    res.status(500).json({ error: 'Failed to sync users' });
  }
});

/**
 * GET /api/chatwoot/active-conversations-count - Get count of active conversations
 * For admin dashboard - protected
 */
router.get('/active-conversations-count', requireAdmin, async (req, res) => {
  try {
    const count = await getActiveConversationsCount();
    res.json({ count });
  } catch (error: any) {
    console.error('Error getting active conversations count:', error);
    res.status(500).json({ error: 'Failed to get conversations count' });
  }
});

export { router as chatwootRouter };
