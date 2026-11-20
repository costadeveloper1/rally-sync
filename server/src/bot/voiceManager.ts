import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import * as googleTTS from 'google-tts-api';
import { VoiceBasedChannel } from 'discord.js';

class VoiceManager {
  private players: Map<string, AudioPlayer> = new Map();
  private isSpeaking: Map<string, boolean> = new Map();

  /**
   * Connect bot to a voice channel
   */
  public async join(channel: VoiceBasedChannel): Promise<VoiceConnection> {
    const existing = getVoiceConnection(channel.guild.id);
    if (existing && existing.joinConfig.channelId === channel.id) {
      return existing;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    } catch (err) {
      console.error('[VoiceManager] Failed to connect to voice channel:', err);
      connection.destroy();
      throw err;
    }

    // Prepare audio player for this guild
    let player = this.players.get(channel.guild.id);
    if (!player) {
      player = createAudioPlayer();
      this.players.set(channel.guild.id, player);

      player.on(AudioPlayerStatus.Idle, () => {
        this.isSpeaking.set(channel.guild.id, false);
      });

      player.on('error', (error) => {
        console.error('[VoiceManager Player Error]', error.message);
        this.isSpeaking.set(channel.guild.id, false);
      });
    }

    connection.subscribe(player);
    return connection;
  }

  /**
   * Disconnect bot from voice
   */
  public leave(guildId: string): void {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }
    const player = this.players.get(guildId);
    if (player) {
      player.stop();
      this.players.delete(guildId);
    }
    this.isSpeaking.delete(guildId);
  }

  /**
   * Speak English TTS text directly into the voice channel
   */
  public async speak(guildId: string, text: string): Promise<void> {
    const connection = getVoiceConnection(guildId);
    if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) {
      return;
    }

    const player = this.players.get(guildId);
    if (!player) return;

    try {
      // Generate mp3 audio URL via google-tts-api
      const url = googleTTS.getAudioUrl(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });

      const resource = createAudioResource(url, { inlineVolume: true });
      resource.volume?.setVolume(1.0);

      this.isSpeaking.set(guildId, true);
      player.play(resource);
    } catch (err) {
      console.error('[VoiceManager Speak Error]', err);
    }
  }

  /**
   * Check if bot is connected in a guild
   */
  public isConnected(guildId: string): boolean {
    const conn = getVoiceConnection(guildId);
    return Boolean(conn && conn.state.status === VoiceConnectionStatus.Ready);
  }
}

export const voiceManager = new VoiceManager();
