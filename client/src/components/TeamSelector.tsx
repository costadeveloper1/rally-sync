import React from 'react';
import { TeamId } from '../types.js';

interface TeamSelectorProps {
  currentTeam: TeamId;
  onSelectTeam: (team: TeamId) => void;
  primaryCount: number;
  secondaryCount: number;
  primaryActive: boolean;
  secondaryActive: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  currentTeam,
  onSelectTeam,
  primaryCount,
  secondaryCount,
  primaryActive,
  secondaryActive,
}) => {
  return (
    <div className="bg-[#18191c] p-1 rounded-xl border border-white/5 flex gap-1 shadow-sm">
      {/* Primary Rally Tab */}
      <button
        type="button"
        onClick={() => onSelectTeam('primary')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
          currentTeam === 'primary'
            ? 'bg-amber-500 text-black shadow-md'
            : 'text-neutral-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>🏰 Primary Rally</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            currentTeam === 'primary'
              ? 'bg-black/25 text-black'
              : 'bg-white/10 text-neutral-300'
          }`}
        >
          {primaryCount}
        </span>
        {primaryActive && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Rally" />
        )}
      </button>

      {/* Secondary Rally Tab */}
      <button
        type="button"
        onClick={() => onSelectTeam('secondary')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
          currentTeam === 'secondary'
            ? 'bg-amber-500 text-black shadow-md'
            : 'text-neutral-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>🏹 Secondary Rally</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            currentTeam === 'secondary'
              ? 'bg-black/25 text-black'
              : 'bg-white/10 text-neutral-300'
          }`}
        >
          {secondaryCount}
        </span>
        {secondaryActive && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Rally" />
        )}
      </button>
    </div>
  );
};
