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
  rallyDuration: 300 | 600;
  prepWindow: 10 | 20 | 60;
  status: RallyStatus;
  startTimeUtc: number | null;
  firstDepartureTimeUtc: number | null;
  targetImpactTimeUtc: number | null;
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
