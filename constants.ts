import type { ComponentConfig, Disaster, BuildingState, ComponentHealth } from './types';
import { BuildingComponentId, DisasterId, MaterialTypeId } from './types';
import { TsunamiIcon, HurricaneIcon, EarthquakeIcon, LightningIcon } from './components/Icons';

export const NUMBER_OF_FLOORS = 7;
export const MIN_FLOOR_AREA = 50;
export const MAX_FLOOR_AREA = 200;
export const DEFAULT_FLOOR_AREA = 100;

const SKELETON_STYLE = 'bg-transparent border border-dashed border-slate-500';

export const COMPONENT_CONFIG: Record<BuildingComponentId, ComponentConfig> = {
  [BuildingComponentId.Roof]: {
    label: 'Teto',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Telha PVC', resistance: 30, color: 'bg-slate-600', cost: 164 },
      [MaterialTypeId.Medium]: { name: 'Telha Cerâmica', resistance: 35, color: 'bg-red-600', cost: 200 },
      [MaterialTypeId.Strong]: { name: 'Laje Maciça', resistance: 70, color: 'bg-slate-300', cost: 350 },
    },
  },
  [BuildingComponentId.Walls]: {
    label: 'Paredes',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Drywall', resistance: 45, color: 'bg-neutral-200', cost: 150 },
      [MaterialTypeId.Medium]: { name: 'Bloco Cerâmico', resistance: 65, color: 'bg-slate-300', cost: 250 },
      [MaterialTypeId.Strong]: { name: 'Bloco de Concreto', resistance: 75, color: 'bg-stone-600', cost: 350 },
    },
  },
  [BuildingComponentId.Pillars]: {
    label: 'Pilares',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Concreto Pré-Moldado', resistance: 70, color: 'bg-slate-400', cost: 180 },
      [MaterialTypeId.Medium]: { name: 'Pilar de Madeira', resistance: 75, color: 'bg-amber-800', cost: 225 },
      [MaterialTypeId.Strong]: { name: 'Concreto Armado', resistance: 90, color: 'bg-stone-700', cost: 300 },
    },
  },
  [BuildingComponentId.Beams]: {
    label: 'Vigas',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Viga de Aço', resistance: 30, color: 'bg-stone-200', cost: 18 },
      [MaterialTypeId.Medium]: { name: 'Viga de Concreto Armado', resistance: 80, color: 'bg-stone-600', cost: 150 },
      [MaterialTypeId.Strong]: { name: 'Viga de Madeira Maciça', resistance: 90, color: 'bg-amber-700', cost: 849 },
    },
  },
  [BuildingComponentId.Floor]: {
    label: 'Piso',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Piso Cerâmica', resistance: 40, color: 'bg-amber-100', cost: 24 },
      [MaterialTypeId.Medium]: { name: 'Piso Vinílico', resistance: 50, color: 'bg-stone-100', cost: 75 },
      [MaterialTypeId.Strong]: { name: 'Porcelanato', resistance: 60, color: 'bg-slate-300', cost: 105 },
    },
  },
  [BuildingComponentId.Foundations]: {
    label: 'Fundações',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Sapata Corrida', resistance: 80, color: 'bg-stone-500', cost: 220 },
      [MaterialTypeId.Medium]: { name: 'Radier', resistance: 95, color: 'bg-stone-600', cost: 230 },
      [MaterialTypeId.Strong]: { name: 'Baldrame', resistance: 110, color: 'bg-stone-700', cost: 150 },
    },
  },
  [BuildingComponentId.Glass]: {
    label: 'Vidros',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Vão Aberto', resistance: 1, color: 'bg-black/10', cost: 0 },
      [MaterialTypeId.Medium]: { name: 'Vidro Comum', resistance: 50, color: 'bg-cyan-200/60', cost: 115 },
      [MaterialTypeId.Strong]: { name: 'Vidro Temperado', resistance: 60, color: 'bg-cyan-400/60', cost: 750 },
    },
  },
  [BuildingComponentId.LightningRod]: {
    label: 'Contra Tempestade de Raios (SPDA)',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Sem Proteção', resistance: 0, color: 'hidden', cost: 0 },
      [MaterialTypeId.Medium]: { name: 'SPDA Franklin', resistance: 25, color: 'bg-slate-400', cost: 30000 },
      [MaterialTypeId.Strong]: { name: 'Gaiola de Faraday', resistance: 45, color: 'bg-slate-300', cost: 55000 },
    },
  },
  [BuildingComponentId.WindDampers]: {
    label: 'Contra Furacão',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Sem Proteção', resistance: 0, color: 'hidden', cost: 0 },
      [MaterialTypeId.Medium]: { name: 'Vidros Laminados', resistance: 20, color: 'bg-cyan-800/80', cost: 200 },
      [MaterialTypeId.Strong]: { name: 'Dampers de Vento', resistance: 25, color: 'bg-slate-500', cost: 1150 },
    },
  },
  [BuildingComponentId.TsunamiBarriers]: {
    label: 'Contra Tsunami',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Sem Proteção', resistance: 0, color: 'hidden', cost: 0 },
      [MaterialTypeId.Medium]: { name: 'Parede Quebra-Maré', resistance: 35, color: 'bg-yellow-700', cost: 650 },
      [MaterialTypeId.Strong]: { name: 'Barreiras Anti-Inundação', resistance: 40, color: 'bg-stone-500', cost: 1250 },
    },
  },
  [BuildingComponentId.SeismicDampers]: {
    label: 'Contra Terremoto',
    materials: {
      [MaterialTypeId.Empty]: { name: 'Sem Estrutura', resistance: 0, color: SKELETON_STYLE, cost: 0 },
      [MaterialTypeId.Weak]: { name: 'Sem Proteção', resistance: 0, color: 'hidden', cost: 0 },
      [MaterialTypeId.Medium]: { name: 'Amortecedores Hidráulicos', resistance: 50, color: 'bg-red-700/80', cost: 900 },
      [MaterialTypeId.Strong]: { name: 'Isoladores Sísmicos', resistance: 55, color: 'bg-gray-700', cost: 1000 },
    },
  },
};

