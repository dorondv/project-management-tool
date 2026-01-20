/**
 * Chatwoot Widget Integration Service
 * Handles Chatwoot widget initialization and user identity management
 */

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      setUser: (identifier: string, attributes: { email?: string; name?: string; avatar_url?: string; identifier_hash?: string; phone_number?: string; description?: string; country_code?: string; city?: string; company_name?: string }) => void;
      setCustomAttributes: (attributes: Record<string, any>) => void;
      deleteCustomAttribute: (key: string) => void;
      toggle: (action?: 'open' | 'close') => void;
      reset: () => void;
    };
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: 'left' | 'right';
      locale?: string;
      type?: string;
      launcherTitle?: string;
    };
  }
}

interface ChatwootUser {
  identifier: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  identifier_hash?: string;
}

class ChatwootService {
  private isInitialized = false;
  private isSDKLoading = false;
  private currentUser: ChatwootUser | null = null;

  /**
   * Load Chatwoot SDK script dynamically
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.chatwootSDK && window.$chatwoot) {
        resolve();
        return;
      }

      // Check if SDK is already loading
      if (this.isSDKLoading) {
        // Wait for existing load to complete
        const checkLoaded = setInterval(() => {
          if (window.chatwootSDK && window.$chatwoot) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.chatwootSDK) {
            reject(new Error('SDK load timeout'));
          }
        }, 10000);
        return;
      }

      this.isSDKLoading = true;

      // Set widget settings before loading SDK
      window.chatwootSettings = {
        hideMessageBubble: false,
        position: 'right',
        locale: 'en',
        type: 'standard',
        launcherTitle: 'Chat with us'
      };

      // Create and load SDK script
      const script = document.createElement('script');
      script.src = 'https://app.chatwoot.com/packs/js/sdk.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Wait for SDK to be available
        const checkSDK = setInterval(() => {
          if (window.chatwootSDK && typeof window.chatwootSDK.run === 'function') {
            clearInterval(checkSDK);
            try {
              // Initialize widget
              window.chatwootSDK.run({
                websiteToken: 'b62tAoXkCkacJH8o1Tcye3Fr',
                baseUrl: 'https://app.chatwoot.com'
              });
              console.log('✅ Chatwoot widget initialized, waiting for $chatwoot API...');

              // Wait for $chatwoot API to be available
              const checkAPI = setInterval(() => {
                if (window.$chatwoot && typeof window.$chatwoot.setUser === 'function') {
                  clearInterval(checkAPI);
                  this.isSDKLoading = false;
                  console.log('✅ Chatwoot widget API ($chatwoot) ready');
                  resolve();
                }
              }, 100);

              // Also listen for ready event
              window.addEventListener('chatwoot:ready', () => {
                clearInterval(checkAPI);
                this.isSDKLoading = false;
                console.log('✅ Chatwoot widget ready event received');
                resolve();
              }, { once: true });

              // Timeout
              setTimeout(() => {
                clearInterval(checkAPI);
                if (!window.$chatwoot) {
                  this.isSDKLoading = false;
                  reject(new Error('Chatwoot API not available after initialization'));
                }
              }, 10000);
            } catch (error) {
              this.isSDKLoading = false;
              console.error('❌ Error initializing Chatwoot widget:', error);
              reject(error);
            }
          }
        }, 100);

        // Timeout for SDK load
        setTimeout(() => {
          clearInterval(checkSDK);
          if (!window.chatwootSDK) {
            this.isSDKLoading = false;
            reject(new Error('Chatwoot SDK failed to load'));
          }
        }, 10000);
      };

      script.onerror = () => {
        this.isSDKLoading = false;
        console.error('❌ Failed to load Chatwoot SDK script');
        reject(new Error('Failed to load Chatwoot SDK script'));
      };

      // Insert script into document
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    });
  }

  /**
   * Initialize Chatwoot widget
   * Loads SDK dynamically and initializes widget
   */
  initialize(): void {
    if (this.isInitialized && window.$chatwoot) {
      return;
    }

    // Check if SDK is loaded
    if (typeof window === 'undefined') {
      return;
    }

    // If already initialized, return
    if (window.$chatwoot) {
      this.isInitialized = true;
      return;
    }

    // Load SDK dynamically
    this.loadSDK()
      .then(() => {
        this.isInitialized = true;
        console.log('✅ Chatwoot widget fully initialized');
      })
      .catch((error) => {
        console.error('❌ Failed to initialize Chatwoot widget:', error);
      });
  }

  /**
   * Set user identity in Chatwoot widget
   * Uses identifier_hash for secure user identification
   * Note: We don't reset when switching users - just update the identity
   * This preserves conversations and ensures proper contact linking
   */
  setUser(user: ChatwootUser): void {
    if (!window.$chatwoot) {
      console.warn('Chatwoot widget API ($chatwoot) not loaded - will retry when ready');
      // Retry after a short delay
      setTimeout(() => {
        if (window.$chatwoot && user.identifier) {
          this.setUser(user);
        }
      }, 500);
      return;
    }

    // If switching to a different user, just update identity (don't reset)
    // Resetting would clear the session and could cause conversation issues
    if (this.currentUser && this.currentUser.identifier !== user.identifier) {
      console.log('🔄 Switching Chatwoot user - updating identity (preserving conversations)');
      // Just update the user identity - Chatwoot will handle the conversation linking
      this.setUserIdentityInternal(user);
      return;
    }

    // Same user or first time - set identity directly
    this.setUserIdentityInternal(user);
  }

