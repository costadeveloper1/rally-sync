import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RallyEngine } from './rallyEngine.js';

describe('RallyEngine Functional Spec Verification', () => {
  it('correctly calculates departure times based on the spec example', () => {
    const engine = new RallyEngine();
    const channelId = 'test-channel-1';

    // Insert players
    engine.upsertPlayer(channelId, 'JR', 36);
    engine.upsertPlayer(channelId, 'Bruno', 40);
    engine.upsertPlayer(channelId, 'FN', 31);

    const room = engine.getOrCreateRoom(channelId);
    assert.equal(room.players.length, 3);
    // Should be sorted descending by march time: Bruno (40), JR (36), FN (31)
    assert.equal(room.players[0].name, 'Bruno');
    assert.equal(room.players[1].name, 'JR');
    assert.equal(room.players[2].name, 'FN');

    // Start rally with 5 min (300s) duration and 20s prep window
    const baseTime = Date.UTC(2026, 10, 19, 21, 8, 0, 0); // 21:08:00.000 UTC
    // Override start time manually to test specific timestamp
    room.startTimeUtc = baseTime;
    room.rallyDuration = 300;
    room.prepWindow = 20;

    // Trigger calculation
    const calculatedRoom = engine.startRally(channelId, 300, 20);
    // Overwrite reference time for deterministic test
    const firstDeparture = calculatedRoom.firstDepartureTimeUtc!;
    const maxMarch = 40;

    // Bruno: departure = firstDeparture + (40 - 40) = firstDeparture
    const bruno = calculatedRoom.players.find((p) => p.name === 'Bruno')!;
    assert.equal(bruno.departureTimeUtc, firstDeparture);

    // JR: departure = firstDeparture + (40 - 36)*1000 = firstDeparture + 4000
    const jr = calculatedRoom.players.find((p) => p.name === 'JR')!;
    assert.equal(jr.departureTimeUtc, firstDeparture + 4000);

    // FN: departure = firstDeparture + (40 - 31)*1000 = firstDeparture + 9000
    const fn = calculatedRoom.players.find((p) => p.name === 'FN')!;
    assert.equal(fn.departureTimeUtc, firstDeparture + 9000);

    // Verify all players hit at the exact same millisecond
    const brunoImpact = bruno.departureTimeUtc + (300 + 40) * 1000;
    const jrImpact = jr.departureTimeUtc + (300 + 36) * 1000;
    const fnImpact = fn.departureTimeUtc + (300 + 31) * 1000;

    assert.equal(brunoImpact, calculatedRoom.targetImpactTimeUtc);
    assert.equal(jrImpact, calculatedRoom.targetImpactTimeUtc);
    assert.equal(fnImpact, calculatedRoom.targetImpactTimeUtc);
  });

  it('updates an existing player without duplicating', () => {
    const engine = new RallyEngine();
    const channelId = 'test-channel-update';

    engine.upsertPlayer(channelId, 'Bruno', 40);
    assert.equal(engine.getOrCreateRoom(channelId).players.length, 1);
    assert.equal(engine.getOrCreateRoom(channelId).players[0].marchTimeSeconds, 40);

    // Update Bruno (teleported closer, march now 25)
    engine.upsertPlayer(channelId, 'bruno', 25);
    assert.equal(engine.getOrCreateRoom(channelId).players.length, 1);
    assert.equal(engine.getOrCreateRoom(channelId).players[0].marchTimeSeconds, 25);
  });

  it('clears players list correctly', () => {
    const engine = new RallyEngine();
    const channelId = 'test-channel-clear';

    engine.upsertPlayer(channelId, 'Player1', 50);
    engine.startRally(channelId, 300, 20);
    assert.equal(engine.getOrCreateRoom(channelId).players.length, 1);

    engine.clearPlayers(channelId);
    const room = engine.getOrCreateRoom(channelId);
    assert.equal(room.players.length, 0);
    assert.equal(room.status, 'idle');
    assert.equal(room.firstDepartureTimeUtc, null);
  });
});
