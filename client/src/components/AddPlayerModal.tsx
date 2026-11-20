import React, { useState } from 'react';
import { X, UserPlus, Clock } from 'lucide-react';
import { parseTimeStringToSeconds, formatSeconds } from '../timeParser.js';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (name: string, marchTimeSeconds: number) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, onAddPlayer }) => {
  const [name, setName] = useState('');
  const [marchInput, setMarchInput] = useState('');

  if (!isOpen) return null;

  const parsedSeconds = parseTimeStringToSeconds(marchInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !parsedSeconds || parsedSeconds <= 0) return;

    onAddPlayer(name.trim(), parsedSeconds);
    setName('');
    setMarchInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#18191c] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Add / Edit Player</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Player Name or Alias:
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Rengoku"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111214] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                March Travel Time:
              </label>
              {parsedSeconds !== null && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ={formatSeconds(parsedSeconds)} ({parsedSeconds}s)
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. 35s, 01:15 or 6m"
              value={marchInput}
              onChange={(e) => setMarchInput(e.target.value)}
              className="w-full bg-[#111214] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors font-mono"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Accepts seconds (e.g. <code className="text-neutral-300">40</code>), minutes and seconds (e.g. <code className="text-neutral-300">01:15</code> or <code className="text-neutral-300">1m30s</code>).
            </p>
          </div>

          <p className="text-[11px] text-amber-400/90 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">
            💡 Tip: If the player already exists in the queue, entering the same name updates their march time without creating a duplicate.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !parsedSeconds}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Save Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
