import React, { useState, useMemo, useEffect } from 'react';
import type { BuildingState, ComponentHealth, SimulationPhase, Score } from '../types';
import { BuildingComponentId as BCI, MaterialTypeId, DisasterId } from '../types';
import { COMPONENT_CONFIG, DISASTER_CONFIG, NUMBER_OF_FLOORS, MIN_FLOOR_AREA, MAX_FLOOR_AREA } from '../constants';
import { playClick } from './sounds';

interface ControlPanelProps {
  buildingState: BuildingState;
  componentHealth: ComponentHealth;
  onMaterialChange: (component: BCI, material: MaterialTypeId, levelIndex: number) => void;
  onStartSimulation: () => void;
  onNextWave: () => void;
  onRepairComponent: (componentId: BCI, levelIndex: number) => void;
  onSaveScore: (playerName: string) => void;
  onReset: () => void;
  simulationState: {
    phase: SimulationPhase;
    activeDisaster: DisasterId | null;
    resultMessage: string | null;
  };
  scores: Score[];
  selectedLevel: number | 'roof' | 'foundation';
  onSelectLevel: (level: number | 'roof' | 'foundation') => void;
  floorArea: number;
  onFloorAreaChange: (area: number) => void;
  copiedFloor: Record<string, MaterialTypeId> | null;
  onCopyFloor: () => void;
  onPasteFloor: () => void;
}

