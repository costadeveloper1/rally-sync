import { DiscordSDK } from '@discord/embedded-app-sdk';
import { ClientUser } from './types.js';

let discordSdk: DiscordSDK | null = null;

// Determine if we are running inside Discord
export const isEmbeddedInDiscord = (): boolean => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('frame_id') || window.parent !== window;
};

export interface DiscordAuthResult {
  sdk: DiscordSDK | null;
  channelId: string;
  guildId: string | null;
  user: ClientUser;
}

export async function setupDiscordSdk(): Promise<DiscordAuthResult> {
  const urlParams = new URLSearchParams(window.location.search);
  const frameId = urlParams.get('frame_id');

  // Fallback for local browser development outside Discord iframe
  if (!frameId && window.parent === window) {
    console.log('[DiscordSDK] Running outside Discord Activity iframe. Using development mock session.');
    const savedRole = localStorage.getItem('rally_dev_is_coordinator') !== 'false';
    return {
      sdk: null,
      channelId: urlParams.get('channel') || 'dev-channel-1',
      guildId: 'dev-guild-1',
      user: {
        id: 'dev-user-1',
        username: 'Commander Bruno',
        globalName: 'Bruno',
        isCoordinator: savedRole,
      },
    };
  }

  // Inside Discord Activity iframe
  let clientId = urlParams.get('client_id') || (import.meta as any).env?.VITE_DISCORD_CLIENT_ID || '';
  if (!clientId) {
    try {
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        clientId = configData.clientId || '';
      }
    } catch {
      // Fallback
    }
  }

  if (!clientId) {
    console.warn('[DiscordSDK] Client ID not found. Using fallback mock in Discord.');
    return {
      sdk: null,
      channelId: urlParams.get('channel_id') || 'voice-channel',
      guildId: urlParams.get('guild_id') || null,
      user: {
        id: 'user_fallback',
        username: 'Discord Member',
        isCoordinator: true,
      },
    };
  }

  try {
    discordSdk = new DiscordSDK(clientId);
    await discordSdk.ready();

    const channelId = discordSdk.channelId || urlParams.get('channel_id') || 'voice-channel';
    const guildId = discordSdk.guildId || urlParams.get('guild_id') || null;

    // 1. Authorize: Try silent first, fallback to interactive popup
    let authCode: string | null = null;
    const scopes: ('identify' | 'guilds')[] = ['identify', 'guilds'];

    try {
      const res = await discordSdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: scopes,
      });
      authCode = res.code;
    } catch {
      // Fallback: prompt the user interactively (required on first launch!)
      try {
        const res = await discordSdk.commands.authorize({
          client_id: clientId,
          response_type: 'code',
          state: '',
          scope: scopes,
        });
        authCode = res.code;
      } catch (promptErr) {
        console.warn('[DiscordSDK] Interactive authorization failed/declined:', promptErr);
      }
    }

    let user: ClientUser = {
      id: `u_${Date.now()}`,
      username: 'Discord Member',
      isCoordinator: true, // Default to coordinator for the creator
    };

    if (authCode) {
      // 2. Exchange code for access_token on backend
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode }),
      });

      if (response.ok) {
        const { access_token } = await response.json();
        // 3. Authenticate with Discord SDK
        const auth = await discordSdk.commands.authenticate({ access_token });
        if (auth?.user) {
          user = {
            id: auth.user.id,
            username: auth.user.username,
            globalName: auth.user.global_name || auth.user.username,
            avatar: auth.user.avatar || undefined,
            isCoordinator: true,
          };
        }
      }
    }

    // 4. Check permissions if available
    try {
      const channelPermissions = await discordSdk.commands.getChannelPermissions();
      const permissions = BigInt(channelPermissions.permissions);
      const MANAGE_MESSAGES = BigInt(0x2000);
      const ADMINISTRATOR = BigInt(0x8);

      if ((permissions & MANAGE_MESSAGES) === MANAGE_MESSAGES || (permissions & ADMINISTRATOR) === ADMINISTRATOR) {
        user.isCoordinator = true;
      }
    } catch {
      // In case permissions call fails, keep isCoordinator true for the session
    }

    return {
      sdk: discordSdk,
      channelId,
      guildId,
      user,
    };
  } catch (sdkError) {
    console.error('[DiscordSDK Init Error]', sdkError);
    // Graceful fallback so the UI never displays a blank page
    return {
      sdk: null,
      channelId: urlParams.get('channel_id') || 'voice-channel',
      guildId: urlParams.get('guild_id') || null,
      user: {
        id: `user_${Date.now()}`,
        username: 'Squad Leader',
        isCoordinator: true,
      },
    };
  }
}
