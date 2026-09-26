import "../style.css";
import {
    Observable,
    filter,
    fromEvent,
    interval,
    map,
    merge,
    scan,
    startWith,
    switchMap,
    take,
} from "rxjs";

/* ========== CONSTANTS ========== */
const GRID_SIZE = 10;
const CELL_SIZE = 50;

const MODULES = {
    SOLAR:  { name: "Solar Array",  cost: 10, power: +15, o2: 0,  food: 0,  rad: 0  },
    HAB:    { name: "Habitation",   cost: 15, power: -5,  o2: -4, food: -3, rad: 0  },
    FARM:   { name: "Hydroponics",  cost: 20, power: -8,  o2: +6, food: +8, rad: 0  },
    SHIELD: { name: "Rad Shield",   cost: 25, power: -10, o2: 0,  food: 0,  rad: -5 },
} as const;

type ModuleType = keyof typeof MODULES;

/* ========== TYPES ========== */
type Cell = Readonly<{
    module: ModuleType | null;
}>;

type State = Readonly<{
    turn: number;
    power: number;
    o2: number;
    food: number;
    rad: number;
    selected: ModuleType | null;
    grid: ReadonlyArray<ReadonlyArray<Cell>>;
    logs: ReadonlyArray<string>;
    gameOver: boolean;
}>;

/* ========== INITIAL STATE ========== */
const emptyCell: Cell = { module: null };

const createGrid = (): Cell[][] =>
    Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => emptyCell),
    );

const createInitialGrid = (): Cell[][] => {
    const grid = createGrid();
    grid[4][4] = { module: "HAB" }; // Command Hub
    return grid;
};

const initialState: State = {
    turn: 1,
    power: 50,
    o2: 30,
    food: 20,
    rad: 0,
    selected: null,
    grid: createInitialGrid(),
    logs: ["Outpost initialized."],
    gameOver: false,
};

/* ========== PURE REDUCERS ========== */
type Reducer = (s: State) => State;

const selectModule = (type: ModuleType): Reducer => s => ({
    ...s,
    selected: s.selected === type ? null : type,
});

const placeModule = (x: number, y: number): Reducer => s => {
    if (!s.selected || s.gameOver) return s;

    const cfg = MODULES[s.selected];
    if (s.grid[x][y].module !== null) return s;
    if (s.power < cfg.cost) return s;

    const newGrid = s.grid.map((col, cx) =>
        col.map((cell, cy) => (cx === x && cy === y ? { module: s.selected } : cell)),
    );

    return {
        ...s,
        power: s.power - cfg.cost,
        grid: newGrid,
        logs: [`Built ${cfg.name} at (${x},${y}).`, ...s.logs],
    };
};

const computeDeltas = (s: State) => {
    let dPower = 0, dO2 = 0, dFood = 0, dRad = 2;

    s.grid.forEach(col =>
        col.forEach(cell => {
            if (!cell.module) return;
            const cfg = MODULES[cell.module];
            dPower += cfg.power;
            dO2 += cfg.o2;
            dFood += cfg.food;
            dRad += cfg.rad;
        }),
    );

    return { dPower, dO2, dFood, dRad: Math.max(-10, dRad) };
};

const endTurn: Reducer = s => {
    if (s.gameOver) return s;

    const { dPower, dO2, dFood, dRad } = computeDeltas(s);

    let power = Math.max(0, s.power + dPower);
    let o2 = Math.max(0, s.o2 + dO2);
    let food = Math.max(0, s.food + dFood);
    let rad = Math.max(0, s.rad + dRad);

    const newLogs = [`--- Turn ${s.turn + 1} ---`, ...s.logs];

    // Random solar flare event
    if (Math.random() < 0.15) {
        const dmg = Math.floor(Math.random() * 10) + 5;
        o2 = Math.max(0, o2 - dmg);
        newLogs.unshift(`ALERT: Solar flare! -${dmg} O2.`);
    }

    const gameOver = o2 <= 0 || food <= 0 || rad >= 100;
    const reason = o2 <= 0 ? "Oxygen depleted." :
                   food <= 0 ? "Food exhausted." :
                   rad >= 100 ? "Critical radiation." : "";

    return {
        ...s,
        turn: s.turn + 1,
        power, o2, food, rad,
        logs: gameOver ? [reason, ...newLogs] : newLogs,
        gameOver,
    };
};

const restart = (): State => ({
    ...initialState,
    grid: createInitialGrid(),
    logs: ["Outpost re-initialized."],
});

/* ========== RENDERING (side effects) ========== */
const render = (canvas: HTMLCanvasElement): ((s: State) => void) => {
    const ctx = canvas.getContext("2d")!;

    return s => {
        // Draw grid
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const cell = s.grid[x][y];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                ctx.fillStyle = cell.module ? "#4ecca3" : "#161f30";
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = "#2a3447";
                ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

                if (cell.module) {
                    ctx.fillStyle = "#000";
                    ctx.font = "bold 10px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(cell.module, px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 3);
                }
            }
        }

        // Update HUD
        setText("stat-power", s.power);
        setText("stat-o2", s.o2);
        setText("stat-food", s.food);
        setText("stat-rad", s.rad);
        setText("stat-turn", s.turn);

        // Update logs
        const logEl = document.getElementById("log");
        if (logEl) logEl.innerHTML = s.logs.slice(0, 12).map(l => `<div>${l}</div>`).join("");

        // Game over overlay
        const overlay = document.getElementById("gameOver");
        if (overlay) overlay.classList.toggle("hidden", !s.gameOver);
    };
};

const setText = (id: string, val: number) => {
    const el = document.getElementById(id);
    if (el) el.innerText = String(val);
};

/* ========== STREAMS ========== */
const state$ = (canvas: HTMLCanvasElement): Observable<State> => {
    // Grid clicks → coordinate → place module
    const click$: Observable<Reducer> = fromEvent<MouseEvent>(canvas, "click").pipe(
        map(e => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
            const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
            return placeModule(x, y);
        }),
    );

    // Module selection buttons
    const select$: Observable<Reducer> = fromEvent<MouseEvent>(document, "click").pipe(
        filter(e => (e.target as HTMLElement).dataset.module !== undefined),
        map(e => selectModule((e.target as HTMLElement).dataset.module as ModuleType)),
    );

    // End turn button
    const endTurn$: Observable<Reducer> = fromEvent<MouseEvent>(document, "click").pipe(
        filter(e => (e.target as HTMLElement).id === "endTurnBtn"),
        map(() => endTurn),
    );

    // Restart button
    const restart$: Observable<State> = fromEvent<MouseEvent>(document, "click").pipe(
        filter(e => (e.target as HTMLElement).id === "restartBtn"),
        map(() => restart()),
    );

    const events$ = merge(click$, select$, endTurn$);

    return restart$.pipe(
        startWith(initialState),
        switchMap(initial =>
            events$.pipe(scan((s, r) => r(s), initial)),
        ),
    );
};

/* ========== BOOTSTRAP ========== */
if (typeof window !== "undefined") {
    const canvas = document.getElementById("gridCanvas") as HTMLCanvasElement;

    // Build module buttons
    const moduleList = document.getElementById("moduleList")!;
    Object.entries(MODULES).forEach(([key, cfg]) => {
        const btn = document.createElement("button");
        btn.innerText = `${cfg.name} (${cfg.cost})`;
        btn.dataset.module = key;
        moduleList.appendChild(btn);
    });

    state$(canvas).subscribe(render(canvas));
}