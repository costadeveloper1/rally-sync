import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { setupDiscordSdk, isEmbeddedInDiscord } from './discord.js';
import { soundManager } from './audioAlert.js';
import { RallyRoomState, ClientUser } from './types.js';
import { Header } from './components/Header.js';
import { CountdownBanner } from './components/CountdownBanner.js';
import { CoordinatorBar } from './components/CoordinatorBar.js';
import { PlayerList } from './components/PlayerList.js';
import { AddPlayerModal } from './components/AddPlayerModal.js';
import { SettingsModal } from './components/SettingsModal.js';

export const App: React.FC = () => {
  const [user, setUser] = useState<ClientUser | null>({
    id: 'loading_user',
    username: 'Commander',
    isCoordinator: true,
  });
  const [channelId, setChannelId] = useState<string>('voice-channel');
  const [roomState, setRoomState] = useState<RallyRoomState>({
    channelId: 'voice-channel',
    rallyDuration: 300,
    prepWindow: 20,
    status: 'idle',
    startTimeUtc: null,
    firstDepartureTimeUtc: null,
    targetImpactTimeUtc: null,
    players: [],
    updatedAt: Date.now(),
  });
  const [currentUtcTime, setCurrentUtcTime] = useState<number>(Date.now());
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Modals state
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const timeOffsetRef = useRef<number>(0);
  const triggeredSoundsRef = useRef<Set<string>>(new Set());

  // 1. Initialize Discord SDK & Socket
  useEffect(() => {
    let active = true;
    setIsDevMode(!isEmbeddedInDiscord());

    async function init() {
      try {
        const { channelId: detectedChannel, user: authedUser } = await setupDiscordSdk();
        if (!active) return;

        setUser(authedUser);
        setChannelId(detectedChannel);

        // Connect to Socket.io via polling + websocket (optimal for Discord proxy)
        const socket = io({
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('room:join', {
            channelId: detectedChannel,
            user: authedUser,
          });
          socket.emit('time:ping', { clientTime: Date.now() });
        });

        socket.on('room:state', (newState: RallyRoomState) => {
          setRoomState(newState);
        });

        socket.on('time:pong', ({ clientTime, serverTime }: { clientTime: number; serverTime: number }) => {
          const now = Date.now();
          const rtt = now - clientTime;
          const estimatedServerTime = serverTime + rtt / 2;
          timeOffsetRef.current = estimatedServerTime - now;
        });

        socket.on('error:msg', ({ message }: { message: string }) => {
          setErrorMessage(message);
          setTimeout(() => setErrorMessage(null), 4000);
        });
      } catch (err: any) {
        console.error('[App Init Error]', err);
      }
    }

    init();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // 2. High-precision UTC Clock & Time-Sync interval
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const synchedTime = Date.now() + timeOffsetRef.current;
      setCurrentUtcTime(synchedTime);
    }, 100);

    const pingInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('time:ping', { clientTime: Date.now() });
      }
    }, 15000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pingInterval);
    };
  }, []);

  // 3. Audio & Visual Trigger Loop
  useEffect(() => {
    if (!roomState || roomState.status === 'idle' || isMuted) return;

    for (const player of roomState.players) {
      if (!player.departureTimeUtc) continue;

      const diffSeconds = Math.ceil((player.departureTimeUtc - currentUtcTime) / 1000);

      // Warning beeps at 3s, 2s, 1s
      if (diffSeconds >= 1 && diffSeconds <= 3) {
        const soundKey = `${player.id}_${diffSeconds}_warn`;
        if (!triggeredSoundsRef.current.has(soundKey)) {
          triggeredSoundsRef.current.add(soundKey);
          soundManager.playWarningBeep(diffSeconds);
        }
      }

      // Launch Chime at 0s!
      if (diffSeconds === 0) {
        const soundKey = `${player.id}_0_launch`;
        if (!triggeredSoundsRef.current.has(soundKey)) {
          triggeredSoundsRef.current.add(soundKey);
          soundManager.playLaunchChime();
        }
      }
    }
  }, [currentUtcTime, roomState, isMuted]);

  // Handlers for Coordinator actions
  const handleUpsertPlayer = (name: string, marchTimeSeconds: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('player:upsert', { name, marchTimeSeconds });
    } else {
      // Local optimistic update
      setRoomState((prev) => {
        const idx = prev.players.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
        const updated = [...prev.players];
        if (idx >= 0) {
          updated[idx].marchTimeSeconds = marchTimeSeconds;
        } else {
          updated.push({
            id: `p_${Date.now()}`,
            name,
            marchTimeSeconds,
          });
        }
        return { ...prev, players: updated };
      });
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('player:remove', { playerId });
    } else {
      setRoomState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
      }));
    }
  };

  const handleStartRally = () => {
    triggeredSoundsRef.current.clear();
    socketRef.current?.emit('rally:start', {
      rallyDuration: roomState.rallyDuration || 300,
      prepWindow: roomState.prepWindow || 20,
    });
  };

  const handleChangeDuration = (rallyDuration: 300 | 600) => {
    socketRef.current?.emit('rally:start', {
      rallyDuration,
      prepWindow: roomState.prepWindow || 20,
    });
  };

  const handleChangePrep = (prepWindow: 10 | 20 | 60) => {
    socketRef.current?.emit('rally:start', {
      rallyDuration: roomState.rallyDuration || 300,
      prepWindow,
    });
  };

  const handleResetRally = () => {
    triggeredSoundsRef.current.clear();
    socketRef.current?.emit('rally:reset');
  };

  const handleClearList = () => {
    triggeredSoundsRef.current.clear();
    socketRef.current?.emit('list:clear');
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleDevRole = () => {
    if (!user) return;
    const nextRole = !user.isCoordinator;
    localStorage.setItem('rally_dev_is_coordinator', String(nextRole));
    const updatedUser = { ...user, isCoordinator: nextRole };
    setUser(updatedUser);
    socketRef.current?.emit('room:join', { channelId, user: updatedUser });
  };

  return (
    <div className="min-h-screen bg-[#0e0f11] text-[#DBDEE1] flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-black">
      {/* Header */}
      <Header
        currentUtcTime={currentUtcTime}
        user={user}
        channelId={channelId}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleDevRole={handleToggleDevRole}
        isDevMode={isDevMode}
      />

      {/* Main Content: Compact Mobile HUD Width */}
      <main className="flex-1 max-w-md w-full mx-auto p-3.5 space-y-3">
        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[11px] text-rose-400 font-bold ml-2 underline"
            >
              Close
            </button>
          </div>
        )}

        {/* Hero Countdown / Next Call Banner */}
        <CountdownBanner state={roomState} currentUtcTime={currentUtcTime} />

        {/* Compact Coordinator Action Bar */}
        {user?.isCoordinator && (
          <CoordinatorBar
            state={roomState}
            onOpenAddPlayer={() => setIsAddPlayerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onStartRally={handleStartRally}
            onResetRally={handleResetRally}
            onClearList={handleClearList}
          />
        )}

        {/* Compact Players List */}
        <PlayerList
          players={roomState.players}
          status={roomState.status}
          currentUtcTime={currentUtcTime}
          isCoordinator={Boolean(user?.isCoordinator)}
          onRemovePlayer={handleRemovePlayer}
        />
      </main>

      {/* Modal: Add Player */}
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        onAddPlayer={handleUpsertPlayer}
      />

      {/* Modal: Settings (Duration & Prep) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rallyDuration={roomState.rallyDuration}
        prepWindow={roomState.prepWindow}
        onChangeDuration={handleChangeDuration}
        onChangePrep={handleChangePrep}
      />

      {/* Footer */}
      <footer className="py-2.5 text-center text-[10px] text-neutral-500">
        Rally Sync • UTC Real-Time HUD
      </footer>
    </div>
  );
};
