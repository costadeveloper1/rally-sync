import { Server, Socket } from 'socket.io';
import { RallyEngine } from './rallyEngine.js';
import { ClientUser } from './types.js';

interface SocketData {
  channelId?: string;
  user?: ClientUser;
}

export function setupSocketHandlers(io: Server, engine: RallyEngine) {
  io.on('connection', (socket: Socket) => {
    const data: SocketData = {};

    // 1. Join room
    socket.on('room:join', ({ channelId, user }: { channelId: string; user: ClientUser }) => {
      if (!channelId) return;

      // Leave previous room if any
      if (data.channelId && data.channelId !== channelId) {
        socket.leave(data.channelId);
      }

      data.channelId = channelId;
      data.user = user;

      socket.join(channelId);

      // Send current state to newly joined client
      const state = engine.getOrCreateRoom(channelId);
      socket.emit('room:state', state);
    });

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
      const state = engine.upsertPlayer(data.channelId!, name, marchTimeSeconds);
      io.to(data.channelId!).emit('room:state', state);
    });

    // 4. Remove player
    socket.on('player:remove', ({ playerId }: { playerId: string }) => {
      if (!requireCoordinator()) return;
      const state = engine.removePlayer(data.channelId!, playerId);
      io.to(data.channelId!).emit('room:state', state);
    });

    // 5. Start / Restart Rally
    socket.on(
      'rally:start',
      (params?: { rallyDuration?: 300 | 600; prepWindow?: 10 | 20 | 60 }) => {
        if (!requireCoordinator()) return;
        const state = engine.startRally(
          data.channelId!,
          params?.rallyDuration,
          params?.prepWindow
        );
        io.to(data.channelId!).emit('room:state', state);
      }
    );

    // 6. Reset Rally (keep players, recalculate)
    socket.on('rally:reset', () => {
      if (!requireCoordinator()) return;
      const state = engine.resetRally(data.channelId!);
      io.to(data.channelId!).emit('room:state', state);
    });

    // 7. Clear list
    socket.on('list:clear', () => {
      if (!requireCoordinator()) return;
      const state = engine.clearPlayers(data.channelId!);
      io.to(data.channelId!).emit('room:state', state);
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
}
