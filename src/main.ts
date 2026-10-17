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
} from "rxjs";
import {
    GRID_SIZE,
    CELL_SIZE,
    MAX_POWER,
    MAX_OXYGEN,
    MAX_FOOD,
    MAX_STRESS,
    MAX_RADIATION,
    START_POWER,
    START_MANPOWER,
    START_OXYGEN,
    START_FOOD,
    START_STRESS,
    START_RADIATION,
    START_CREDITS,
    CREDITS_PER_DAY,
    TICKS_PER_DAY,
    BLACKOUT_GRACE,
    COVERAGE_POWER,
    COVERAGE_O2,
    DUST_STORM_DURATION,
    MODULES,
    LEVELS
} from "./config";
import { Cell, ModuleType, State } from "./types";

/* ===== INITIAL STATE ===== */
const createGrid = (): Cell[][] =>
    Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => ({ module: null })),
    );

const createInitialGrid = (): Cell[][] => {
    const grid = createGrid();
    const c = Math.floor(GRID_SIZE / 2);
    grid[c][c] = { module: "BASE" };
    return grid;
};

const createLevelState = (level: number): State => ({
    credits: START_CREDITS,
    power: START_POWER,
    manpower: START_MANPOWER,
    oxygen: START_OXYGEN,
    food: START_FOOD,
    stress: START_STRESS,
    radiation: START_RADIATION,
    day: 1,
    timeSec: 0,
    selected: null,
    grid: createInitialGrid(),
    blackoutTimer: 0,
    dustStormTimer: 0,
    logs: [level === 1 ? "Outpost online. Awaiting construction." : `Level ${level} begins.`],
    gameOver: false,
    gameOverReason: "",
    gameWon: false,
    level,
    levelComplete: false
});

const initialState: State = createLevelState(1);

/* ==========  HELPERS ========== */
/**
 * Converts seconds that passes in the current day into an in-game clock (HH:00).
 */
const formatGameTime = (timeSec: number): string => {
    const hours = Math.floor((timeSec / TICKS_PER_DAY) * 24);
    return `${String(hours).padStart(2, "0")}:00`;
}
//     COVERAGE
const computeCoverage = (
    grid: Cell[][],
    source: ModuleType,
    radius: number,
): boolean[][] => {
    const covered = Array.from({ length: GRID_SIZE }, () =>
        Array(GRID_SIZE).fill(false),
    );
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (grid[x][y].module !== source) continue;
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) > radius) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                        covered[nx][ny] = true;
                    }
                }
            }
        }
    }
    return covered;
};

// SHIELD
const hasAdjacentShield = (grid: Cell[][], x: number, y: number): boolean => {
    const dirs: [number, number][] = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];
    return dirs.some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return (
            nx >= 0 &&
            nx < GRID_SIZE &&
            ny >= 0 &&
            ny < GRID_SIZE &&
            grid[nx][ny].module === "SHIELD"
        );
    });
};



/* ===== PURE REDUCERS ===== */
type Reducer = (s: State) => State;

const selectModule = (type: ModuleType): Reducer => s => ({
    ...s,
    selected: s.selected === type ? null : type,
});

const placeModule = (x: number, y: number): Reducer => s => {
    if (s.gameOver || s.gameWon || s.levelComplete || !s.selected) return s;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return s;
    if (s.grid[x][y].module !== null) return s;

    const cfg = MODULES[s.selected];
    // Manpower gate - cannot build if there is now crew
    if (s.manpower < cfg.manpowerDrain) {
        return { ...s, logs: [`Not enough manpower for ${cfg.name}.`, ...s.logs] };
    }

    if (s.credits < cfg.cost) {
        return { ...s, logs: [`Not enough credits for ${cfg.name}.`, ...s.logs] };
    }

    const newGrid = s.grid.map((col, cx) =>
        col.map((cell, cy) =>
            cx === x && cy === y ? { module: s.selected } : cell,
        ),
    );

    return {
        ...s,
        credits: s.credits - cfg.cost,
        grid: newGrid,
        logs: [`Built ${cfg.name} at (${x},${y}).`, ...s.logs],
    };
};

