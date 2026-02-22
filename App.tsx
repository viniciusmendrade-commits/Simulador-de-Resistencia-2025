import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
// FIX: Changed `import type` to `import` because enums are used as values and need to exist at runtime.
import { BuildingState, ComponentHealth, DisasterId, BuildingComponentId, MaterialTypeId, SimulationPhase, Score } from './types';
import { 
  INITIAL_BUILDING_STATE, 
  INITIAL_HEALTH_STATE, 
  COMPONENT_CONFIG, 
  DISASTER_CONFIG,
  DEFAULT_FLOOR_AREA
} from './constants';
import { DisasterId as DI, BuildingComponentId as BCI, MaterialTypeId as MT } from './types';
import Building from './components/Building';
import ControlPanel from './components/ControlPanel';
import { SoundOnIcon, SoundOffIcon, HomeIcon } from './components/Icons';
import { 
  toggleMute, 
  getIsMuted,
  playMaterialChange, 
  playSimulationStart, 
  playEarthquakeSound,
  playHurricaneSound,
  playTsunamiSound,
  playLightningSound,
  playResultSound,
  playReset,
  getSfxVolume,
  getMusicVolume,
  setSfxVolume,
  setMusicVolume,
  playMusic,
  stopMusic
} from './components/sounds';
import { Tutorial } from './components/Tutorial';
import SplashScreen from './components/SplashScreen';
import OptionsScreen from './components/OptionsScreen';
import ScoresScreen from './components/ScoresScreen';

const SCORES_STORAGE_KEY = 'sismotower_scores';

export const getScores = (): Score[] => {
    try {
        const scoresJson = localStorage.getItem(SCORES_STORAGE_KEY);
        return scoresJson ? JSON.parse(scoresJson) : [];
    } catch (error) {
        console.error("Failed to parse scores from localStorage", error);
        return [];
    }
};

const addScore = (newScore: Score) => {
    const scores = getScores();
    const updatedScores = [newScore, ...scores].slice(0, 5);
    try {
        localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(updatedScores));
    } catch (error) {
        console.error("Failed to save scores to localStorage", error);
    }
};


const calculateTotalCost = (buildingState: BuildingState, area: number): number => {
    let cost = 0;
    for (const key in buildingState) {
        const componentId = key as BuildingComponentId;
        const componentConfig = COMPONENT_CONFIG[componentId];
        
        buildingState[componentId].forEach(materialId => {
            const materialCost = componentConfig.materials[materialId].cost;

            const scaledComponents = [
                BCI.Roof, BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Floor, BCI.Glass, BCI.Foundations,
                BCI.WindDampers, BCI.TsunamiBarriers, BCI.SeismicDampers
            ];

            if (scaledComponents.includes(componentId)) {
                cost += materialCost * area;
            } else {
                cost += materialCost;
            }
        });
    }
    return cost;
};

// Fisher-Yates shuffle utility
// FIX: Changed from generic arrow function to a function declaration to avoid parser ambiguity with TSX.
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}


