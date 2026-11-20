import React from 'react';
import { X, Sliders, Clock, Hourglass } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rallyDuration: 300 | 600;
  prepWindow: 10 | 20 | 60;
  onChangeDuration: (duration: 300 | 600) => void;
  onChangePrep: (prep: 10 | 20 | 60) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rallyDuration,
  prepWindow,
  onChangeDuration,
  onChangePrep,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#18191c] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Rally Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Rally Duration */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Fixed Rally Wait Time:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeDuration(300)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  rallyDuration === 300
                    ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-[#111214] text-neutral-400 border-white/10 hover:text-white'
                }`}
              >
                5 Minutes (300s)
              </button>
              <button
                type="button"
                onClick={() => onChangeDuration(600)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  rallyDuration === 600
                    ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-[#111214] text-neutral-400 border-white/10 hover:text-white'
                }`}
              >
                10 Minutes (600s)
              </button>
            </div>
          </div>

          {/* Prep Window */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Hourglass className="w-3.5 h-3.5 text-amber-400" />
              Preparation Window (Initial Countdown):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onChangePrep(sec as 10 | 20 | 60)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    prepWindow === sec
                      ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-[#111214] text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  {sec === 60 ? '1 Minute' : `${sec} Seconds`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              Buffer time before the first player marches, allowing the team to prepare.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
