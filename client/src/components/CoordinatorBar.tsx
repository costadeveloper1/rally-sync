import React, { useState } from 'react';
import { Play, RotateCcw, UserPlus, Sliders, Copy, Check, Trash2 } from 'lucide-react';
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
  onClearList,
}) => {
  const [copied, setCopied] = useState(false);
  const isRallyActive = state.status !== 'idle' && state.firstDepartureTimeUtc !== null;
  const hasPlayers = state.players.length > 0;

  // Copy formatted rally departures to clipboard
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

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-https or iframe environments
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="bg-[#18191c]/95 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-2">
      {/* Left Action Buttons: Start & Settings */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Start / Restart Button */}
        <button
          onClick={state.status === 'idle' ? onStartRally : onResetRally}
          disabled={!hasPlayers}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
            state.status === 'idle'
              ? 'bg-[#23a55a] hover:bg-[#1f934f] text-white shadow-emerald-500/20'
              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={state.status === 'idle' ? 'Start rally countdown' : 'Restart countdown with current time'}
        >
          {state.status === 'idle' ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Rally</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </>
          )}
        </button>

        {/* Settings Button: Duration & Prep */}
        <button
          onClick={onOpenSettings}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Adjust Fixed Duration and Preparation Window"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>{state.rallyDuration / 60}m • {state.prepWindow}s</span>
        </button>

        {/* Add Player Button */}
        <button
          onClick={onOpenAddPlayer}
          className="px-3 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#5865F2]/20 cursor-pointer"
          title="Add or update a player"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Player</span>
        </button>
      </div>

      {/* Right Action Buttons: Copy & Clear */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Copy Departures Button (Active after start) */}
        <button
          onClick={handleCopyRallyInfo}
          disabled={!isRallyActive}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : isRallyActive
              ? 'bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white border-white/10 cursor-pointer shadow-xs'
              : 'bg-white/5 text-neutral-500 border-white/5 opacity-50 cursor-not-allowed'
          }`}
          title={
            isRallyActive
              ? 'Copy formatted departure schedule to clipboard'
              : 'Copy button will be enabled once rally starts'
          }
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Times</span>
            </>
          )}
        </button>

        {/* Clear List Button */}
        {hasPlayers && (
          <button
            onClick={onClearList}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
            title="Clear all players from queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
