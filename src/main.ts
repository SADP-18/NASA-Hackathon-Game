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
    START_POWER,
    START_OXYGEN,
    START_CREDITS,
    CREDITS_PER_DAY,
    TICKS_PER_DAY,
    WIN_DAYS,
    BLACKOUT_GRACE,
    MODULES,
    START_MANPOWER,
} from "./config";
import { Cell, ModuleType, State } from "./types";

/* ===== INITIAL STATE ===== */
const createGrid = (): Cell[][] =>
    Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => ({ module: null })),
    );

const initialState: State = {
    credits: START_CREDITS,
    power: START_POWER,
    manpower: START_MANPOWER,
    oxygen: START_OXYGEN,
    day: 1,
    timeSec: 0,
    selected: null,
    grid: createGrid(),
    blackoutTimer: 0,
    logs: ["Outpost online. Awaiting construction."],
    gameOver: false,
    gameOverReason: "",
    gameWon: false,
};

/* ===== PURE REDUCERS ===== */
type Reducer = (s: State) => State;

const selectModule = (type: ModuleType): Reducer => s => ({
    ...s,
    selected: s.selected === type ? null : type,
});

const placeModule = (x: number, y: number): Reducer => s => {
    if (s.gameOver || s.gameWon || !s.selected) return s;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return s;
    if (s.grid[x][y].module !== null) return s;

    const cfg = MODULES[s.selected];
    // Manpower gate - cannot build if there is now crew
    if (s.manpower < cfg.manpowerDrain) {
        return {...s, logs: [`Not enough manpower for ${cfg.name}.`, ...s.logs]};
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

/* ===== SIMULATION TICK (1 second) ===== */
const tick: Reducer = s => {
    if (s.gameOver || s.gameWon) return s;

    // Sum module output
    let powerGen = 0, powerDrain = 0;
    let manpowerGen = 0, manpowerDrain = 0;
    let o2Gen = 0, o2Drain = 0;
    let hydroCount = 0;

    s.grid.forEach(col =>
        col.forEach(cell => {
            if (!cell.module) return;
            const cfg = MODULES[cell.module];
            powerGen += cfg.powerGen;
            powerDrain += cfg.powerDrain;
            manpowerGen += cfg.manpowerGen;
            manpowerDrain += cfg.manpowerDrain;
            o2Gen += cfg.o2Gen;
            o2Drain += cfg.o2Drain;
            if (cell.module === "HYDRO") hydroCount++;
        }),
    );

    const netPower = powerGen - powerDrain;
    let newPower = Math.max(0, Math.min(MAX_POWER, s.power + netPower));

    // Blackout tracking
    const inBlackout = netPower <= 0 && netPower < 0;
    const newBlackoutTimer = inBlackout ? s.blackoutTimer + 1 : 0;

    // Manpower
    const newManpower = Math.max(0, s.manpower = manpowerGen - manpowerDrain);

    // Oxygen change: hydroponics must have power to run
    const effectiveO2Gen = newPower > 0 ? o2Gen : 0;
    const netO2 = effectiveO2Gen - o2Drain;
    let newOxygen = Math.max(0, Math.min(100, s.oxygen + netO2));

    // Time / Day advance
    const newTime = s.timeSec + 1;
    const advancedDay = newTime >= TICKS_PER_DAY;
    const newDay = advancedDay ? s.day + 1 : s.day;
    const newCredits = advancedDay ? s.credits + CREDITS_PER_DAY : s.credits;
    const newLogs = advancedDay
        ? [`--- Day ${newDay} --- (+${CREDITS_PER_DAY} credits)`, ...s.logs]
        : s.logs;
    
    const blackoutStarted = newBlackoutTimer === 1 && s.blackoutTimer === 0;
    const finalLogs = blackoutStarted ? [`WARNING: Power depleted. ${BLACKOUT_GRACE}s until system failure.`, ...newLogs] : newLogs;

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
    } else if (newManpower <= 0 && manpowerDrain > manpowerGen) {
        gameOver = true;
        reason = "Manpower exchausted. Crew cannot operate."
    }

    // Winning condition
    if (!gameOver && newDay > WIN_DAYS) {
        gameWon = true;
        reason = `Survived ${WIN_DAYS} days! Outpost is sustainable.`;
    }

    return {
        ...s,
        power: newPower,
        manpower: newManpower,
        oxygen: newOxygen,
        credits: newCredits,
        day: newDay,
        timeSec: advancedDay ? 0 : newTime,
        blackoutTimer: newBlackoutTimer,
        logs: gameOver || gameWon ? [reason, ...newLogs] : newLogs,
        gameOver,
        gameWon,
        gameOverReason: reason,
    };
};

const restart = (): State => ({
    ...initialState,
    grid: createGrid(),
    logs: ["Outpost re-initialized."],
});

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

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const cell = s.grid[x][y];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                // Base tile (transparent so CSS background shows through)
                ctx.fillStyle = "rgba(0,0,0,0)";
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

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
        let netPower = 0;
        s.grid.forEach(col => 
            col.forEach(cell =>{
                if (!cell.module) return;
                netPower += MODULES[cell.module].powerGen - MODULES[cell.module].powerDrain;
            }),
        );

        const powerEl = document.getElementById("hud-power");
        if (powerEl) {
            const sign = netPower >= 0 ? "+" : "";
            powerEl.innerText = `${Math.round(s.power)}/${MAX_POWER} (${sign}${netPower}/s)`;
            powerEl.style.color = netPower < 0 ? "#ff5c5c" : netPower > 0 ? "#4ecca3" : "";
        }

        setText("hud-manpower", String(s.manpower));
        setText("hud-oxygen", `${Math.round(s.oxygen)}%`);
        setText("hud-credits", `$${s.credits}`);
        setText("hud-day", `Day ${s.day}`);

        // --- Selected module highlight ---
        document.querySelectorAll<HTMLElement>(".module-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.module === s.selected);
        });

        // --- Logs ---
        const logEl = document.getElementById("log");
        if (logEl) {
            logEl.innerHTML = s.logs.slice(0, 10).map(l => `<div>${l}</div>`).join("");
        }

        // --- Game over / win overlay ---
        const overlay = document.getElementById("overlay");
        const overlayTitle = document.getElementById("overlayTitle");
        const overlayMsg = document.getElementById("overlayMsg");
        if (overlay && overlayTitle && overlayMsg) {
            if (s.gameOver || s.gameWon) {
                overlay.classList.remove("hidden");
                overlayTitle.innerText = s.gameWon ? "OUTPOST SUSTAINABLE" : "OUTPOST LOST";
                overlayTitle.style.color = s.gameWon ? "#4ecca3" : "#ff5c5c";
                overlayMsg.innerText = s.gameOverReason;
            } else {
                overlay.classList.add("hidden");
            }
        }
    };
};

