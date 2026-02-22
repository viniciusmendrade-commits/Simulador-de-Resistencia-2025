import React, { useState, useEffect } from 'react';
import { getScores } from '../App';
import type { Score } from '../types';
import { DISASTER_CONFIG } from '../constants';

interface ScoresScreenProps {
  onBack: () => void;
}

const ScoresScreen: React.FC<ScoresScreenProps> = ({ onBack }) => {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    setScores(getScores());
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 p-4"
      style={{
        backgroundImage: "radial-gradient(ellipse at top, #1e293b 0%, #020617 70%)"
      }}
    >
      <div className="w-full max-w-lg bg-slate-900/70 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-800 p-8 text-white animate-[fade-in_0.5s_ease-out] flex flex-col" style={{maxHeight: '90vh'}}>
        <h1 className="text-4xl font-bold font-orbitron text-amber-400 tracking-wider text-center mb-6 flex-shrink-0">
          Últimas Pontuações
        </h1>
        
        {scores.length > 0 ? (
          <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-2">
            {scores.map((score) => {
              const disasterIcons = score.disasters.map((disasterId, index) => {
                const disasterInfo = DISASTER_CONFIG[disasterId];
                const DisasterIcon = disasterInfo ? disasterInfo.Icon : () => null;
                return <DisasterIcon key={index} className="text-2xl text-slate-400" title={disasterInfo.label} />;
              });

              return (
                <div
                  key={score.timestamp}
                  className="flex justify-between items-center bg-slate-800/80 p-3 rounded-lg text-slate-200"
                >
                  <div className="flex items-center gap-4 font-bold">
                     <span className="font-orbitron text-amber-400 w-28 truncate text-lg">{score.playerName}</span>
                      <div className="flex items-center gap-1.5">
                        {disasterIcons}
                      </div>
                     <span className="text-white text-lg">{score.integrity.toFixed(0)}%</span>
                  </div>
                  <span className="font-mono text-slate-300 text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(score.cost)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-center text-slate-400">
            <p>Nenhuma pontuação registrada ainda. Jogue uma partida para aparecer aqui!</p>
          </div>
        )}

        <button
          onClick={onBack}
          className="mt-8 w-full p-3 text-lg font-semibold text-slate-900 bg-amber-500 rounded-lg hover:bg-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex-shrink-0"
        >
          Voltar
        </button>
      </div>
      <style>{`
          @keyframes fade-in {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
          }
      `}</style>
    </div>
  );
};

export default ScoresScreen;