const MaterialSelector: React.FC<{
  componentId: BCI;
  currentMaterial: MaterialTypeId;
  onChange: (material: MaterialTypeId) => void;
  disabled: boolean;
}> = ({ componentId, currentMaterial, onChange, disabled }) => {
  const config = COMPONENT_CONFIG[componentId];
  
  const defenseComponentIds = [BCI.LightningRod, BCI.WindDampers, BCI.TsunamiBarriers, BCI.SeismicDampers];
  let materialIds = Object.keys(config.materials) as MaterialTypeId[];

  if (defenseComponentIds.includes(componentId)) {
    materialIds = materialIds.filter(id => id !== MaterialTypeId.Empty);
  }
  
  const gridClass = `grid gap-2 ${materialIds.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`;

  return (
    <div className={`mb-4 transition-opacity duration-300 ${disabled && currentMaterial === 'weak' ? 'opacity-50' : 'opacity-100'}`}>
      <h3 className="text-lg font-semibold text-amber-300 mb-2">{config.label}</h3>
      <div className={gridClass}>
        {materialIds.map((materialId) => {
          const material = config.materials[materialId];
          const isSelected = currentMaterial === materialId;
          return (
            <button
              key={materialId}
              onClick={() => onChange(materialId)}
              disabled={disabled}
              className={`group p-2 text-center rounded-md transition-all duration-200 flex flex-col justify-center items-center h-20
                ${isSelected ? 'bg-amber-500 text-slate-900 font-bold shadow-md shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-sm font-semibold leading-tight">{material.name}</span>
              <span className={`text-xs font-mono mt-1 transition-opacity duration-200 ${isSelected ? 'opacity-90' : 'opacity-0 group-hover:opacity-90'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(material.cost)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

type Tab = 'build' | 'defense' | 'simulate';

interface DamagedItem {
    componentId: BCI;
    levelIndex: number;
    health: number;
    repairCost: number;
    levelLabel: string;
}

interface DamagedGroup {
    componentId: BCI;
    label: string;
    items: DamagedItem[];
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  buildingState,
  componentHealth,
  onMaterialChange,
  onStartSimulation,
  onNextWave,
  onRepairComponent,
  onSaveScore,
  onReset,
  simulationState,
  scores,
  selectedLevel,
  onSelectLevel,
  floorArea,
  onFloorAreaChange,
  copiedFloor,
  onCopyFloor,
  onPasteFloor,
}) => {
  const isControlsDisabled = simulationState.phase !== 'idle';
  const [activeTab, setActiveTab] = useState<Tab>('build');
  const [currentDamageCategoryIndex, setCurrentDamageCategoryIndex] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copiar Andar');


  useEffect(() => {
    if (simulationState.phase !== 'results') {
        setIsScoreSaved(false);
        setPlayerName('');
    }
  }, [simulationState.phase]);

  const defenseComponents: BCI[] = [BCI.LightningRod, BCI.WindDampers, BCI.TsunamiBarriers, BCI.SeismicDampers];
  const floorComponents: BCI[] = [BCI.Floor, BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Glass];
  const roofComponents: BCI[] = [BCI.Roof];
  const foundationComponents: BCI[] = [BCI.Foundations];
  
  const levelIndex = selectedLevel === 'roof' || selectedLevel === 'foundation' ? 0 : selectedLevel;
  const componentsToShow = selectedLevel === 'roof' ? roofComponents : selectedLevel === 'foundation' ? foundationComponents : floorComponents;

  const tabs: {id: Tab, label: string}[] = [
      { id: 'build', label: 'Construção' },
      { id: 'defense', label: 'Defesas' },
      { id: 'simulate', label: 'Simulação' },
  ];
  
  const getLevelLabel = (componentId: BCI, levelIndex: number): string => {
      if (componentId === BCI.Roof) return 'Cobertura';
      if (componentId === BCI.Foundations) return 'Fundação';
      if (defenseComponents.includes(componentId)) return 'Sistema de Defesa';
      if (levelIndex === 0) return 'Andar Térreo';
      return `${levelIndex}º Andar`;
  };
  
  const groupedDamagedComponents = useMemo((): DamagedGroup[] => {
    const groups: Record<string, DamagedGroup> = {};
    for (const key in componentHealth) {
        const componentId = key as BCI;
        componentHealth[componentId].forEach((health, index) => {
            if (health < 100) {
                if (!groups[componentId]) {
                    groups[componentId] = {
                        componentId,
                        label: COMPONENT_CONFIG[componentId].label,
                        items: []
                    };
                }
                const materialId = buildingState[componentId][index];
                const material = COMPONENT_CONFIG[componentId].materials[materialId];
                const costPerPoint = material.cost / 200;
                
                const scaledComponents = [BCI.Roof, BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Floor, BCI.Glass, BCI.Foundations];
                const multiplier = scaledComponents.includes(componentId) ? floorArea : 1;
                const repairCost = (100 - health) * costPerPoint * multiplier;
                
                groups[componentId].items.push({
                    componentId,
                    levelIndex: index,
                    health,
                    repairCost,
                    levelLabel: getLevelLabel(componentId, index),
                });
            }
        });
    }
    // Sort items within each group by health
    Object.values(groups).forEach(group => {
      group.items.sort((a, b) => a.health - b.health);
    });
    return Object.values(groups);
  }, [componentHealth, buildingState, floorArea]);
  
  useEffect(() => {
    if (simulationState.phase.startsWith('repair_')) {
        setCurrentDamageCategoryIndex(0);
    }
  }, [simulationState.phase]);


  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
        onSaveScore(playerName.trim().toUpperCase());
        setIsScoreSaved(true);
    }
  };

  const handleCopy = () => {
    onCopyFloor();
    setCopyButtonText('Copiado!');
    setTimeout(() => setCopyButtonText('Copiar Andar'), 1500);
  };

  const isCopyDisabled = isControlsDisabled || typeof selectedLevel !== 'number';
  const isPasteDisabled = isControlsDisabled || typeof selectedLevel !== 'number' || !copiedFloor;


  // --- Dynamic Panels for Simulation Phases ---
  
  if (simulationState.phase.startsWith('wave_')) {
      const waveNumber = simulationState.phase.split('_')[1];
      const disasterName = simulationState.activeDisaster ? DISASTER_CONFIG[simulationState.activeDisaster].label : 'Desastre';
      return (
        <div className="h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold font-orbitron mb-4 text-amber-400">Simulação em Andamento</h2>
            <p className="text-xl text-yellow-300 animate-pulse">
                {disasterName} - Rodada {waveNumber} de 3...
            </p>
        </div>
      );
  }
  
  if (simulationState.phase === 'results') {
    return (
      <div className="h-full flex flex-col text-center">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold font-orbitron mb-2 text-amber-400">Resultado Final da Simulação</h2>
          <p className="text-lg text-slate-200 mb-4">{simulationState.resultMessage}</p>
        </div>

        {!isScoreSaved && (
            <form onSubmit={handleSaveScore} className="my-4 flex flex-col items-center gap-3 animate-[fade-in_0.5s_ease-out]">
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={10}
                    placeholder="Digite seu nome..."
                    className="w-full max-w-xs p-2 text-center text-xl font-bold font-orbitron bg-slate-800 border-2 border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                    type="submit"
                    className="w-full max-w-xs p-2 text-md font-semibold text-slate-900 bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
                >
                    Salvar Pontuação
                </button>
            </form>
        )}

        {isScoreSaved && scores.length > 0 && (
          <div className="flex-grow overflow-y-auto mb-4 pr-2 -mr-2 animate-[fade-in_0.5s_ease-out]">
            <h3 className="text-xl font-bold font-orbitron text-amber-300 mb-3 sticky top-0 bg-slate-900/70 backdrop-blur-sm py-2">Últimas Pontuações</h3>
            <div className="space-y-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              {scores.map((score) => {
                return (
                  <div
                    key={score.timestamp}
                    className="flex justify-between items-center bg-slate-900/80 p-2 rounded-md text-slate-200 text-sm"
                  >
                    <div className="flex items-center gap-3 font-bold">
                       <span className="font-orbitron text-amber-400 w-24 truncate">{score.playerName}</span>
                        <div className="flex items-center gap-1">
                          {score.disasters.map((disasterId, index) => {
                            const disasterInfo = DISASTER_CONFIG[disasterId];
                            const DisasterIcon = disasterInfo ? disasterInfo.Icon : () => null;
                            return <DisasterIcon key={index} className="text-xl text-slate-400" title={disasterInfo.label} />;
                          })}
                        </div>
                       <span className="text-white">{score.integrity.toFixed(0)}%</span>
                    </div>
                    <span className="font-mono text-slate-300">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(score.cost)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-shrink-0 mt-auto">
          <button
              onClick={onReset}
              className="w-full p-3 text-lg font-semibold text-slate-900 bg-amber-500 rounded-lg hover:bg-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
              Construir Novamente
          </button>
        </div>
      </div>
    );
  }

  if (simulationState.phase.startsWith('repair_')) {
    const waveNumber = parseInt(simulationState.phase.split('_')[1]);
    const currentCategory = groupedDamagedComponents[currentDamageCategoryIndex];

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold font-orbitron mb-2 text-white border-b border-slate-700 pb-2">
              Fase de Reparos
            </h2>
            <p className="text-md text-slate-300 mb-4">Após a rodada {waveNumber}, repare sua estrutura antes do próximo impacto.</p>
             
            {groupedDamagedComponents.length > 0 && currentCategory ? (
                 <>
                    <div className="flex items-center justify-between mb-3">
                        <button 
                            onClick={() => setCurrentDamageCategoryIndex(i => i - 1)}
                            disabled={currentDamageCategoryIndex === 0}
                            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600 transition-colors"
                        >
                            &larr;
                        </button>
                        <h3 className="text-lg font-bold text-amber-300 text-center">
                            {currentCategory.label}
                            <span className="text-sm font-normal text-slate-400 ml-2">({currentDamageCategoryIndex + 1}/{groupedDamagedComponents.length})</span>
                        </h3>
                        <button 
                            onClick={() => setCurrentDamageCategoryIndex(i => i + 1)}
                            disabled={currentDamageCategoryIndex >= groupedDamagedComponents.length - 1}
                            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 hover:bg-slate-600 transition-colors"
                        >
                            &rarr;
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                        {currentCategory.items.map(({ componentId, levelIndex, health, repairCost, levelLabel }) => (
                            <div key={`${componentId}-${levelIndex}`} className="bg-slate-800 p-3 rounded-lg flex items-center justify-between gap-2 animate-[fade-in_0.3s_ease-out]">
                                <div className="flex-grow">
                                    <p className="font-semibold text-white">{levelLabel}</p>
                                    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-1">
                                        <div className="bg-red-500 h-2.5 rounded-full" style={{width: `${health}%`}}></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRepairComponent(componentId, levelIndex)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex-shrink-0"
                                >
                                    Reparar <span className="font-mono text-xs">({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(repairCost)})</span>
                                </button>
                            </div>
                        ))}
                    </div>
                 </>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center text-emerald-400 py-8">Nenhum dano detectado. Estrutura 100% intacta!</div>
            )}

            <button
                onClick={onNextWave}
                className="w-full mt-4 p-3 text-lg font-semibold text-slate-900 bg-amber-500 rounded-lg hover:bg-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {waveNumber < 3 ? `Iniciar Rodada ${waveNumber + 1}` : 'Ver Resultado Final'}
            </button>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
  }

  // --- Default Idle View ---

  return (
    <div id="tutorial-control-panel" className="h-full flex flex-col">
        <h2 className="text-2xl font-bold font-orbitron mb-4 text-white border-b border-slate-700 pb-2 flex-shrink-0">
          Painel de Controle
        </h2>
        
        <div className="flex-shrink-0 mb-4 border-b border-slate-700">
            <div className="grid grid-cols-3 gap-2 pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={`tutorial-tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={isControlsDisabled}
                        className={`py-2 px-1 text-center font-bold rounded-md transition-colors duration-200 text-sm
                            ${activeTab === tab.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 hover:bg-slate-700'}
                            ${isControlsDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
            {activeTab === 'build' && (
                <>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-amber-300 mb-2">Selecionar Nível</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-9 gap-1">
                        {['F', 'T', ...Array.from({length: NUMBER_OF_FLOORS - 1}, (_, i) => `${i + 1}`), 'C'].map((level, index) => {
                            const levelId = index === 0 ? 'foundation' : index === 1 ? 0 : index < NUMBER_OF_FLOORS + 1 ? index - 1 : 'roof';
                            const isSelected = selectedLevel === levelId;
                            return (
                                <button 
                                    key={level}
                                    onClick={() => {
                                      if (selectedLevel !== levelId) {
                                        playClick();
                                        onSelectLevel(levelId);
                                      }
                                    }}
                                    disabled={isControlsDisabled}
                                    className={`py-2 px-1 text-center font-bold rounded-md transition-colors duration-200 text-sm
                                        ${isSelected ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 hover:bg-slate-700'}
                                        ${isControlsDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {level}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={handleCopy}
                    disabled={isCopyDisabled}
                    className={`py-2 text-center font-semibold rounded-md transition-colors duration-200 text-sm ${
                      isCopyDisabled
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {copyButtonText}
                  </button>
                  <button
                    onClick={onPasteFloor}
                    disabled={isPasteDisabled}
                    className={`py-2 text-center font-semibold rounded-md transition-colors duration-200 text-sm ${
                      isPasteDisabled
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    Colar Andar
                  </button>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-amber-300 mb-2">Área por Andar</h3>
                    <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-lg">
                        <input
                            type="range"
                            min={MIN_FLOOR_AREA}
                            max={MAX_FLOOR_AREA}
                            step="5"
                            value={floorArea}
                            onChange={(e) => onFloorAreaChange(parseInt(e.target.value, 10))}
                            disabled={isControlsDisabled}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="font-orbitron w-24 text-center text-white">{floorArea} m²</span>
                    </div>
                </div>
                
                <div className="border-t border-slate-700 pt-4">
                {componentsToShow.map((componentId) => {
                  return (
                    <MaterialSelector
                      key={`${componentId}-${selectedLevel}`}
                      componentId={componentId}
                      currentMaterial={buildingState[componentId][levelIndex]}
                      onChange={(materialId) => onMaterialChange(componentId, materialId, levelIndex)}
                      disabled={isControlsDisabled}
                    />
                  );
                })}
                </div>
              </>
            )}
            
            {activeTab === 'defense' && (
                <>
                {defenseComponents.map((componentId) => {
                  const isComponentDisabled = isControlsDisabled;
                  return (
                    <MaterialSelector
                      key={componentId}
                      componentId={componentId}
                      currentMaterial={buildingState[componentId][0]}
                      onChange={(materialId) => onMaterialChange(componentId, materialId, 0)}
                      disabled={isComponentDisabled}
                    />
                  );
                })}
              </>
            )}

            {activeTab === 'simulate' && (
              <div className="mt-2 flex flex-col items-center justify-center h-full">
                  <p className="text-center text-slate-300 mb-6">Teste sua estrutura contra 3 rodadas de Catclismos e Intensidades aleatórias.</p>
                  <button
                      onClick={onStartSimulation}
                      disabled={isControlsDisabled}
                      className="w-full max-w-xs p-4 text-lg font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:bg-slate-800 disabled:shadow-none disabled:transform-none disabled:cursor-wait disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400"
                    >
                      Iniciar Simulação
                  </button>
              </div>
            )}
      </div>
    </div>
  );
};

export default ControlPanel;