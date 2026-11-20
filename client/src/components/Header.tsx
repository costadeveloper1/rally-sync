import React from 'react';
import { Volume2, VolumeX, Shield, Eye, Clock, RefreshCw } from 'lucide-react';
import { formatUtcTime } from '../timeParser.js';
import { ClientUser } from '../types.js';

interface HeaderProps {
  currentUtcTime: number;
  user: ClientUser | null;
  channelId: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleDevRole?: () => void;
  isDevMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUtcTime,
  user,
  channelId,
  isMuted,
  onToggleMute,
  onToggleDevRole,
  isDevMode,
}) => {
  return (
    <header className="bg-[#18191c]/90 backdrop-blur-md border-b border-white/10 px-3.5 py-2.5 sticky top-0 z-20 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Channel info */}
        <div className="flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold leading-none">
              Channel
            </span>
            <span className="text-xs font-mono font-bold text-white leading-tight truncate max-w-[110px]">
              #{channelId}
            </span>
          </div>
        </div>

        {/* Live UTC Clock */}
        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-xs md:text-sm font-bold text-white tracking-wide">
            {formatUtcTime(currentUtcTime)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* User Role */}
          {user && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                user.isCoordinator
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {user.isCoordinator ? (
                <>
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Leader</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Member</span>
                </>
              )}
            </div>
          )}

          {/* Dev Role Switch */}
          {isDevMode && onToggleDevRole && (
            <button
              onClick={onToggleDevRole}
              title="Switch Role (Dev)"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute audio alerts' : 'Mute audio alerts'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
