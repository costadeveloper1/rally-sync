import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  discordClientId: process.env.DISCORD_CLIENT_ID || '',
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
  coordinatorRoleName: process.env.COORDINATOR_ROLE_NAME || 'Líder de Rally',
};
