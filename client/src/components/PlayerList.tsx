import React from 'react';
import { Trash2, Users } from 'lucide-react';
import { RallyPlayer, RallyStatus } from '../types.js';
import { formatSeconds, formatUtcTime } from '../timeParser.js';

interface PlayerListProps {
  players: RallyPlayer[];
  status: RallyStatus;
  currentUtcTime: number;
  isCoordinator: boolean;
  onRemovePlayer: (id: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  status,
  currentUtcTime,
  isCoordinator,
  onRemovePlayer,
}) => {
  if (players.length === 0) {
    return (
      <div className="bg-[#18191c]/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center text-neutral-400">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs font-medium">No players in this channel queue.</p>
        {isCoordinator && (
          <p className="text-[11px] text-amber-400 mt-1">
            Click "+ Add Player" above to build the squad.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#18191c]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      {/* Mini Header */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs bg-black/20">
        <span className="font-bold text-neutral-300">Squad & Departure Times</span>
        <span className="text-[11px] text-neutral-400 font-mono">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </span>
      </div>

      {/* Players List with Progress Line Style */}
      <div className="divide-y divide-white/5">
        {players.map((player) => {
          let diffSeconds = 0;
          let isGoNow = false;
          let isImminent = false;
          let isDeparted = false;

          if (player.departureTimeUtc && status !== 'idle') {
            diffSeconds = Math.ceil((player.departureTimeUtc - currentUtcTime) / 1000);
            if (diffSeconds <= 0 && diffSeconds >= -3) {
              isGoNow = true;
            } else if (diffSeconds > 0 && diffSeconds <= 3) {
              isImminent = true;
            } else if (diffSeconds < -3) {
              isDeparted = true;
            }
          }

          // Progress calculation (percentage elapsed toward departure or march)
          let progressPercent = 0;
          if (status !== 'idle' && player.departureTimeUtc) {
            if (isDeparted) {
              progressPercent = 100;
            } else if (diffSeconds > 0) {
              const totalWait = 60;
              progressPercent = Math.max(5, Math.min(95, 100 - (diffSeconds / totalWait) * 100));
            } else {
              progressPercent = 100;
            }
          }

          return (
            <div
              key={player.id}
              className={`px-4 py-3 flex flex-col gap-1.5 transition-colors ${
                isGoNow
                  ? 'bg-emerald-500/15'
                  : isImminent
                  ? 'bg-amber-500/10'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* Row 1: Dot + Name + Departure Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Status Indicator Dot */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isGoNow
                        ? 'bg-[#23a55a] ring-2 ring-[#23a55a]/40 animate-ping'
                        : isImminent
                        ? 'bg-amber-400 animate-pulse'
                        : isDeparted
                        ? 'bg-neutral-500'
                        : 'bg-amber-400/80'
                    }`}
                  />
                  <span className="font-bold text-white text-sm">
                    {player.name}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    ({formatSeconds(player.marchTimeSeconds)})
                  </span>
                </div>

                {/* Right Status Badge */}
                <div className="flex items-center gap-2">
                  {status === 'idle' || !player.departureTimeUtc ? (
                    <span className="text-[11px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md">
                      Ready
                    </span>
                  ) : isGoNow ? (
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-[#23a55a] text-black shadow-md shadow-emerald-500/30 animate-pulse">
                      GO now
                    </span>
                  ) : isImminent ? (
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-amber-400 text-black">
                      GO in {formatSeconds(diffSeconds)}
                    </span>
                  ) : isDeparted ? (
                    <span className="text-xs font-medium font-mono text-neutral-400">
                      Marching
                    </span>
                  ) : (
                    <span className="text-xs font-bold font-mono text-amber-400">
                      GO in {formatSeconds(diffSeconds)}
                    </span>
                  )}

                  {/* Coordinator delete button */}
                  {isCoordinator && (
                    <button
                      onClick={() => onRemovePlayer(player.id)}
                      title="Remove player"
                      className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Sleek Progress Bar */}
              <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isGoNow
                      ? 'bg-[#23a55a]'
                      : isImminent
                      ? 'bg-amber-400'
                      : isDeparted
                      ? 'bg-neutral-600'
                      : 'bg-amber-500/80'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Row 3: UTC Departure timestamp note */}
              {player.departureTimeUtc && status !== 'idle' && (
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Departure UTC:</span>
                  <span className="text-neutral-300 font-semibold">
                    {formatUtcTime(player.departureTimeUtc)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
