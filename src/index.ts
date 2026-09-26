import { GameStore } from './GameState';
import { GridMap } from './GridMap';
import { MODULE_DEFINITIONS } from './config';
import { ModuleType } from './types';

// DOM Elements
const canvas = document.getElementById('gridCanvas') as HTMLCanvasElement;
const moduleList = document.getElementById('moduleList')!;
const endTurnBtn = document.getElementById('endTurnBtn')!;
const restartBtn = document.getElementById('restartBtn')!;
const gameOverOverlay = document.getElementById('gameOver')!;
const gameOverReason = document.getElementById('gameOverReason')!;
const logContainer = document.getElementById('log')!;

// Instantiate Core Architecture
const store = new GameStore();
const gridMap = new GridMap(canvas);

// Initialize Module Selection UI
Object.keys(MODULE_DEFINITIONS).forEach(key => {
  const mod = MODULE_DEFINITIONS[key as ModuleType];
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.id = `mod-btn-${mod.type}`;
  btn.innerText = `${mod.name} (Cost: ${mod.cost} Pwr)`;
  btn.onclick = () => store.selectModule(mod.type);
  moduleList.appendChild(btn);
});

// Bind Inputs
endTurnBtn.onclick = () => store.endTurn$.next();
restartBtn.onclick = () => store.restart$.next();

gridMap.cellClick$.subscribe(({ x, y }) => {
  store.placeModule(x, y);
});

// Render Loop & Subscription to RxJS State Stream
store.state.subscribe(state => {
  // Render Canvas
  gridMap.render(state);

  // Render Resource Indicators
  updateStat('power', state.resources.power, state.deltas.powerDelta);
  updateStat('o2', state.resources.o2, state.deltas.o2Delta);
  updateStat('food', state.resources.food, state.deltas.foodDelta);
  updateStat('rad', state.resources.rad, state.deltas.radDelta);

  // Update UI Button states
  Object.keys(MODULE_DEFINITIONS).forEach(key => {
    const btn = document.getElementById(`mod-btn-${key}`);
    if (btn) {
      if (state.selectedModule === key) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  // Render Logs
  logContainer.innerHTML = state.logs
    .map(log => `<div class="log-entry">${log}</div>`)
    .join('');

  // Handle Game Over
  if (state.isGameOver) {
    gameOverReason.innerText = state.gameOverReason;
    gameOverOverlay.classList.remove('hidden');
  } else {
    gameOverOverlay.classList.add('hidden');
  }
});

function updateStat(id: string, val: number, delta: number) {
  const valEl = document.getElementById(`stat-${id}`);
  const deltaEl = document.getElementById(`delta-${id}`);
  if (valEl && deltaEl) {
    valEl.innerText = val.toString();
    const sign = delta >= 0 ? '+' : '';
    deltaEl.innerText = `(${sign}${delta}/turn)`;
    deltaEl.className = `stat-delta ${delta >= 0 ? 'positive' : 'negative'}`;
  }
}