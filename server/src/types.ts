export type RallyStatus = 'idle' | 'countdown' | 'in_march' | 'finished';
export type TeamId = 'primary' | 'secondary';

export interface RallyPlayer {
  id: string;
  name: string;
  marchTimeSeconds: number;
  departureTimeUtc?: number; // Epoch timestamp (ms)
}

export interface RallyRoomState {
  channelId: string;
  teamId?: TeamId;
  rallyDuration: 300 | 600; // in seconds (5m or 10m)
  prepWindow: 10 | 20 | 60;  // in seconds (10s, 20s, 60s)
  status: RallyStatus;
  startTimeUtc: number | null; // When coordinator clicked Start
  firstDepartureTimeUtc: number | null; // When 1st player marches
  targetImpactTimeUtc: number | null; // When all troops hit the target
  players: RallyPlayer[];
  updatedAt: number;
}

export interface ClientUser {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  isCoordinator: boolean;
}

export interface TimeSyncPing {
  clientTime: number;
}

export interface TimeSyncPong {
  clientTime: number;
  serverTime: number;
}
