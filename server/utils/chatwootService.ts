/**
 * Chatwoot API Service
 * Handles all interactions with Chatwoot API
 */

const CHATWOOT_API_BASE_URL = process.env.CHATWOOT_API_BASE_URL || 'https://app.chatwoot.com';
const CHATWOOT_API_ACCESS_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN || '';
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '';
const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID || '';

interface ChatwootContact {
  id?: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  custom_attributes?: Record<string, any>;
}

interface ChatwootConversation {
  id?: number;
  inbox_id: number;
  contact_id: number;
  source_id?: string;
  status?: 'open' | 'resolved' | 'pending';
  custom_attributes?: Record<string, any>;
}

interface ChatwootMessage {
  content: string;
  message_type: 'incoming' | 'outgoing';
  private?: boolean;
}

interface ChatwootWebhookEvent {
  event: string;
  id?: number;
  conversation?: {
    id: number;
    display_id: number;
    status: string;
    inbox_id: number;
  };
  message?: {
    id: number;
    content: string;
    message_type: string;
    created_at: string;
  };
  contact?: {
    id: number;
    identifier: string;
    email?: string;
    name?: string;
  };
  account?: {
    id: number;
  };
}

/**
 * Make API request to Chatwoot
 */
async function chatwootRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CHATWOOT_API_BASE_URL}/api/v1${endpoint}`;
  
  const headers: HeadersInit = {
    'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chatwoot API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    console.error(`Chatwoot API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Search for a contact by email or identifier
 */
export async function searchContact(
  email?: string,
  identifier?: string
): Promise<ChatwootContact | null> {
  try {
    if (email) {
      const response = await chatwootRequest<{ payload: ChatwootContact[] }>(
        `/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/search?q=${encodeURIComponent(email)}`
      );
      
      if (response.payload && response.payload.length > 0) {
        return response.payload[0];
      }
    }

    if (identifier) {
      const response = await chatwootRequest<{ payload: ChatwootContact[] }>(
        `/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/search?q=${encodeURIComponent(identifier)}`
      );
      
      if (response.payload && response.payload.length > 0) {
        return response.payload[0];
      }
    }

    return null;
  } catch (error: any) {
    console.error('Error searching Chatwoot contact:', error);
    return null;
  }
}

/**
 * Create a new contact in Chatwoot
 */
export async function createContact(
  contact: ChatwootContact
): Promise<ChatwootContact> {
  try {
    const response = await chatwootRequest<{ payload: ChatwootContact }>(
      `/accounts/${CHATWOOT_ACCOUNT_ID}/contacts`,
      {
        method: 'POST',
        body: JSON.stringify(contact),
      }
    );

    return response.payload;
  } catch (error: any) {
    console.error('Error creating Chatwoot contact:', error);
    throw error;
  }
}

/**
 * Update an existing contact in Chatwoot
 */
export async function updateContact(
  contactId: number,
  contact: Partial<ChatwootContact>
): Promise<ChatwootContact> {
  try {
    const response = await chatwootRequest<{ payload: ChatwootContact }>(
      `/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/${contactId}`,
      {
        method: 'PUT',
        body: JSON.stringify(contact),
      }
    );

    return response.payload;
  } catch (error: any) {
    console.error('Error updating Chatwoot contact:', error);
    throw error;
  }
}

/**
 * Create or update a contact (upsert)
 */
export async function createOrUpdateContact(
  contact: ChatwootContact
): Promise<ChatwootContact> {
  try {
    // Try to find existing contact
    const existing = await searchContact(contact.email, contact.identifier);

    if (existing && existing.id) {
      // Update existing contact
      return await updateContact(existing.id, contact);
    } else {
      // Create new contact
      return await createContact(contact);
    }
  } catch (error: any) {
    console.error('Error creating/updating Chatwoot contact:', error);
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  contactId: number,
  sourceId?: string,
  customAttributes?: Record<string, any>
): Promise<ChatwootConversation> {
  try {
    const conversationData: ChatwootConversation = {
      inbox_id: parseInt(CHATWOOT_INBOX_ID),
      contact_id: contactId,
      status: 'open',
    };

    if (sourceId) {
      conversationData.source_id = sourceId;
    }

    if (customAttributes) {
      conversationData.custom_attributes = customAttributes;
    }

    const response = await chatwootRequest<{ payload: ChatwootConversation }>(
      `/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
      {
        method: 'POST',
        body: JSON.stringify(conversationData),
      }
    );

    return response.payload;
  } catch (error: any) {
    console.error('Error creating Chatwoot conversation:', error);
    throw error;
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: number,
  message: ChatwootMessage
): Promise<any> {
  try {
    const response = await chatwootRequest(
      `/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(message),
      }
    );

    return response;
  } catch (error: any) {
    console.error('Error sending Chatwoot message:', error);
    throw error;
  }
}

/**
 * Get conversation by ID
 */
export async function getConversation(
  conversationId: number
): Promise<ChatwootConversation> {
  try {
    const response = await chatwootRequest<{ payload: ChatwootConversation }>(
      `/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}`
    );

    return response.payload;
  } catch (error: any) {
    console.error('Error getting Chatwoot conversation:', error);
    throw error;
  }
}

/**
 * Get active conversations count
 */
export async function getActiveConversationsCount(): Promise<number> {
  try {
    const response = await chatwootRequest<{ payload: ChatwootConversation[] }>(
      `/accounts/${CHATWOOT_ACCOUNT_ID}/conversations?status=open&inbox_id=${CHATWOOT_INBOX_ID}`
    );

    return response.payload?.length || 0;
  } catch (error: any) {
    console.error('Error getting active conversations count:', error);
    return 0;
  }
}

/**
 * Parse webhook event
 */
export function parseWebhookEvent(body: any): ChatwootWebhookEvent | null {
  try {
    return body as ChatwootWebhookEvent;
  } catch (error) {
    console.error('Error parsing webhook event:', error);
    return null;
  }
}

/**
 * Sync user to Chatwoot contact
 */
export async function syncUserToChatwoot(
  userId: string,
  userName: string,
  userEmail: string,
  userRole?: string,
  userAvatar?: string
): Promise<ChatwootContact | null> {
  try {
    const contact: ChatwootContact = {
      name: userName,
      email: userEmail,
      identifier: userId,
      custom_attributes: {
        userId,
        userRole: userRole || 'user',
        source: 'sollo-app',
      },
    };

    const createdContact = await createOrUpdateContact(contact);
    console.log(`✅ Synced user ${userId} to Chatwoot contact ${createdContact.id}`);
    return createdContact;
  } catch (error: any) {
    console.error(`Error syncing user ${userId} to Chatwoot:`, error);
    return null;
  }
}