/* ===== SIMULATION TICK ===== */
const tick: Reducer = s => {
    if (s.gameOver || s.gameWon || s.levelComplete) return s;
    const lvl = LEVELS[s.level - 1];

    // Coverage maps for this tick
    const powered = computeCoverage(s.grid, "SOLAR", COVERAGE_POWER);
    const oxygenated = computeCoverage(s.grid, "HYDRO", COVERAGE_O2);

    // Accumulate output from active modules
    let powerGen = 0, powerDrain = 0;
    let manpowerGen = 0, manpowerDrain = 0;
    let o2Gen = 0, o2Drain = 0;
    let foodGen = 0, foodDrain = 0;
    let stressGen = 0, stressReduce = 0;
    let radReduce = 0;
    let habCount = 0;
    let shieldedHabs = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const cell = s.grid[x][y];
            if (!cell.module) continue;

            const cfg = MODULES[cell.module];
            const selfPowered = cell.module === "SOLAR" || cell.module === "BASE";
            const isPowered = selfPowered || powered[x][y];

            if (!isPowered) continue;

            powerGen += cfg.powerGen;
            powerDrain += cfg.powerDrain;
            manpowerGen += cfg.manpowerGen;
            manpowerDrain += cfg.manpowerDrain;
            o2Gen += cfg.o2Gen;
            o2Drain += cfg.o2Drain;
            foodGen += cfg.foodGen;
            foodDrain += cfg.foodDrain;
            stressGen += cfg.stressGen;
            stressReduce += cfg.stressReduce;
            radReduce += cfg.radReduce;

            if (cell.module === "HAB") {
                habCount++;
                if (hasAdjacentShield(s.grid, x, y)) shieldedHabs++;
            }
        }
    }

    // Dust storm halves solar output
    const effectivePowerGen =
        s.dustStormTimer > 0 ? powerGen - (powerGen - powerDrain) * 0.5 : powerGen;
    const netPower = effectivePowerGen - powerDrain;

    let newPower = Math.max(0, Math.min(MAX_POWER, s.power + netPower));

    // Blackout tracking
    const inBlackout = newPower <= 0 && netPower < 0;
    const newBlackoutTimer = inBlackout ? s.blackoutTimer + 1 : 0;

    // Manpower
    const netManpower = manpowerGen - manpowerDrain;
    let newManpower = Math.max(0, s.manpower + netManpower);

    // Oxygen — uncovered habitats drain extra
    let uncoveredHabDrain = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (s.grid[x][y].module === "HAB" && !oxygenated[x][y]) {
                uncoveredHabDrain += 3;
            }
        }
    }
    const effectiveO2Gen = newPower > 0 ? o2Gen : 0;
    const netO2 = effectiveO2Gen - o2Drain - uncoveredHabDrain;
    let newOxygen = Math.max(0, Math.min(MAX_OXYGEN, s.oxygen + netO2));

    // Food
    const netFood = foodGen - foodDrain;
    let newFood = Math.max(0, Math.min(MAX_FOOD, s.food + netFood));

    // Stress
    let stressDelta = stressGen - stressReduce;
    if (newFood <= 0) stressDelta += 2;
    if (newManpower <= 0) stressDelta += 1;
    let newStress = Math.max(0, Math.min(MAX_STRESS, s.stress + stressDelta));

    // Radiation — unshielded habs contribute
    const radFromHabs = (habCount - shieldedHabs) * 1.5;
    const radDelta = radFromHabs - radReduce;
    let newRadiation = Math.max(0, Math.min(MAX_RADIATION, s.radiation + radDelta));

    // Time / Day advance
    const newTime = s.timeSec + 1;
    const advancedDay = newTime >= TICKS_PER_DAY;
    const newDay = advancedDay ? s.day + 1 : s.day;
    const newCredits = advancedDay ? s.credits + CREDITS_PER_DAY : s.credits;

    // Random events
    const events: string[] = [];

    if (Math.random() < lvl.pMeteor) {
        const dmg = 5 + Math.floor(Math.random() * 10);
        newPower = Math.max(0, newPower - dmg);
        events.push(`METEOR STRIKE: -${dmg} power`);
    }

    let newDustStormTimer = Math.max(0, s.dustStormTimer - 1);
    if (Math.random() < lvl.pDustStorm && newDustStormTimer === 0) {
        newDustStormTimer = DUST_STORM_DURATION;
        events.push(`DUST STORM: Solar output halved for ${DUST_STORM_DURATION}s`);
    }

    if (Math.random() < lvl.pSolarFlare) {
        newOxygen = Math.max(0, newOxygen - 8);
        events.push("SOLAR FLARE: -8% oxygen");
    }

    // Losing conditions
    let gameOver = false;
    let gameWon = false;
    let reason = "";

    if (newOxygen <= 0) {
        gameOver = true;
        reason = "Oxygen depleted. Crew lost.";
    } else if (newBlackoutTimer >= BLACKOUT_GRACE) {
        gameOver = true;
        reason = `Base without power for ${BLACKOUT_GRACE}s. Systems failed.`;
    } else if (newManpower <= 0 && netManpower < 0) {
        gameOver = true;
        reason = "Manpower exchausted. Crew cannot operate."
    } else if (newStress >= MAX_STRESS) {
        gameOver = true;
        reason = "Crew stress critical. Mutiny.";
    } else if (newRadiation >= MAX_RADIATION) {
        gameOver = true;
        reason = "Radiation critical. Crew poisoned.";
    }

    let levelComplete = false;

    if (!gameOver && newDay > lvl.winDays) {
        if (s.level >= LEVELS.length) {
            gameWon = true;
            reason = "All levels cleared! Outpost is sustainable.";
        } else {
            levelComplete = true;
            reason = `Level ${s.level} complete! Survived ${lvl.winDays} days.`;
        }
    }

    const dayLog = advancedDay
        ? [`--- Day ${newDay} --- (+${CREDITS_PER_DAY} credits)`, ...s.logs]
        : s.logs;

    const endLog = gameOver || gameWon || levelComplete ? [reason] : [];

    return {
        ...s,
        power: newPower,
        manpower: newManpower,
        oxygen: newOxygen,
        food: newFood,
        stress: newStress,
        radiation: newRadiation,
        credits: newCredits,
        day: newDay,
        timeSec: advancedDay ? 0 : newTime,
        blackoutTimer: newBlackoutTimer,
        dustStormTimer: newDustStormTimer,
        logs: [...events, ...endLog, ...dayLog].slice(0, 50),
        gameOver,
        gameWon,
        levelComplete,
        gameOverReason: reason,
    };
};

