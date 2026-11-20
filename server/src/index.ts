import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { config } from './config.js';
import { RallyEngine } from './rallyEngine.js';
import { setupSocketHandlers } from './socketHandler.js';
import { DiscordBot } from './bot/discordBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Cross-origin and JSON body parser
app.use(cors());
app.use(express.json());

// Initialize Rally State Engine
const engine = new RallyEngine();

// Initialize Discord Bot (Voice + Chat Launcher)
const bot = new DiscordBot(engine);
bot.start().catch((err) => console.error('[Bot Start Error]', err));

// Setup WebSocket server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io, engine);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    serverTimeUtc: Date.now(),
    service: 'rally-sync-backend',
  });
});

// Expose public configuration (Client ID) to client SDK
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    clientId: config.discordClientId,
  });
});

// OAuth2 Token Exchange for Discord Embedded App SDK
app.post('/api/token', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  // Development/Mock fallback if credentials are not provided in .env
  if (!config.discordClientId || !config.discordClientSecret) {
    console.warn(
      '[Auth] DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not configured. Providing development token.'
    );
    res.json({
      access_token: `mock_token_${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 604800,
      scope: 'identify guilds guilds.members.read',
    });
    return;
  }

  try {
    const params = new URLSearchParams({
      client_id: config.discordClientId,
      client_secret: config.discordClientSecret,
      grant_type: 'authorization_code',
      code: code.toString(),
    });

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Auth Error from Discord]', data);
      res.status(response.status).json(data);
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error('[Token Exchange Failed]', error);
    res.status(500).json({ error: 'Failed to exchange token with Discord API' });
  }
});

// Serve frontend static build if exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Rally Sync Client not built yet. Run npm run dev in client.');
    }
  });
});

server.listen(config.port, () => {
  console.log(`[Rally Sync Server] Running on http://localhost:${config.port}`);
});
