import { ModuleConfig, ModuleType } from './types';

export const GRID_SIZE = 10;
export const CELL_SIZE = 50; // Canvas pixel size per cell

export const INITIAL_RESOURCES = {
  power: 50,
  o2: 30,
  food: 20,
  rad: 0
};

export const MODULE_DEFINITIONS: Record<ModuleType, ModuleConfig> = {
  SOLAR: {
    type: 'SOLAR',
    name: 'Solar Array',
    cost: 10,
    powerGen: 15,
    powerCons: 0,
    o2Gen: 0,
    o2Cons: 0,
    foodGen: 0,
    foodCons: 0,
    radReduction: 0,
    color: '#f9d56e'
  },
  HAB: {
    type: 'HAB',
    name: 'Habitation Pod',
    cost: 15,
    powerGen: 0,
    powerCons: 5,
    o2Gen: 0,
    o2Cons: 4,
    foodGen: 0,
    foodCons: 3,
    radReduction: 0,
    color: '#4ecca3'
  },
  FARM: {
    type: 'FARM',
    name: 'Hydroponics',
    cost: 20,
    powerGen: 0,
    powerCons: 8,
    o2Gen: 6,
    o2Cons: 0,
    foodGen: 8,
    foodCons: 0,
    radReduction: 0,
    color: '#52de97'
  },
  SHIELD: {
    type: 'SHIELD',
    name: 'Rad Shield',
    cost: 25,
    powerGen: 0,
    powerCons: 10,
    o2Gen: 0,
    o2Cons: 0,
    foodGen: 0,
    foodCons: 0,
    radReduction: 15, // Neighbor bonus: shields adjacent modules from radiation
    color: '#4a90e2'
  }
};