import { Server, Socket } from 'socket.io';
import { RallyEngine } from './rallyEngine.js';
import { ClientUser, TeamId } from './types.js';

interface SocketData {
  channelId?: string;
  teamId?: TeamId;
  user?: ClientUser;
}

export function setupSocketHandlers(io: Server, engine: RallyEngine) {
  io.on('connection', (socket: Socket) => {
    const data: SocketData = { teamId: 'primary' };

    const getRoomId = () => engine.getRoomKey(data.channelId || '', data.teamId || 'primary');

    // 1. Join room (with channelId and optional teamId)
    socket.on(
      'room:join',
      ({
        channelId,
        teamId = 'primary',
        user,
      }: {
        channelId: string;
        teamId?: TeamId;
        user: ClientUser;
      }) => {
        if (!channelId) return;

        const previousRoomId = data.channelId ? getRoomId() : null;
        data.channelId = channelId;
        data.teamId = teamId;
        data.user = user;

        const currentRoomId = getRoomId();

        // Leave previous socket room if different
        if (previousRoomId && previousRoomId !== currentRoomId) {
          socket.leave(previousRoomId);
        }

        socket.join(currentRoomId);

        // Send current state of the selected team to newly joined client
        const state = engine.getOrCreateRoom(channelId, teamId);
        socket.emit('room:state', state);
      }
    );

    // 2. Clock synchronization (NTP style ping/pong)
    socket.on('time:ping', (payload: { clientTime: number }) => {
      socket.emit('time:pong', {
        clientTime: payload?.clientTime || 0,
        serverTime: Date.now(),
      });
    });

    // Guard helper
    const requireCoordinator = (): boolean => {
      if (!data.channelId) {
        socket.emit('error:msg', { message: 'You are not connected to a channel.' });
        return false;
      }
      if (!data.user?.isCoordinator) {
        socket.emit('error:msg', {
          message: 'Only the Coordinator has permission to modify rally settings.',
        });
        return false;
      }
      return true;
    };

    // 3. Upsert player
    socket.on('player:upsert', ({ name, marchTimeSeconds }: { name: string; marchTimeSeconds: number }) => {
      if (!requireCoordinator()) return;
      const state = engine.upsertPlayer(data.channelId!, name, marchTimeSeconds, data.teamId);
      io.to(getRoomId()).emit('room:state', state);
    });

    // 4. Remove player
    socket.on('player:remove', ({ playerId }: { playerId: string }) => {
      if (!requireCoordinator()) return;
      const state = engine.removePlayer(data.channelId!, playerId, data.teamId);
      io.to(getRoomId()).emit('room:state', state);
    });

    // 5. Start / Restart Rally
    socket.on(
      'rally:start',
      (params?: { rallyDuration?: 300 | 600; prepWindow?: 10 | 20 | 60 }) => {
        if (!requireCoordinator()) return;
        const state = engine.startRally(
          data.channelId!,
          params?.rallyDuration,
          params?.prepWindow,
          data.teamId
        );
        io.to(getRoomId()).emit('room:state', state);
      }
    );

    // 6. Reset Rally (keep players, recalculate)
    socket.on('rally:reset', () => {
      if (!requireCoordinator()) return;
      const state = engine.resetRally(data.channelId!, data.teamId);
      io.to(getRoomId()).emit('room:state', state);
    });

    // 7. Clear list
    socket.on('list:clear', () => {
      if (!requireCoordinator()) return;
      const state = engine.clearPlayers(data.channelId!, data.teamId);
      io.to(getRoomId()).emit('room:state', state);
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
}
