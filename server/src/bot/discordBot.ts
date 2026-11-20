import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { config } from '../config.js';
import { RallyEngine } from '../rallyEngine.js';
import { voiceManager } from './voiceManager.js';

export class DiscordBot {
  private client: Client | null = null;
  private engine: RallyEngine;
  private triggeredVoiceAlerts: Set<string> = new Set();
  private tickerInterval: NodeJS.Timeout | null = null;

  constructor(engine: RallyEngine) {
    this.engine = engine;
  }

  public async start(): Promise<void> {
    if (!config.discordBotToken) {
      console.log('⚠️ [Discord Bot] DISCORD_BOT_TOKEN not provided in .env. Bot features are disabled, web activity runs standalone.');
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.client.once('clientReady', async () => {
      console.log(`🤖 [Discord Bot] Logged in as ${this.client?.user?.tag}!`);
      await this.registerCommands();
      this.startVoiceTicker();
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await this.handleSlashCommand(interaction);
        } else if (interaction.isButton()) {
          await this.handleButtonClick(interaction);
        }
      } catch (err) {
        console.error('[Discord Bot Interaction Error]', err);
      }
    });

    // Handle user entering voice channel -> invite to select team and open activity
    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      // User joined a voice channel
      if (!oldState.channelId && newState.channelId && newState.member && !newState.member.user.bot) {
        await this.sendWelcomePrompt(newState);
      }
    });

    try {
      await this.client.login(config.discordBotToken);
    } catch (err: any) {
      console.error('❌ [Discord Bot Login Error]:', err.message);
    }
  }

  /**
   * Register slash commands (/rally, /join, /leave) without removing the Discord Activity Entry Point
   */
  private async registerCommands(): Promise<void> {
    if (!this.client?.user) return;
    const rest = new REST({ version: '10' }).setToken(config.discordBotToken);

    const newCommands = [
      new SlashCommandBuilder()
        .setName('rally')
        .setDescription('Open the Rally Sync Control Panel and Team Selector'),
      new SlashCommandBuilder()
        .setName('join')
        .setDescription('Make the Rally Sync bot join your voice channel for countdown audio'),
      new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Disconnect the Rally Sync bot from voice channel'),
    ].map((cmd) => cmd.toJSON());

    try {
      // 1. Fetch existing commands to preserve the Activity Primary Entry Point command (type 4)
      const existingCommands = (await rest.get(
        Routes.applicationCommands(this.client.user.id)
      )) as any[];

      const entryPointCommands = Array.isArray(existingCommands)
        ? existingCommands.filter((cmd) => cmd.type === 4)
        : [];

      // 2. Combine entry point commands with new slash commands
      const combinedCommands = [...entryPointCommands, ...newCommands];

      await rest.put(Routes.applicationCommands(this.client.user.id), {
        body: combinedCommands,
      });
      console.log('✅ [Discord Bot] Slash commands registered successfully (Activity Entry Point preserved).');
    } catch (err) {
      console.error('[Discord Bot] Error registering slash commands:', err);
    }
  }

  /**
   * Handle slash commands
   */
  private async handleSlashCommand(interaction: any): Promise<void> {
    const { commandName } = interaction;

    if (commandName === 'rally') {
      const panel = this.createRallyPanelEmbed();
      const row = this.createTeamButtons();
      await interaction.reply({ embeds: [panel], components: [row] });
    } else if (commandName === 'join') {
      const member = interaction.member;
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        await interaction.reply({
          content: '⚠️ You must be inside a voice channel to call the bot!',
          ephemeral: true,
        });
        return;
      }

      await voiceManager.join(voiceChannel);
      await voiceManager.speak(interaction.guildId, 'Rally Sync connected and ready!');

      await interaction.reply({
        content: `🎙️ **Rally Sync Bot connected to** <#${voiceChannel.id}>! Audio countdowns will play automatically.`,
      });
    } else if (commandName === 'leave') {
      voiceManager.leave(interaction.guildId);
      await interaction.reply({
        content: '👋 Rally Sync bot disconnected from voice.',
        ephemeral: true,
      });
    }
  }

  /**
   * Handle button clicks (e.g. team selection)
   */
  private async handleButtonClick(interaction: any): Promise<void> {
    const customId = interaction.customId;

    if (customId.startsWith('team_select:')) {
      const teamId = customId.split(':')[1];
      const teamNames: Record<string, string> = {
        '1': 'Team 1 (Main Target)',
        '2': 'Team 2 (Flank Target)',
        '3': 'Team 3 (Support)',
      };

      const selectedName = teamNames[teamId] || `Team ${teamId}`;

      await interaction.reply({
        content: `✅ You selected **${selectedName}**! Open the Rally Sync Activity to view and coordinate your team's launch times.`,
        ephemeral: true,
      });
    } else if (customId === 'voice_join_bot') {
      const member = interaction.member;
      const voiceChannel = member?.voice?.channel;
      if (!voiceChannel) {
        await interaction.reply({
          content: '⚠️ Please enter the voice channel first so the bot can join you!',
          ephemeral: true,
        });
        return;
      }
      await voiceManager.join(voiceChannel);
      await voiceManager.speak(interaction.guildId, 'Ready!');
      await interaction.reply({
        content: `🎙️ Bot connected to <#${voiceChannel.id}>!`,
        ephemeral: true,
      });
    }
  }

  /**
   * Send interactive prompt when user enters voice
   */
  private async sendWelcomePrompt(voiceState: any): Promise<void> {
    try {
      const channel = voiceState.channel;
      if (!channel) return;

      // Find text channel to notify or send in the voice channel's text chat
      const targetChannel = channel.isTextBased() ? channel : channel.guild.systemChannel;
      if (!targetChannel) return;

      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('🎯 Rally Sync • Coordinate Your Attack')
        .setDescription(
          `Welcome <@${voiceState.member.id}> to **${channel.name}**!\n\n` +
          `• Click below to pick your **Rally Team**\n` +
          `• Launch the **Rally Sync Activity** (Rocket button 🚀) to track live UTC times\n` +
          `• Or click **Summon Voice Bot** to hear the spoken countdown directly in call!`
        );

      const buttons = this.createTeamButtons();
      await targetChannel.send({ embeds: [embed], components: [buttons] });
    } catch (err) {
      // Ignore permissions errors on specific channels
    }
  }

  /**
   * Embed for Rally Sync Panel
   */
  private createRallyPanelEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('⚔️ Rally Sync • Multi-Team Coordinator')
      .setDescription(
        'Synchronize simultaneous rally marches down to the exact second!\n\n' +
        '**Select your team below to coordinate:**\n' +
        '• 🏰 **Team 1**: Main Target Attack\n' +
        '• 🏹 **Team 2**: Secondary / Flank Target\n' +
        '• 🛡️ **Team 3**: Support Rally'
      )
      .setFooter({ text: 'Rally Sync • Real-Time UTC HUD' });
  }

  /**
   * Action Row with Team Selection and Voice Bot Call Buttons
   */
  private createTeamButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('team_select:1')
        .setLabel('🏰 Team 1')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('team_select:2')
        .setLabel('🏹 Team 2')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('team_select:3')
        .setLabel('🛡️ Team 3')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('voice_join_bot')
        .setLabel('🎙️ Summon Voice Bot')
        .setStyle(ButtonStyle.Success)
    );
  }

  /**
   * Ticker that syncs with RallyEngine and announces countdown in voice
   */
  private startVoiceTicker(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);

    this.tickerInterval = setInterval(async () => {
      const now = Date.now();

      // Check all active guilds with voice connection
      if (!this.client?.guilds) return;

      for (const guild of this.client.guilds.cache.values()) {
        if (!voiceManager.isConnected(guild.id)) continue;

        // Iterate over engine rooms for this guild/channels
        // Rooms can be mapped by channelId
        for (const channel of guild.channels.cache.values()) {
          if (!channel.isVoiceBased()) continue;

          // Check default room or team rooms
          const room = this.engine.getOrCreateRoom(channel.id);
          if (room.status !== 'countdown' && room.status !== 'in_march') continue;

          for (const player of room.players) {
            if (!player.departureTimeUtc) continue;

            const diffSeconds = Math.ceil((player.departureTimeUtc - now) / 1000);

            // Announce 3, 2, 1
            if (diffSeconds >= 1 && diffSeconds <= 3) {
              const alertKey = `${channel.id}_${player.id}_${diffSeconds}`;
              if (!this.triggeredVoiceAlerts.has(alertKey)) {
                this.triggeredVoiceAlerts.add(alertKey);
                const words: Record<number, string> = { 3: 'Three', 2: 'Two', 1: 'One' };
                await voiceManager.speak(guild.id, words[diffSeconds]);
              }
            }

            // Announce GO!
            if (diffSeconds === 0) {
              const alertKey = `${channel.id}_${player.id}_0_go`;
              if (!this.triggeredVoiceAlerts.has(alertKey)) {
                this.triggeredVoiceAlerts.add(alertKey);
                await voiceManager.speak(guild.id, `${player.name}, Go!`);
              }
            }
          }
        }
      }
    }, 500);
  }

  public stop(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    if (this.client) this.client.destroy();
  }
}