const restart = (): State => createLevelState(1);

/* ===== RENDER (side effects) ===== */
const render = (canvas: HTMLCanvasElement): ((s: State) => void) => {
    const ctx = canvas.getContext("2d")!;
    // Cache loaded icons so we don't recreate them every frame
    const iconCache: Partial<Record<ModuleType, HTMLImageElement>> = {};

    (Object.keys(MODULES) as ModuleType[]).forEach(type => {
        const img = new Image();
        img.src = MODULES[type].icon;
        iconCache[type] = img;
    });

    return s => {
        // --- Grid ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Coverage overlay (subtle background tint)
        const powered = computeCoverage(s.grid, "SOLAR", COVERAGE_POWER);
        const oxygenated = computeCoverage(s.grid, "HYDRO", COVERAGE_O2);

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const cell = s.grid[x][y];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                // Coverage tint
                if (powered[x][y]) {
                    ctx.fillStyle = "rgba(78, 204, 163, 0.06)";
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                }
                if (oxygenated[x][y]) {
                    ctx.fillStyle = "rgba(120, 180, 255, 0.06)";
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                }

                // Grid outline
                ctx.strokeStyle = "rgba(255,255,255,0.15)";
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

                // Placed module
                if (cell.module) {
                    const img = iconCache[cell.module];
                    if (img && img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    } else {
                        // Fallback text if icon hasn't loaded yet
                        ctx.fillStyle = "#4ecca3";
                        ctx.font = "bold 10px sans-serif";
                        ctx.textAlign = "center";
                        ctx.fillText(cell.module, px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 4);
                    }
                }
            }
        }

        // --- HUD ---
        const setHud = (
            id: string,
            val: string,
            color: string = "",
        ) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = val;
                if (color) el.style.color = color;
            }
        };

        const powerNet = Math.round(
            s.power > 0
                ? s.power + (s.dustStormTimer > 0 ? -1 : 1)
                : 0,
        );
        setHud(
            "hud-power",
            `${Math.round(s.power)}/${MAX_POWER}`,
            s.power < 20 ? "#ff5c5c" : "",
        );
        setHud("hud-manpower", String(s.manpower), s.manpower < 2 ? "#ff5c5c" : "");
        setHud("hud-oxygen", `${Math.round(s.oxygen)}%`, s.oxygen < 20 ? "#ff5c5c" : "");
        setHud("hud-food", `${Math.round(s.food)}`, s.food < 10 ? "#ff5c5c" : "");
        setHud("hud-stress", `${Math.round(s.stress)}%`, s.stress > 60 ? "#ff5c5c" : "");
        setHud("hud-radiation", `${Math.round(s.radiation)}%`, s.radiation > 60 ? "#ff5c5c" : "");
        setHud("hud-credits", `$${s.credits}`);
        setHud("hud-day", `Day ${s.day}`);
        setHud("hud-time", formatGameTime(s.timeSec));
        setHud("hud-level", `${s.level}/${LEVELS.length}`);

        // --- Selected module highlight ---
        document.querySelectorAll<HTMLElement>(".module-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.module === s.selected);
        });

        // --- Logs ---
        const logEl = document.getElementById("log");
        if (logEl) {
            logEl.innerHTML = s.logs.slice(0, 12).map(l => `<div>${l}</div>`).join("");
        }

        // --- Game over / win overlay ---
        const overlay = document.getElementById("overlay");
        const title = document.getElementById("overlayTitle");
        const msg = document.getElementById("overlayMsg");
        const nextBtn = document.getElementById("nextLevelBtn");
        if (overlay && title && msg && nextBtn) {
            if (s.gameOver || s.gameWon || s.levelComplete) {
                overlay.classList.remove("hidden");
                title.innerText = s.gameWon ? "OUTPOST SUSTAINABLE" : s.levelComplete ? "LEVEL COMPLETE" : "OUTPOST LOST";
                title.style.color = s.gameOver ? "#ff5c5c" : "#4ecca3";
                msg.innerText = s.gameOverReason;
                nextBtn.classList.toggle("hidden", !s.levelComplete);
            } else {
                overlay.classList.add("hidden");
            }
        }
    };
};