export default function App() {
  const [gameState, setGameState] = useState<'splash' | 'options' | 'playing' | 'scores'>('splash');
  const [buildingState, setBuildingState] = useState<BuildingState>(INITIAL_BUILDING_STATE);
  const [componentHealth, setComponentHealth] = useState<ComponentHealth>(INITIAL_HEALTH_STATE);
  const [simulationState, setSimulationState] = useState<{
    phase: SimulationPhase;
    activeDisaster: DisasterId | null;
    resultMessage: string | null;
  }>({
    phase: 'idle',
    activeDisaster: null,
    resultMessage: null,
  });
  const [simulationSequence, setSimulationSequence] = useState<{ disaster: DisasterId; intensity: number; }[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | 'roof' | 'foundation'>(0);
  const [floorArea, setFloorArea] = useState<number>(DEFAULT_FLOOR_AREA);
  const [totalCost, setTotalCost] = useState<number>(() => calculateTotalCost(INITIAL_BUILDING_STATE, DEFAULT_FLOOR_AREA));
  const [isMuted, setIsMuted] = useState(getIsMuted());
  const [sfxVolume, setSfxVolumeState] = useState(getSfxVolume());
  const [musicVolume, setMusicVolumeState] = useState(getMusicVolume());
  const [tutorialStep, setTutorialStep] = useState(0);
  const [scores, setScores] = useState<Score[]>([]);
  const [finalResult, setFinalResult] = useState<{ integrity: number, cost: number, disasters: DisasterId[] } | null>(null);
  const [copiedFloor, setCopiedFloor] = useState<Record<string, MaterialTypeId> | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const musicStarted = useRef(false);

  const tutorialActive = tutorialStep < 9; // There are 9 steps (0-8)

  const ensureMusicIsStarted = () => {
    if (!musicStarted.current) {
        playMusic();
        musicStarted.current = true;
    }
  };

  const handleStartGame = () => {
    ensureMusicIsStarted();
    setGameState('playing');
    playSimulationStart();
  };
  
  const handleShowOptions = () => {
    ensureMusicIsStarted();
    setGameState('options');
  };

  const handleShowScores = () => {
    ensureMusicIsStarted();
    setGameState('scores');
  };

  const handleBackToSplash = () => {
    setGameState('splash');
  };
  
  const handleBackToMenu = () => {
    handleReset();
    setGameState('splash');
  };

  const handleSfxVolumeChange = (volume: number) => {
    setSfxVolume(volume);
    setSfxVolumeState(volume);
  };

  const handleMusicVolumeChange = (volume: number) => {
    setMusicVolume(volume);
    setMusicVolumeState(volume);
  };

  const handleNextTutorialStep = () => {
    if (tutorialActive) {
      setTutorialStep(s => s + 1);
    }
  };

  const handleSkipTutorial = () => {
    setTutorialStep(99); // A number larger than total steps
  };

  const handleToggleMute = () => {
    setIsMuted(toggleMute());
  };

  const handleFloorAreaChange = (newArea: number) => {
    const newTotalCost = calculateTotalCost(buildingState, newArea);
    setFloorArea(newArea);
    setTotalCost(newTotalCost);
  };

  const handleMaterialChange = useCallback((component: BuildingComponentId, material: MaterialTypeId, levelIndex: number) => {
    if (simulationState.phase !== 'idle') return;

    const oldMaterialId = buildingState[component][levelIndex];
    if (oldMaterialId === material) return;

    playMaterialChange();

    const oldMaterialCost = COMPONENT_CONFIG[component].materials[oldMaterialId].cost;
    const newMaterialCost = COMPONENT_CONFIG[component].materials[material].cost;
    
    const scaledComponents = [
        BCI.Roof, BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Floor, BCI.Glass, BCI.Foundations,
        BCI.WindDampers, BCI.TsunamiBarriers, BCI.SeismicDampers
    ];
    const multiplier = scaledComponents.includes(component) ? floorArea : 1;
    const costDifference = (newMaterialCost - oldMaterialCost) * multiplier;

    setBuildingState(prevState => {
      const newState = { ...prevState };
      const newLevels = [...newState[component]];
      newLevels[levelIndex] = material;
      newState[component] = newLevels;
      return newState;
    });

    setTotalCost(prevCost => prevCost + costDifference);
  }, [simulationState.phase, buildingState, floorArea]);
  
  const runSimulationWave = useCallback((disasterId: DisasterId, intensityMultiplier: number) => {
    const disaster = DISASTER_CONFIG[disasterId];
    const disasterPower = disaster.power * intensityMultiplier;

    const newHealth: ComponentHealth = JSON.parse(JSON.stringify(componentHealth));

    setTimeout(() => {
      switch(disasterId) {
        case DI.Earthquake: playEarthquakeSound(); break;
        case DI.Tsunami: playTsunamiSound(); break;
        case DI.Hurricane: playHurricaneSound(); break;
        case DI.LightningStorm: playLightningSound(); break;
      }

      if (disasterId === DI.LightningStorm) {
        const spdaMaterial = buildingState[BCI.LightningRod][0];
        const spdaResistance = COMPONENT_CONFIG[BCI.LightningRod].materials[spdaMaterial].resistance;
        const effectivePower = Math.max(0, disasterPower - spdaResistance);

        if (spdaResistance < disasterPower) {
          const currentSpdaHealth = newHealth[BCI.LightningRod][0];
          newHealth[BCI.LightningRod][0] = Math.max(0, currentSpdaHealth - (disasterPower - spdaResistance) * 2);
          
          const currentRoofHealth = newHealth[BCI.Roof][0];
          newHealth[BCI.Roof][0] = Math.max(0, currentRoofHealth - (effectivePower * 1.2));

          // Affects top 2 floors
          for (let i = 0; i < 2; i++) {
            const floorIndex = newHealth[BCI.Beams].length - 1 - i;
            if (floorIndex < 0) break;

            const damageMultiplier = 1 / (i * 1.5 + 1);
            const baseDamage = effectivePower * damageMultiplier;
            const finalDamage = baseDamage;

            newHealth[BCI.Beams][floorIndex] = Math.max(0, newHealth[BCI.Beams][floorIndex] - finalDamage / 1.25);
            newHealth[BCI.Walls][floorIndex] = Math.max(0, newHealth[BCI.Walls][floorIndex] - finalDamage / 1.5);
            newHealth[BCI.Glass][floorIndex] = Math.max(0, newHealth[BCI.Glass][floorIndex] - finalDamage / 2);
            newHealth[BCI.Pillars][floorIndex] = Math.max(0, newHealth[BCI.Pillars][floorIndex] - finalDamage / 1.2);
            newHealth[BCI.Floor][floorIndex] = Math.max(0, newHealth[BCI.Floor][floorIndex] - finalDamage / 1.8);
          }
        }
      } else {
        let defenseResistance = 0;
        switch(disasterId) {
            case DI.Hurricane:
                defenseResistance = COMPONENT_CONFIG[BCI.WindDampers].materials[buildingState[BCI.WindDampers][0]].resistance;
                break;
            case DI.Tsunami:
                defenseResistance = COMPONENT_CONFIG[BCI.TsunamiBarriers].materials[buildingState[BCI.TsunamiBarriers][0]].resistance;
                break;
            case DI.Earthquake:
                defenseResistance = COMPONENT_CONFIG[BCI.SeismicDampers].materials[buildingState[BCI.SeismicDampers][0]].resistance;
                break;
        }
        const effectivePower = Math.max(0, disasterPower - defenseResistance);

        const defenseComponents = [BCI.LightningRod, BCI.WindDampers, BCI.TsunamiBarriers, BCI.SeismicDampers];

        for (const key in buildingState) {
          const componentId = key as BuildingComponentId;
          if (defenseComponents.includes(componentId)) continue;
          
          buildingState[componentId].forEach((materialId, index) => {
              const resistance = COMPONENT_CONFIG[componentId].materials[materialId].resistance;
              let damage = Math.max(0, effectivePower - resistance);
              
              switch(disasterId) {
                case DI.Tsunami: {
                    if (componentId === BCI.Foundations) {
                        damage *= 2.0; // High impact on foundations
                    } else if (index < 3) { // First 3 floors (0, 1, 2)
                        damage *= 1.8;
                    } else {
                        damage *= 0.3; // Low impact on upper floors
                    }
                    break;
                }
                case DI.Earthquake: {
                    const numberOfFloors = buildingState[componentId].length;
                    if (numberOfFloors > 1) { // Apply only to multi-floor components
                        const middleFloor = Math.floor((numberOfFloors - 1) / 2);
                        const distanceFromMiddle = Math.abs(index - middleFloor);
                        // Multiplier is higher in the middle, lower at the ends
                        const damageMultiplier = 1.5 - (distanceFromMiddle * 0.3); 
                        damage *= damageMultiplier;
                    }
                    if (componentId === BCI.Foundations) {
                        damage *= 1.4; // Still significant impact on foundations
                    }
                    break;
                }
                case DI.Hurricane: {
                    const numberOfFloors = buildingState[componentId].length;
                    if (componentId === BCI.Roof) {
                        damage *= 1.6; // High impact on the roof
                    } else if (numberOfFloors > 1) { // Apply to multi-floor components
                        // Multiplier increases with height
                        const damageMultiplier = 0.5 + (index / (numberOfFloors - 1));
                        damage *= damageMultiplier;
                    }
                    break;
                }
              }
              
              const currentHealth = newHealth[componentId][index];
              newHealth[componentId][index] = Math.max(0, currentHealth - damage);
          });
        }
      }

      setComponentHealth(newHealth);
      
      const allHealthValues: number[] = Object.values(newHealth).flat();
      const averageHealth = allHealthValues.length > 0 ? allHealthValues.reduce((a, b) => a + b, 0) / allHealthValues.length : 100;
      
      const waveNumber = parseInt(simulationState.phase.split('_')[1]);
      const isLastWave = waveNumber >= 3;
      const isBuildingCollapsed = averageHealth < 20;

      // Check for collapse or end of simulation
      if (isBuildingCollapsed || isLastWave) {
        playResultSound(averageHealth); // Play sound for both collapse and final result

        if (isBuildingCollapsed) {
          setIsCollapsed(true); // Trigger animation
          
          // Delay results screen to show animation
          setTimeout(() => {
            const finalHealthDisplay = averageHealth.toFixed(0);
            const resultMessage = `Colapso total! A estrutura não resistiu ao desastre. (Integridade: ${finalHealthDisplay}%)`;
            const finalDisasters = simulationSequence.map(wave => wave.disaster);
            setFinalResult({ integrity: averageHealth, cost: totalCost, disasters: finalDisasters });
            setScores(getScores());
            setSimulationState(prevState => ({
              ...prevState,
              phase: 'results',
              resultMessage,
            }));
          }, 2500);

        } else { // Last wave but not collapsed
          const finalHealthDisplay = averageHealth.toFixed(0);
          let resultMessage = '';
          if (averageHealth > 75) {
            resultMessage = `O edifício resistiu bravamente com danos mínimos! (Integridade: ${finalHealthDisplay}%)`;
          } else if (averageHealth > 50) {
            resultMessage = `O edifício sofreu danos significativos, mas permaneceu de pé. (Integridade: ${finalHealthDisplay}%)`;
          } else {
            resultMessage = `A estrutura foi severamente comprometida! Risco de colapso. (Integridade: ${finalHealthDisplay}%)`;
          }
          
          const finalDisasters = simulationSequence.map(wave => wave.disaster);
          setFinalResult({ integrity: averageHealth, cost: totalCost, disasters: finalDisasters });
          setScores(getScores());
          setSimulationState(prevState => ({
            ...prevState,
            phase: 'results',
            resultMessage,
          }));
        }

      } else {
        // Not collapsed and not the last wave, go to repair phase
        setSimulationState(prevState => ({
          ...prevState,
          phase: `repair_${waveNumber}` as SimulationPhase,
        }));
      }
    }, 2000);
  }, [buildingState, componentHealth, totalCost, simulationState.phase, simulationSequence]);

  useEffect(() => {
    const { phase } = simulationState;
    if (phase.startsWith('wave_') && simulationSequence.length > 0) {
      const waveNumber = parseInt(phase.split('_')[1]);
      const waveInfo = simulationSequence[waveNumber - 1];
      if (waveInfo) {
        runSimulationWave(waveInfo.disaster, waveInfo.intensity);
      }
    }
  }, [simulationState.phase, simulationSequence, runSimulationWave]);

  const handleStartSimulation = useCallback(() => {
    const structuralComponents = [BCI.Roof, BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Floor, BCI.Foundations];
    const isStructureEmpty = structuralComponents.every(componentId => 
        buildingState[componentId].every(materialId => materialId === MT.Empty)
    );

    if (isStructureEmpty) {
        alert("Você não pode iniciar a simulação com uma estrutura vazia! Adicione materiais ao seu edifício primeiro.");
        return;
    }
      
    playSimulationStart();
    const allDisasters = Object.keys(DISASTER_CONFIG) as DisasterId[];
    const shuffledDisasters = shuffleArray(allDisasters);
    const disastersForRun = shuffledDisasters.slice(0, 3);
    
    const waveIntensities = [0.6, 0.8, 1.0]; // Low, Medium, High
    const shuffledIntensities = shuffleArray(waveIntensities);

    const sequence = disastersForRun.map((disaster, index) => ({
      disaster,
      intensity: shuffledIntensities[index]
    }));
    
    setSimulationSequence(sequence);
    setSimulationState({
        phase: 'wave_1',
        activeDisaster: sequence[0].disaster,
        resultMessage: null,
    });
  }, [buildingState]);
  
  const handleNextWave = useCallback(() => {
    playSimulationStart();
    const currentWave = parseInt(simulationState.phase.split('_')[1]);
    if (currentWave < 3 && simulationSequence.length > 0) {
        const nextWave = currentWave + 1;
        const nextWaveInfo = simulationSequence[nextWave - 1];
        setSimulationState(prevState => ({
            ...prevState,
            phase: `wave_${nextWave}` as SimulationPhase,
            activeDisaster: nextWaveInfo.disaster,
        }));
    }
  }, [simulationState.phase, simulationSequence]);
  
  const handleRepairComponent = useCallback((componentId: BuildingComponentId, levelIndex: number) => {
    const materialId = buildingState[componentId][levelIndex];
    const material = COMPONENT_CONFIG[componentId].materials[materialId];
    const currentHealth = componentHealth[componentId][levelIndex];
    if (currentHealth >= 100) return;

    const healthToRestore = 100 - currentHealth;
    // Cost to fully repair (100 points) is 50% of the material's original cost
    const costPerPoint = material.cost / 200;
    
    const scaledComponents = [
        BCI.Roof, BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Floor, BCI.Glass, BCI.Foundations,
        BCI.WindDampers, BCI.TsunamiBarriers, BCI.SeismicDampers
    ];
    const multiplier = scaledComponents.includes(componentId) ? floorArea : 1;
    const repairCost = healthToRestore * costPerPoint * multiplier;

    setTotalCost(prev => prev + repairCost);
    setComponentHealth(prevHealth => {
        const newHealth = JSON.parse(JSON.stringify(prevHealth));
        newHealth[componentId][levelIndex] = 100;
        return newHealth;
    });
    playMaterialChange();
  }, [buildingState, componentHealth, floorArea]);

  const handleSaveScore = (playerName: string) => {
    if (finalResult) {
      const newScore: Score = {
        ...finalResult,
        playerName,
        timestamp: Date.now(),
      };
      addScore(newScore);
      setScores(getScores());
    }
  };

  const handleCopyFloor = useCallback(() => {
    if (typeof selectedLevel !== 'number' || simulationState.phase !== 'idle') return;

    const floorComponents = [BCI.Walls, BCI.Pillars, BCI.Beams, BCI.Floor, BCI.Glass];
    const floorData: Record<string, MaterialTypeId> = {};

    floorComponents.forEach(componentId => {
      floorData[componentId] = buildingState[componentId][selectedLevel];
    });

    setCopiedFloor(floorData);
  }, [selectedLevel, buildingState, simulationState.phase]);

  const handlePasteFloor = useCallback(() => {
    if (!copiedFloor || typeof selectedLevel !== 'number' || simulationState.phase !== 'idle') return;

    playMaterialChange();

    let costDifference = 0;
    const newBuildingState = JSON.parse(JSON.stringify(buildingState));

    for (const componentIdStr in copiedFloor) {
      const componentId = componentIdStr as BCI;
      const newMaterialId = copiedFloor[componentId];
      const oldMaterialId = buildingState[componentId][selectedLevel];

      if (newMaterialId === oldMaterialId) continue;

      const oldMaterialCost = COMPONENT_CONFIG[componentId].materials[oldMaterialId].cost;
      const newMaterialCost = COMPONENT_CONFIG[componentId].materials[newMaterialId].cost;
      costDifference += (newMaterialCost - oldMaterialCost) * floorArea;

      newBuildingState[componentId][selectedLevel] = newMaterialId;
    }

    setBuildingState(newBuildingState);
    setTotalCost(prevCost => prevCost + costDifference);
  }, [copiedFloor, selectedLevel, simulationState.phase, buildingState, floorArea]);


  const handleReset = useCallback(() => {
    playReset();
    stopMusic();
    musicStarted.current = false;
    setBuildingState(INITIAL_BUILDING_STATE);
    setComponentHealth(INITIAL_HEALTH_STATE);
    setSimulationState({
        phase: 'idle',
        activeDisaster: null,
        resultMessage: null,
    });
    setSimulationSequence([]);
    setSelectedLevel(0);
    setFloorArea(DEFAULT_FLOOR_AREA);
    setTotalCost(calculateTotalCost(INITIAL_BUILDING_STATE, DEFAULT_FLOOR_AREA));
    setScores([]);
    setFinalResult(null);
    setCopiedFloor(null);
    setIsCollapsed(false);
  }, []);

  const overallHealth = useMemo(() => {
    const allHealthValues: number[] = [].concat(...Object.values(componentHealth));
    if (allHealthValues.length === 0) return 100;
    return allHealthValues.reduce((a: number, b: number) => a + b, 0) / allHealthValues.length;
  }, [componentHealth]);

  const getHealthBarColor = (health: number) => {
    if (health > 70) {
      return 'bg-gradient-to-r from-emerald-500 to-green-500';
    }
    if (health > 30) {
      return 'bg-gradient-to-r from-yellow-500 to-amber-500';
    }
    return 'bg-gradient-to-r from-red-600 to-rose-600';
  };

  if (gameState === 'splash') {
    return <SplashScreen onStart={handleStartGame} onShowOptions={handleShowOptions} onShowScores={handleShowScores} />;
  }
  
  if (gameState === 'options') {
    return <OptionsScreen 
      sfxVolume={sfxVolume}
      musicVolume={musicVolume}
      onSfxVolumeChange={handleSfxVolumeChange}
      onMusicVolumeChange={handleMusicVolumeChange}
      onBack={handleBackToSplash}
    />
  }

  if (gameState === 'scores') {
    return <ScoresScreen onBack={handleBackToSplash} />;
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {tutorialActive && <Tutorial step={tutorialStep} onNext={handleNextTutorialStep} onSkip={handleSkipTutorial} />}
      
      <header className="w-full max-w-7xl text-center mb-8 relative">
        <h1 className="text-4xl md:text-5xl font-bold font-orbitron text-amber-400 tracking-wider">
          Sismotower: Cataclismo
        </h1>
        <p className="text-slate-300 mt-2 text-lg">
          Construa seu edifício, andar por andar, e teste sua resistência contra catástrofes.
        </p>
        <button 
          onClick={handleBackToMenu}
          className="absolute top-0 left-0 w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-all duration-200 transform hover:scale-110 shadow-lg"
          aria-label="Voltar ao menu principal"
          title="Voltar ao menu principal"
        >
          <HomeIcon className="w-6 h-6" />
        </button>
         <button 
          onClick={handleToggleMute}
          className="absolute top-0 right-0 w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-all duration-200 transform hover:scale-110 shadow-lg"
          aria-label={isMuted ? "Ativar som" : "Desativar som"}
          title={isMuted ? "Ativar som" : "Desativar som"}
        >
          {isMuted ? <SoundOffIcon className="w-6 h-6" /> : <SoundOnIcon className="w-6 h-6" />}
        </button>
      </header>
      
      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 flex-shrink-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-800 p-4">
           <div id="tutorial-health-bar" className="w-full mb-4 px-2">
                <div className="flex justify-between items-baseline px-1 mb-1">
                    <p className="text-base font-semibold text-slate-300 tracking-wide">Resistencia Estrutural</p>
                    <p className="text-lg font-bold font-orbitron text-white">{overallHealth.toFixed(0)}%</p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 border border-slate-700">
                    <div 
                        className={`${getHealthBarColor(overallHealth)} h-full rounded-full transition-all duration-500`} 
                        style={{ width: `${overallHealth}%`}}
                    ></div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Custo Total</h3>
                        <p className="text-xl font-bold font-orbitron text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
                        </p>
                    </div>
                </div>
            </div>
          <Building 
            buildingState={buildingState}
            componentHealth={componentHealth}
            isSimulating={simulationState.phase.startsWith('wave_')}
            activeDisaster={simulationState.activeDisaster}
            floorArea={floorArea}
            isCollapsed={isCollapsed}
          />
        </div>

        <div className="lg:w-1/3 flex-shrink-0 bg-slate-900/70 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-800 p-6">
          <ControlPanel
            buildingState={buildingState}
            componentHealth={componentHealth}
            onMaterialChange={handleMaterialChange}
            onStartSimulation={handleStartSimulation}
            onNextWave={handleNextWave}
            onRepairComponent={handleRepairComponent}
            onSaveScore={handleSaveScore}
            onReset={handleReset}
            simulationState={simulationState}
            scores={scores}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            floorArea={floorArea}
            onFloorAreaChange={handleFloorAreaChange}
            copiedFloor={copiedFloor}
            onCopyFloor={handleCopyFloor}
            onPasteFloor={handlePasteFloor}
          />
        </div>
      </main>
    </div>
  );
}
