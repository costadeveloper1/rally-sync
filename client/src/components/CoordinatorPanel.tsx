import React, { useState } from 'react';
import { UserPlus, Play, RotateCcw, Trash2, Clock, Hourglass } from 'lucide-react';
import { parseTimeStringToSeconds, formatSeconds } from '../timeParser.js';
import { RallyRoomState } from '../types.js';

interface CoordinatorPanelProps {
  state: RallyRoomState;
  onUpsertPlayer: (name: string, marchTimeSeconds: number) => void;
  onStartRally: (duration: 300 | 600, prep: 10 | 20 | 60) => void;
  onResetRally: () => void;
  onClearList: () => void;
}

export const CoordinatorPanel: React.FC<CoordinatorPanelProps> = ({
  state,
  onUpsertPlayer,
  onStartRally,
  onResetRally,
  onClearList,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [marchInput, setMarchInput] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<300 | 600>(state.rallyDuration || 300);
  const [selectedPrep, setSelectedPrep] = useState<10 | 20 | 60>(state.prepWindow || 20);

  const parsedSeconds = parseTimeStringToSeconds(marchInput);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    if (!parsedSeconds || parsedSeconds <= 0) return;

    onUpsertPlayer(playerName.trim(), parsedSeconds);
    setPlayerName('');
    setMarchInput('');
  };

  return (
    <div className="bg-[#2B2D31] rounded-2xl p-5 border border-[#1E1F22] shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[#1E1F22] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm tracking-wide uppercase">
            🛡️ Painel do Coordenador
          </span>
          <span className="text-xs text-[#949BA4]">| Apenas usuários autorizados</span>
        </div>
      </div>

      {/* Parameters: Rally Duration & Prep Window */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rally Duration */}
        <div className="bg-[#1E1F22] p-3 rounded-xl border border-[#35363C]">
          <label className="text-xs text-[#949BA4] font-medium flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-[#5865F2]" />
            Duração Fixa do Rally (Espera):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedDuration(300)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                selectedDuration === 300
                  ? 'bg-[#5865F2] text-white border-[#5865F2] shadow-md shadow-[#5865F2]/20'
                  : 'bg-[#2B2D31] text-[#949BA4] border-[#35363C] hover:text-white'
              }`}
            >
              5 Minutos (300s)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDuration(600)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                selectedDuration === 600
                  ? 'bg-[#5865F2] text-white border-[#5865F2] shadow-md shadow-[#5865F2]/20'
                  : 'bg-[#2B2D31] text-[#949BA4] border-[#35363C] hover:text-white'
              }`}
            >
              10 Minutos (600s)
            </button>
          </div>
        </div>

        {/* Preparation Window */}
        <div className="bg-[#1E1F22] p-3 rounded-xl border border-[#35363C]">
          <label className="text-xs text-[#949BA4] font-medium flex items-center gap-1.5 mb-2">
            <Hourglass className="w-3.5 h-3.5 text-[#5865F2]" />
            Janela de Preparação (Contagem Inicial):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 20, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedPrep(sec as 10 | 20 | 60)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                  selectedPrep === sec
                    ? 'bg-[#5865F2] text-white border-[#5865F2] shadow-md shadow-[#5865F2]/20'
                    : 'bg-[#2B2D31] text-[#949BA4] border-[#35363C] hover:text-white'
                }`}
              >
                {sec === 60 ? '1 Minuto' : `${sec} Segundos`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Player Input Form */}
      <form onSubmit={handleAddPlayer} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nome / Nick do Jogador (ex: Bruno)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="flex-1 bg-[#1E1F22] border border-[#35363C] focus:border-[#5865F2] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#949BA4] outline-none transition-colors"
          />
          <div className="relative sm:w-56">
            <input
              type="text"
              placeholder="Marcha (ex: 35s ou 1:15)"
              value={marchInput}
              onChange={(e) => setMarchInput(e.target.value)}
              className="w-full bg-[#1E1F22] border border-[#35363C] focus:border-[#5865F2] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#949BA4] outline-none transition-colors"
            />
            {parsedSeconds !== null && (
              <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-emerald-400 pointer-events-none">
                ={formatSeconds(parsedSeconds)}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!playerName.trim() || !parsedSeconds}
            className="bg-[#248046] hover:bg-[#1a6334] disabled:opacity-40 disabled:hover:bg-[#248046] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#248046]/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
        <p className="text-xs text-[#949BA4]">
          💡 Dica: Se o jogador já estiver na lista, digitar seu nome com novo tempo atualiza a marcha imediatamente sem duplicar.
        </p>
      </form>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#1E1F22]">
        <button
          type="button"
          onClick={() => onStartRally(selectedDuration, selectedPrep)}
          disabled={state.players.length === 0}
          className="flex-1 sm:flex-none bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 disabled:hover:bg-[#5865F2] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/25 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Iniciar / Reiniciar Sequência</span>
        </button>

        <button
          type="button"
          onClick={onResetRally}
          disabled={state.players.length === 0}
          className="bg-[#35363C] hover:bg-[#404249] disabled:opacity-40 text-white font-medium text-sm px-4 py-3 rounded-xl transition-colors flex items-center gap-2 border border-[#404249]"
          title="Recalcula com a hora atual mantendo os mesmos jogadores"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Repetir Rally</span>
        </button>

        <button
          type="button"
          onClick={onClearList}
          disabled={state.players.length === 0}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium text-sm px-4 py-3 rounded-xl transition-colors flex items-center gap-2 ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>Limpar Lista</span>
        </button>
      </div>
    </div>
  );
};