/* ===== STREAMS ===== */
const state$ = (canvas: HTMLCanvasElement): Observable<State> => {
    const click$: Observable<Reducer> = fromEvent<MouseEvent>(canvas, "click").pipe(
        map(e => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
            const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
            return placeModule(x, y);
        }),
    );

    // Module select buttons (matched by data-module attribute)
    const select$: Observable<Reducer> = fromEvent<MouseEvent>(document, "click").pipe(
        map(e => (e.target as HTMLElement).closest<HTMLElement>(".module-btn")),
        filter((btn): btn is HTMLElement => btn !== null),
        map(btn => selectModule(btn.dataset.module as ModuleType)),
    );

    // Restart button
    const restart$: Observable<State> = fromEvent<MouseEvent>(document, "click").pipe(
        filter(e => (e.target as HTMLElement).id === "restartBtn"),
        map(() => restart()),
    );

    const nextLevel$: Observable<Reducer> = fromEvent<MouseEvent>(document, "click").pipe(
        filter(e => (e.target as HTMLElement).id === "nextLevelBtn"),
        map(() => (s: State) => (s.levelComplete ? createLevelState(s.level + 1) : s)),
    );

    // Simulation tick — 1 second
    const tick$: Observable<Reducer> = interval(1000).pipe(map(() => tick));

    // const events$ = merge(click$, select$, tick$);

    const events$ = merge(click$, select$, tick$, nextLevel$);

    return restart$.pipe(
        startWith(initialState),
        switchMap(initial => events$.pipe(scan((s, r) => r(s), initial))),
    );
};

/* ===== BOOTSTRAP ===== */
if (typeof window !== "undefined") {
    const canvas = document.getElementById("gridCanvas") as HTMLCanvasElement;
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;

    // Build module buttons from MODULES config
    const menu = document.getElementById("buildMenu")!;
    (Object.keys(MODULES) as ModuleType[])
        .filter(k => k !== "BASE")
        .forEach(key => {
            const cfg = MODULES[key];
            const btn = document.createElement("button");
            btn.className = "module-btn";
            btn.dataset.module = key;
            btn.title = cfg.description;

            const img = document.createElement("img");
            img.src = cfg.icon;
            img.alt = cfg.name;
            img.onerror = () => { img.style.visibility = "hidden"; };
            btn.appendChild(img);

            const label = document.createElement("span");
            label.className = "module-label";
            label.innerHTML = `
                <span class="name">${cfg.name}</span>
                <span class="cost">$${cfg.cost}</span>`;
            btn.appendChild(label);

            menu.appendChild(btn);
        });

    state$(canvas).subscribe(render(canvas));
}