export const DISASTER_CONFIG: Record<DisasterId, Disaster> = {
  [DisasterId.LightningStorm]: {
    label: 'Tempestade de Raios',
    power: 120,
    Icon: LightningIcon,
  },
  [DisasterId.Hurricane]: {
    label: 'Furacão',
    power: 90,
    Icon: HurricaneIcon,
  },
  [DisasterId.Tsunami]: {
    label: 'Tsunami',
    power: 110,
    Icon: TsunamiIcon,
  },
  [DisasterId.Earthquake]: {
    label: 'Terremoto',
    power: 135,
    Icon: EarthquakeIcon,
  },
};

const createInitialState = <T>(floorValue: T, roofValue: T): Record<BuildingComponentId, T[]> => ({
  [BuildingComponentId.Roof]: [roofValue],
  [BuildingComponentId.Walls]: Array(NUMBER_OF_FLOORS).fill(floorValue),
  [BuildingComponentId.Pillars]: Array(NUMBER_OF_FLOORS).fill(floorValue),
  [BuildingComponentId.Beams]: Array(NUMBER_OF_FLOORS).fill(floorValue),
  [BuildingComponentId.Floor]: Array(NUMBER_OF_FLOORS).fill(floorValue),
  [BuildingComponentId.Glass]: Array(NUMBER_OF_FLOORS).fill(floorValue),
  [BuildingComponentId.Foundations]: [floorValue],
  [BuildingComponentId.LightningRod]: [floorValue],
  [BuildingComponentId.WindDampers]: [floorValue],
  [BuildingComponentId.TsunamiBarriers]: [floorValue],
  [BuildingComponentId.SeismicDampers]: [floorValue],
});

export const INITIAL_BUILDING_STATE: BuildingState = {
  ...createInitialState(MaterialTypeId.Empty, MaterialTypeId.Empty),
  [BuildingComponentId.LightningRod]: [MaterialTypeId.Weak],
  [BuildingComponentId.WindDampers]: [MaterialTypeId.Weak],
  [BuildingComponentId.TsunamiBarriers]: [MaterialTypeId.Weak],
  [BuildingComponentId.SeismicDampers]: [MaterialTypeId.Weak],
};
export const INITIAL_HEALTH_STATE: ComponentHealth = createInitialState(100, 100);
