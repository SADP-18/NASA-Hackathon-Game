export type ModuleType = 'SOLAR' | 'HAB' | 'FARM' | 'SHIELD';

export interface ModuleConfig {
  type: ModuleType;
  name: string;
  cost: number; // Power cost to build
  powerGen: number;
  powerCons: number;
  o2Gen: number;
  o2Cons: number;
  foodGen: number;
  foodCons: number;
  radReduction: number;
  color: string;
}

export interface GridCell {
  x: number;
  y: number;
  module: ModuleConfig | null;
}

export interface Resources {
  power: number;
  o2: number;
  food: number;
  rad: number;
}

export interface ResourceDeltas {
  powerDelta: number;
  o2Delta: number;
  foodDelta: number;
  radDelta: number;
}

export interface GameStateData {
  turn: number;
  resources: Resources;
  deltas: ResourceDeltas;
  selectedModule: ModuleType | null;
  grid: GridCell[][];
  logs: string[];
  isGameOver: boolean;
  gameOverReason: string;
}