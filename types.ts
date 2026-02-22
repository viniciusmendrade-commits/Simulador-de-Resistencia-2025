import type React from 'react';

export enum BuildingComponentId {
  Beams = 'beams',
  Roof = 'roof',
  Floor = 'floor',
  Walls = 'walls',
  Glass = 'glass',
  Pillars = 'pillars',
  Foundations = 'foundations',
  LightningRod = 'lightningRod',
  WindDampers = 'windDampers',
  TsunamiBarriers = 'tsunamiBarriers',
  SeismicDampers = 'seismicDampers',
}

export enum MaterialTypeId {
  Empty = 'empty',
  Weak = 'weak',
  Medium = 'medium',
  Strong = 'strong',
}

export enum DisasterId {
  Tsunami = 'tsunami',
  Hurricane = 'hurricane',
  Earthquake = 'earthquake',
  LightningStorm = 'lightningStorm',
}

export type SimulationPhase = 'idle' | 'wave_1' | 'repair_1' | 'wave_2' | 'repair_2' | 'wave_3' | 'results';

export interface Material {
  name: string;
  resistance: number;
  color: string;
  cost: number;
}

export interface ComponentConfig {
  label: string;
  materials: Record<MaterialTypeId, Material>;
}

export interface Disaster {
  label: string;
  power: number;
  // FIX: Added optional `title` property to the Icon component props to allow passing a title for tooltips.
  Icon: React.FC<{ className?: string; title?: string }>;
}

export type BuildingState = Record<BuildingComponentId, MaterialTypeId[]>;
export type ComponentHealth = Record<BuildingComponentId, number[]>;

export interface Score {
  playerName: string;
  integrity: number;
  cost: number;
  disasters: DisasterId[];
  timestamp: number;
}