const setText = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
};

/* ===== STREAMS ===== */
const state$ = (canvas: HTMLCanvasElement): Observable<State> => {
    // Grid click → place module
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
        filter(e => (e.target as HTMLElement).dataset.module !== undefined),
        map(e => selectModule((e.target as HTMLElement).dataset.module as ModuleType)),
    );

    // Restart button
    const restart$: Observable<State> = fromEvent<MouseEvent>(document, "click").pipe(
        filter(e => (e.target as HTMLElement).id === "restartBtn"),
        map(() => restart()),
    );

    // Simulation tick — 1 second
    const tick$: Observable<Reducer> = interval(1000).pipe(map(() => tick));

    const events$ = merge(click$, select$, tick$);

    return restart$.pipe(
        startWith(initialState),
        switchMap(initial =>
            events$.pipe(scan((s, r) => r(s), initial)),
        ),
    );
};

/* ===== BOOTSTRAP ===== */
if (typeof window !== "undefined") {
    const canvas = document.getElementById("gridCanvas") as HTMLCanvasElement;
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;

    // Build module buttons from MODULES config
    const menu = document.getElementById("buildMenu")!;
    (Object.keys(MODULES) as ModuleType[]).forEach(key => {
        const cfg = MODULES[key];
        const btn = document.createElement("button");
        btn.className = "module-btn";
        btn.dataset.module = key;
        btn.title = cfg.description;

        // Icon placeholder — the designer replaces /icons/*.svg
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