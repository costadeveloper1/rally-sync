import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RallyEngine } from './rallyEngine.js';
import { setupSocketHandlers } from './socketHandler.js';
import { RallyRoomState } from './types.js';

describe('End-to-End Socket.io & Multi-User Synchronization', () => {
  let server: http.Server;
  let ioServer: Server;
  let port: number;
  let coordinatorSocket: ClientSocketType;
  let spectatorSocket: ClientSocketType;

  before(async () => {
    const app = express();
    server = http.createServer(app);
    ioServer = new Server(server);
    const engine = new RallyEngine();
    setupSocketHandlers(ioServer, engine);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  after(async () => {
    coordinatorSocket?.disconnect();
    spectatorSocket?.disconnect();
    ioServer?.close();
    server?.close();
  });

  it('coordinates multi-user join, permissions, player insertion, rally start, and reset', async () => {
    const url = `http://localhost:${port}`;
    const channelId = 'sync-channel-test';

    // 1. Connect coordinator
    coordinatorSocket = ClientSocket(url);
    await new Promise<void>((res) => coordinatorSocket.on('connect', res));

    coordinatorSocket.emit('room:join', {
      channelId,
      user: { id: 'c1', username: 'Líder', isCoordinator: true },
    });

    // 2. Connect spectator
    spectatorSocket = ClientSocket(url);
    await new Promise<void>((res) => spectatorSocket.on('connect', res));

    spectatorSocket.emit('room:join', {
      channelId,
      user: { id: 's1', username: 'Guerreiro', isCoordinator: false },
    });

    // Wait for initial sync
    const initialSpectatorState = await new Promise<RallyRoomState>((res) => {
      spectatorSocket.once('room:state', res);
    });
    assert.equal(initialSpectatorState.players.length, 0);

    // 3. Coordinator adds player Bruno (40s)
    coordinatorSocket.emit('player:upsert', { name: 'Bruno', marchTimeSeconds: 40 });

    const stateWithOne = await new Promise<RallyRoomState>((res) => {
      spectatorSocket.once('room:state', res);
    });
    assert.equal(stateWithOne.players.length, 1);
    assert.equal(stateWithOne.players[0].name, 'Bruno');
    assert.equal(stateWithOne.players[0].marchTimeSeconds, 40);

    // 4. Coordinator adds player JR (36s)
    coordinatorSocket.emit('player:upsert', { name: 'JR', marchTimeSeconds: 36 });

    const stateWithTwo = await new Promise<RallyRoomState>((res) => {
      spectatorSocket.once('room:state', res);
    });
    assert.equal(stateWithTwo.players.length, 2);
    // Ordered descending by march
    assert.equal(stateWithTwo.players[0].name, 'Bruno');
    assert.equal(stateWithTwo.players[1].name, 'JR');

    // 5. Coordinator starts rally
    coordinatorSocket.emit('rally:start', { rallyDuration: 300, prepWindow: 20 });

    const activeState = await new Promise<RallyRoomState>((res) => {
      spectatorSocket.once('room:state', res);
    });
    assert.equal(activeState.status, 'countdown');
    assert.ok(activeState.firstDepartureTimeUtc);
    assert.ok(activeState.targetImpactTimeUtc);
    assert.equal(activeState.players[0].departureTimeUtc, activeState.firstDepartureTimeUtc);
    assert.equal(
      activeState.players[1].departureTimeUtc,
      activeState.firstDepartureTimeUtc + 4000
    );

    // 6. Security verification: Spectator tries to clear list -> must be rejected
    spectatorSocket.emit('list:clear');
    const errPromise = new Promise<string>((res) => {
      spectatorSocket.once('error:msg', (data: { message: string }) => res(data.message));
    });
    const errMsg = await errPromise;
    assert.match(errMsg, /Only the Coordinator/);

    // Ensure state remained untouched
    coordinatorSocket.emit('room:join', {
      channelId,
      user: { id: 'c1', username: 'Líder', isCoordinator: true },
    });
    const stillActiveState = await new Promise<RallyRoomState>((res) => {
      coordinatorSocket.once('room:state', res);
    });
    assert.equal(stillActiveState.players.length, 2);

    // 7. Coordinator clears list
    coordinatorSocket.emit('list:clear');
    const clearedState = await new Promise<RallyRoomState>((res) => {
      spectatorSocket.once('room:state', res);
    });
    assert.equal(clearedState.players.length, 0);
    assert.equal(clearedState.status, 'idle');
  });
});
