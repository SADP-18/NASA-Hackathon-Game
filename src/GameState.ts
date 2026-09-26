import { BehaviorSubject, Subject } from 'rxjs';
import { GameStateData, ModuleType, GridCell, ResourceDeltas } from './types';
import { GRID_SIZE, INITIAL_RESOURCES, MODULE_DEFINITIONS } from './config';

function createInitialGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    grid[x] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[x][y] = { x, y, module: null };
    }
  }
  // Place initial Central Command station
  grid[4][4].module = {
    type: 'HAB',
    name: 'Command Hub',
    cost: 0,
    powerGen: 10,
    powerCons: 0,
    o2Gen: 10,
    o2Cons: 0,
    foodGen: 5,
    foodCons: 0,
    radReduction: 0,
    color: '#00adb5'
  };
  return grid;
}

const initialState: GameStateData = {
  turn: 1,
  resources: { ...INITIAL_RESOURCES },
  deltas: { powerDelta: 0, o2Delta: 0, foodDelta: 0, radDelta: 0 },
  selectedModule: null,
  grid: createInitialGrid(),
  logs: ['Outpost initialized. Command Hub operational.'],
  isGameOver: false,
  gameOverReason: ''
};

export class GameStore {
  private state$ = new BehaviorSubject<GameStateData>(initialState);

  // Actions
  public endTurn$ = new Subject<void>();
  public restart$ = new Subject<void>();

  constructor() {
    this.recalculateDeltas();

    this.endTurn$.subscribe(() => this.processTurn());
    this.restart$.subscribe(() => this.resetGame());
  }

  public get state() {
    return this.state$.asObservable();
  }

  public get snapshot(): GameStateData {
    return this.state$.getValue();
  }

  public selectModule(type: ModuleType | null) {
    const current = this.snapshot;
    this.state$.next({
      ...current,
      selectedModule: current.selectedModule === type ? null : type
    });
  }

  public placeModule(x: number, y: number): boolean {
    const state = this.snapshot;
    const { selectedModule, grid, resources } = state;

    if (!selectedModule || state.isGameOver) return false;

    const cell = grid[x][y];
    if (cell.module !== null) {
      this.addLog(`Cell (${x}, ${y}) is already occupied!`);
      return false;
    }

    const config = MODULE_DEFINITIONS[selectedModule];
    if (resources.power < config.cost) {
      this.addLog(`Not enough Power to build ${config.name}! (Needs ${config.cost})`);
      return false;
    }

    // Deduct cost and place module
    const newResources = { ...resources, power: resources.power - config.cost };
    const newGrid = grid.map(col => col.map(c => ({ ...c })));
    newGrid[x][y].module = config;

    this.state$.next({
      ...state,
      resources: newResources,
      grid: newGrid,
      logs: [`Built ${config.name} at (${x}, ${y}).`, ...state.logs]
    });

    this.recalculateDeltas();
    return true;
  }

  private recalculateDeltas() {
    const state = this.snapshot;
    let powerGen = 0, powerCons = 0;
    let o2Gen = 0, o2Cons = 0;
    let foodGen = 0, foodCons = 0;
    let radGen = 2; // Passive ambient radiation gain per turn

    // Calculate base output
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const mod = state.grid[x][y].module;
        if (mod) {
          powerGen += mod.powerGen;
          powerCons += mod.powerCons;
          o2Gen += mod.o2Gen;
          o2Cons += mod.o2Cons;
          foodGen += mod.foodGen;
          foodCons += mod.foodCons;

          // Apply Neighbor Bonuses (Shields reduce rad relative to placement)
          if (mod.type === 'SHIELD') {
            radGen -= 5; // Direct reduction
          }
        }
      }
    }

    const deltas: ResourceDeltas = {
      powerDelta: powerGen - powerCons,
      o2Delta: o2Gen - o2Cons,
      foodDelta: foodGen - foodCons,
      radDelta: Math.max(-10, radGen)
    };

    this.state$.next({ ...this.snapshot, deltas });
  }

  private processTurn() {
    const state = this.snapshot;
    if (state.isGameOver) return;

    this.recalculateDeltas();
    const { deltas, resources, turn } = this.snapshot;

    // Apply deltas
    const newResources = {
      power: Math.max(0, resources.power + deltas.powerDelta),
      o2: Math.max(0, resources.o2 + deltas.o2Delta),
      food: Math.max(0, resources.food + deltas.foodDelta),
      rad: Math.max(0, resources.rad + deltas.radDelta)
    };

    const newLogs = [`--- Turn ${turn + 1} ---`, ...state.logs];

    // Trigger Random Event (15% chance)
    if (Math.random() < 0.15) {
      const eventDmg = Math.floor(Math.random() * 10) + 5;
      newResources.o2 = Math.max(0, newResources.o2 - eventDmg);
      newLogs.unshift(`ALERT: Solar Flare hit the station! Lost ${eventDmg} O2.`);
    }

    // Check Failure Conditions
    let gameOver = false;
    let reason = '';

    if (newResources.o2 <= 0) {
      gameOver = true;
      reason = 'Oxygen depleted! Life support failure.';
    } else if (newResources.food <= 0) {
      gameOver = true;
      reason = 'Food supplies exhausted! Crew starved.';
    } else if (newResources.rad >= 100) {
      gameOver = true;
      reason = 'Critical Radiation levels reached!';
    }

    this.state$.next({
      ...state,
      turn: turn + 1,
      resources: newResources,
      logs: newLogs,
      isGameOver: gameOver,
      gameOverReason: reason
    });

    if (!gameOver) {
      this.recalculateDeltas();
    }
  }

  private addLog(msg: string) {
    const state = this.snapshot;
    this.state$.next({ ...state, logs: [msg, ...state.logs] });
  }

  private resetGame() {
    this.state$.next({
      ...initialState,
      resources: { ...INITIAL_RESOURCES },
      grid: createInitialGrid(),
      logs: ['Outpost re-initialized. Command Hub operational.']
    });
    this.recalculateDeltas();
  }
}