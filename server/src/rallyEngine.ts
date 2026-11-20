import { RallyPlayer, RallyRoomState, RallyStatus } from './types.js';

export class RallyEngine {
  private rooms: Map<string, RallyRoomState> = new Map();

  /**
   * Get existing room or create default initialized room
   */
  public getOrCreateRoom(channelId: string): RallyRoomState {
    let room = this.rooms.get(channelId);
    if (!room) {
      room = {
        channelId,
        rallyDuration: 300, // 5 minutes default
        prepWindow: 20,     // 20 seconds default
        status: 'idle',
        startTimeUtc: null,
        firstDepartureTimeUtc: null,
        targetImpactTimeUtc: null,
        players: [],
        updatedAt: Date.now(),
      };
      this.rooms.set(channelId, room);
    }
    return room;
  }

  /**
   * Upsert a player by name. If name exists (case-insensitive), update their march time.
   */
  public upsertPlayer(channelId: string, name: string, marchTimeSeconds: number): RallyRoomState {
    const room = this.getOrCreateRoom(channelId);
    const trimmedName = name.trim();
    if (!trimmedName || marchTimeSeconds <= 0) return room;

    const existingIndex = room.players.findIndex(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex >= 0) {
      room.players[existingIndex].marchTimeSeconds = marchTimeSeconds;
    } else {
      room.players.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        marchTimeSeconds,
      });
    }

    // If rally is active, recalculate departure times
    if (room.status === 'countdown' || room.status === 'in_march') {
      this.recalculateTimes(room, room.startTimeUtc || Date.now());
    } else {
      // Sort descending by march time
      room.players.sort((a, b) => b.marchTimeSeconds - a.marchTimeSeconds);
    }

    room.updatedAt = Date.now();
    return room;
  }

  /**
   * Remove a player by id
   */
  public removePlayer(channelId: string, playerId: string): RallyRoomState {
    const room = this.getOrCreateRoom(channelId);
    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.status === 'countdown' || room.status === 'in_march') {
      this.recalculateTimes(room, room.startTimeUtc || Date.now());
    }

    room.updatedAt = Date.now();
    return room;
  }

  /**
   * Clear all players from room
   */
  public clearPlayers(channelId: string): RallyRoomState {
    const room = this.getOrCreateRoom(channelId);
    room.players = [];
    room.status = 'idle';
    room.startTimeUtc = null;
    room.firstDepartureTimeUtc = null;
    room.targetImpactTimeUtc = null;
    room.updatedAt = Date.now();
    return room;
  }

  /**
   * Start or restart the rally countdown with optional custom duration and prep window
   */
  public startRally(
    channelId: string,
    rallyDuration?: 300 | 600,
    prepWindow?: 10 | 20 | 60
  ): RallyRoomState {
    const room = this.getOrCreateRoom(channelId);

    if (rallyDuration) room.rallyDuration = rallyDuration;
    if (prepWindow) room.prepWindow = prepWindow;

    const now = Date.now();
    room.startTimeUtc = now;
    room.status = 'countdown';

    this.recalculateTimes(room, now);

    room.updatedAt = now;
    return room;
  }

  /**
   * Reset rally: recalculates based on current UTC time keeping all players
   */
  public resetRally(channelId: string): RallyRoomState {
    return this.startRally(channelId);
  }

  /**
   * Internal helper to calculate departure times and impact time for all players
   */
  private recalculateTimes(room: RallyRoomState, referenceNow: number): void {
    if (room.players.length === 0) {
      room.firstDepartureTimeUtc = null;
      room.targetImpactTimeUtc = null;
      return;
    }

    // Sort descending by march time (longest march leaves first)
    room.players.sort((a, b) => b.marchTimeSeconds - a.marchTimeSeconds);

    const maxMarch = room.players[0].marchTimeSeconds;
    const firstDeparture = referenceNow + room.prepWindow * 1000;
    const targetImpact = firstDeparture + (room.rallyDuration + maxMarch) * 1000;

    room.firstDepartureTimeUtc = firstDeparture;
    room.targetImpactTimeUtc = targetImpact;

    // Calculate departure for each player
    for (const player of room.players) {
      // departure = targetImpact - (rallyDuration + playerMarch)
      // which equals firstDeparture + (maxMarch - playerMarch)
      const diffSeconds = maxMarch - player.marchTimeSeconds;
      player.departureTimeUtc = firstDeparture + diffSeconds * 1000;
    }
  }
}