  /**
   * Internal method to set user identity (after reset if needed)
   */
  private setUserIdentityInternal(user: ChatwootUser): void {
    try {
      // Generate identifier_hash using identity_secret for secure identification
      // This prevents users from impersonating others
      const identitySecret = 'mnSVE1c5jBwe2QVzv6JdR4fG'; // From env: CHATWOOT_IDENTITY_SECRET
      
      if (identitySecret && user.identifier) {
        // Generate HMAC SHA256 hash of identifier using identity_secret
        // Using Web Crypto API for browser compatibility
        this.generateIdentifierHash(user.identifier, identitySecret)
          .then((hash) => {
            this.setUserIdentity(user, hash);
          })
          .catch((error) => {
            console.error('Error generating identifier hash:', error);
            // Fallback: set user without hash (less secure but works)
            this.setUserIdentity(user, undefined);
          });
      } else {
        // Set user without hash if secret not available
        this.setUserIdentity(user, undefined);
      }
    } catch (error) {
      console.error('Error setting Chatwoot user:', error);
      // Fallback: try to set user without hash
      this.setUserIdentity(user, undefined);
    }
  }

  /**
   * Generate identifier hash using HMAC SHA256
   */
  private async generateIdentifierHash(identifier: string, secret: string): Promise<string> {
    // Use Web Crypto API to generate HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(identifier);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Actually set the user identity in Chatwoot widget
   */
  private setUserIdentity(user: ChatwootUser, identifierHash?: string): void {
    if (!window.$chatwoot) {
      console.warn('Chatwoot widget API ($chatwoot) not available');
      return;
    }

    try {
      // Use the correct API: window.$chatwoot.setUser(identifier, attributes)
      const attributes: {
        email?: string;
        name?: string;
        avatar_url?: string;
        identifier_hash?: string;
      } = {};

      // Always include name and email if available
      if (user.email) {
        attributes.email = user.email;
      }
      if (user.name) {
        attributes.name = user.name;
      } else {
        // Fallback to email or identifier if name is missing
        attributes.name = user.email || user.identifier;
      }
      if (user.avatar_url) {
        attributes.avatar_url = user.avatar_url;
      }
      if (identifierHash) {
        attributes.identifier_hash = identifierHash;
      }

      // Ensure we have at least a name
      if (!attributes.name) {
        attributes.name = user.identifier;
        console.warn('⚠️ No name provided for Chatwoot user, using identifier');
      }

      window.$chatwoot.setUser(user.identifier, attributes);
      this.currentUser = user;
      
      console.log('✅ Chatwoot user identity set:', {
        identifier: user.identifier,
        name: attributes.name,
        email: attributes.email,
        hasHash: !!identifierHash,
        attributesSet: Object.keys(attributes)
      });
      
      // Verify the identity was set correctly by checking after a short delay
      setTimeout(() => {
        if (window.$chatwoot && this.currentUser?.identifier === user.identifier) {
          console.log('✅ Chatwoot user identity verified for:', user.name);
        }
      }, 500);
    } catch (error) {
      console.error('Error setting Chatwoot user identity:', error);
      // Retry once after delay
      setTimeout(() => {
        if (window.$chatwoot && user.identifier) {
          try {
            const retryAttributes: any = {
              name: user.name || user.email || user.identifier,
            };
            if (user.email) retryAttributes.email = user.email;
            if (user.avatar_url) retryAttributes.avatar_url = user.avatar_url;
            if (identifierHash) retryAttributes.identifier_hash = identifierHash;
            
            window.$chatwoot.setUser(user.identifier, retryAttributes);
            console.log('✅ Chatwoot user identity set (retry):', user.name);
          } catch (retryError) {
            console.error('Error retrying Chatwoot user identity:', retryError);
          }
        }
      }, 1000);
    }
  }

  /**
   * Set custom attributes for the conversation
   */
  setCustomAttributes(attributes: Record<string, any>): void {
    if (!window.$chatwoot) {
      console.warn('Chatwoot widget API ($chatwoot) not available');
      return;
    }

    try {
      window.$chatwoot.setCustomAttributes(attributes);
      console.log('✅ Chatwoot custom attributes set:', attributes);
    } catch (error) {
      console.error('Error setting Chatwoot custom attributes:', error);
    }
  }

  /**
   * Set conversation label
   */
  setLabel(label: string): void {
    if (!window.chatwootSDK) {
      return;
    }

    try {
      window.chatwootSDK.setLabel(label);
    } catch (error) {
      console.error('Error setting Chatwoot label:', error);
    }
  }

  /**
   * Toggle widget (open/close)
   */
  toggle(action?: 'open' | 'close'): void {
    if (!window.$chatwoot) {
      return;
    }

    try {
      window.$chatwoot.toggle(action);
    } catch (error) {
      console.error('Error toggling Chatwoot widget:', error);
    }
  }

  /**
   * Reset widget (clear user identity)
   * Only call this on logout - not when switching users
   * Resetting clears the session but preserves conversations on server
   */
  reset(): void {
    try {
      if (window.$chatwoot) {
        window.$chatwoot.reset();
        console.log('✅ Chatwoot widget reset - user identity cleared (conversations preserved on server)');
      }
      this.currentUser = null;
      // Reset initialization flag so widget can be re-initialized for new user
      this.isInitialized = false;
    } catch (error) {
      console.error('Error resetting Chatwoot widget:', error);
    }
  }

  /**
   * Check if widget is initialized
   */
  isReady(): boolean {
    return this.isInitialized && !!window.$chatwoot;
  }

  /**
   * Get current user
   */
  getCurrentUser(): ChatwootUser | null {
    return this.currentUser;
  }
}

export const chatwootService = new ChatwootService();
