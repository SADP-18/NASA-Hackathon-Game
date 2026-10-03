export type ModuleType = "SOLAR" | "HAB" | "HYDRO" // | "SHIELD";

export interface ModuleConfig {
    type: ModuleType;
    name: string;
    cost: number;         // credits
    powerGen: number;     // kW per second
    powerDrain: number;   // kW per second (positive number)
    manpowerGen: number;
    manpowerDrain: number;
    o2Gen: number;        // % per second
    o2Drain: number;      // % per second (positive number)
    description: string;
    icon: string;         // path for designer
}

export interface Cell {
    module: ModuleType | null;
}

export interface State {
    credits: number;
    manpower: number;
    power: number;        // 0-100 kW
    oxygen: number;       // 0-100 %
    day: number;
    timeSec: number;
    selected: ModuleType | null;
    grid: Cell[][];
    blackoutTimer: number; // seconds power has been 0
    logs: string[];
    gameOver: boolean;
    gameOverReason: string;
    gameWon: boolean;
}