import React, { useState } from 'react';
import { Play, RotateCcw, Sliders, Copy, Check } from 'lucide-react';
import { RallyRoomState } from '../types.js';
import { formatUtcTime } from '../timeParser.js';

interface CoordinatorBarProps {
  state: RallyRoomState;
  onOpenAddPlayer: () => void;
  onOpenSettings: () => void;
  onStartRally: () => void;
  onResetRally: () => void;
  onClearList: () => void;
}

export const CoordinatorBar: React.FC<CoordinatorBarProps> = ({
  state,
  onOpenAddPlayer,
  onOpenSettings,
  onStartRally,
  onResetRally,
}) => {
  const [copied, setCopied] = useState(false);
  const isRallyActive = state.status !== 'idle' && state.firstDepartureTimeUtc !== null;
  const hasPlayers = state.players.length > 0;

  // Universal clipboard copy that works seamlessly inside Discord Activity iframes
  const handleCopyRallyInfo = async () => {
    if (!isRallyActive || !hasPlayers) return;

    // Requested clean format: "1.PlayerName - HH:MM:SS UTC"
    const lines = state.players.map((player, idx) => {
      const departureStr = player.departureTimeUtc
        ? formatUtcTime(player.departureTimeUtc)
        : '--:--:-- UTC';
      return `${idx + 1}.${player.name} - ${departureStr}`;
    });

    const text = lines.join('\n');
    let success = false;

    // Strategy 1: DOM textarea selection (bypasses iframe Permissions Policy blocks in Discord)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      success = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      success = false;
    }

    // Strategy 2: Modern Navigator Clipboard fallback
    if (!success && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        console.warn('Clipboard writeText fallback failed:', err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#18191c]/95 backdrop-blur-md rounded-2xl p-2 border border-white/10 shadow-xl flex items-center justify-between gap-1.5 w-full">
      {/* 1. Start / Restart Button */}
      <button
        type="button"
        onClick={state.status === 'idle' ? onStartRally : onResetRally}
        disabled={!hasPlayers}
        className={`flex-1 min-w-0 py-2 px-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all shadow-md cursor-pointer ${
          state.status === 'idle'
            ? 'bg-[#23a55a] hover:bg-[#1f934f] text-white shadow-emerald-500/20'
            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={state.status === 'idle' ? 'Start rally countdown' : 'Restart countdown'}
      >
        {state.status === 'idle' ? (
          <>
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="truncate">Start</span>
          </>
        ) : (
          <>
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Restart</span>
          </>
        )}
      </button>

      {/* 2. Settings Button: Duration & Prep */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex-1 min-w-0 py-2 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        title="Adjust Duration & Preparation Window"
      >
        <Sliders className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="truncate">{state.rallyDuration / 60}m • {state.prepWindow}s</span>
      </button>

      {/* 3. + Player Button (Reduced size, removed 'Add', enlarged '+') */}
      <button
        type="button"
        onClick={onOpenAddPlayer}
        className="flex-1 min-w-0 py-2 px-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-md shadow-[#5865F2]/20 cursor-pointer"
        title="Add player to queue"
      >
        <span className="text-sm font-black leading-none text-white shrink-0">+</span>
        <span className="truncate">Player</span>
      </button>

      {/* 4. Copy Times Button (Now on the same single row) */}
      <button
        type="button"
        onClick={handleCopyRallyInfo}
        disabled={!isRallyActive}
        className={`flex-1 min-w-0 py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
          copied
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : isRallyActive
            ? 'bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white border-white/10 cursor-pointer shadow-xs'
            : 'bg-white/5 text-neutral-500 border-white/5 opacity-40 cursor-not-allowed'
        }`}
        title={
          isRallyActive
            ? 'Copy formatted departures to clipboard'
            : 'Enabled once rally starts'
        }
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-bold truncate">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Copy Times</span>
          </>
        )}
      </button>
    </div>
  );
};
