import React from 'react';
import { Target, Timer } from 'lucide-react';
import { RallyRoomState } from '../types.js';
import { formatSeconds } from '../timeParser.js';

interface CountdownBannerProps {
  state: RallyRoomState;
  currentUtcTime: number;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({ state, currentUtcTime }) => {
  const { status, firstDepartureTimeUtc, targetImpactTimeUtc, players } = state;

  // Impact countdown in top right
  const diffToImpact = targetImpactTimeUtc
    ? Math.max(0, Math.ceil((targetImpactTimeUtc - currentUtcTime) / 1000))
    : 0;

  // If idle or no players
  if (status === 'idle' || !firstDepartureTimeUtc || players.length === 0) {
    return (
      <div className="bg-[#18191c]/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <span className="text-xs">🎯</span>
            </div>
            <span className="font-bold text-white text-sm tracking-wide">Rally Sync</span>
          </div>
          <span className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-neutral-500" />
            <span>Waiting to Start</span>
          </span>
        </div>

        <div className="text-center py-4 text-neutral-400">
          <Timer className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-amber-400" />
          <p className="text-sm font-semibold text-neutral-200">Rally Ready to Launch</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {players.length === 0
              ? 'Add players using the button above to begin.'
              : `${players.length} player(s) in queue. Click Start Rally.`}
          </p>
        </div>
      </div>
    );
  }

  // Find the currently active or imminent player
  let activePlayerIndex = -1;
  let isGoNow = false;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p.departureTimeUtc) continue;
    const diff = Math.ceil((p.departureTimeUtc - currentUtcTime) / 1000);

    // Active "GO NOW" window (from 0 down to -3s)
    if (diff <= 0 && diff >= -3) {
      activePlayerIndex = i;
      isGoNow = true;
      break;
    }

    // Next upcoming player
    if (diff > 0) {
      activePlayerIndex = i;
      isGoNow = false;
      break;
    }
  }

  // If all players have already departed
  if (activePlayerIndex === -1) {
    return (
      <div className="bg-[#18191c]/95 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span className="text-xs">🎯</span>
            </div>
            <span className="font-bold text-white text-sm">Rally Sync</span>
          </div>
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Impact in {formatSeconds(diffToImpact)}</span>
          </span>
        </div>

        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 text-center">
          <Target className="w-8 h-8 text-emerald-400 mx-auto mb-1 animate-pulse" />
          <h3 className="text-base font-bold text-emerald-300">All troops are marching!</h3>
          <p className="text-xs text-neutral-300 mt-1">
            Synchronized target impact in: <strong className="text-white font-mono text-sm">{formatSeconds(diffToImpact)}</strong>
          </p>
        </div>
      </div>
    );
  }

  const activePlayer = players[activePlayerIndex];
  const nextPlayer = players[activePlayerIndex + 1];
  const diffSeconds = activePlayer.departureTimeUtc
    ? Math.max(0, Math.ceil((activePlayer.departureTimeUtc - currentUtcTime) / 1000))
    : 0;

  // Subtitle information: when next player launches
  let subtitleText = '';
  if (nextPlayer && nextPlayer.departureTimeUtc && activePlayer.departureTimeUtc) {
    const diffToNext = Math.round(
      (nextPlayer.departureTimeUtc - activePlayer.departureTimeUtc) / 1000
    );
    subtitleText = isGoNow
      ? `Go now. Then ${nextPlayer.name} ${diffToNext}s later.`
      : `GO at +0:00, then ${nextPlayer.name} ${diffToNext}s later`;
  } else {
    subtitleText = isGoNow ? 'Go now! Last player in sequence.' : 'Last player in sequence.';
  }

  const isFirstCall = activePlayerIndex === 0;

  return (
    <div className="bg-[#18191c]/95 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl space-y-3">
      {/* Top Header Row matching screenshot */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-xs shadow-md shadow-amber-500/30">
            🎯
          </div>
          <span className="font-black text-white text-sm tracking-wide">Rally Sync</span>
        </div>

        {/* Impact in M:SS */}
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-neutral-300">
            Impact in {formatSeconds(diffToImpact)}
          </span>
        </div>
      </div>

      {/* Main Hero Card */}
      {isGoNow ? (
        /* GREEN "GO" CARD (Image 2) */
        <div className="bg-[#23a55a] rounded-2xl p-5 text-black shadow-lg shadow-[#23a55a]/30 transition-all duration-200 animate-pulse">
          <span className="text-[11px] font-black tracking-widest uppercase block opacity-85">
            START NOW
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight mt-0.5">
            {activePlayer.name}
          </h2>
          <div className="text-6xl md:text-7xl font-black tracking-tighter my-1 leading-none">
            GO
          </div>
          <p className="text-xs font-bold opacity-90 mt-1">
            {subtitleText}
          </p>
        </div>
      ) : (
        /* YELLOW "COUNTDOWN" CARD (Image 1 and 3) */
        <div className="bg-[#111214] rounded-2xl p-5 border border-amber-500/25 shadow-inner">
          <span className="text-[11px] font-black tracking-widest uppercase text-amber-400 block">
            {isFirstCall ? 'FIRST CALL' : 'NEXT CALL'}
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight mt-0.5">
            {activePlayer.name}
          </h2>
          <div className="text-6xl md:text-7xl font-mono font-black text-[#FEE75C] tracking-tighter my-1 leading-none">
            {formatSeconds(diffSeconds)}
          </div>
          <p className="text-xs font-medium text-neutral-400 mt-1">
            {subtitleText}
          </p>
        </div>
      )}
    </div>
  );
};
