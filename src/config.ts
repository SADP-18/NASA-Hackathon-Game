import { ModuleConfig, ModuleType } from "./types";

export const GRID_SIZE = 10;
export const CELL_SIZE = 60; // px

export const MAX_POWER = 100;
export const START_POWER = 50;
export const START_MANPOWER = 5;
export const START_OXYGEN = 100;
export const START_CREDITS = 50;

export const CREDITS_PER_DAY = 5;
export const TICKS_PER_DAY   = 24;      // 24 seconds per day
export const WIN_DAYS = 30;
export const BLACKOUT_GRACE = 10;     // seconds of no power before losing
export const BLACKOUT_O2_DRAIN = 10;  // % per sec when blackout + hydro present

export const MODULES: Record<ModuleType, ModuleConfig> = {
    SOLAR: {
        type: "SOLAR",
        name: "Solar Array",
        cost: 10,
        powerGen: 12,
        powerDrain: 0,
        manpowerGen: 0,
        manpowerDrain: 1,
        o2Gen: 0,
        o2Drain: 0,
        description: "+12 kW. Requires 1 manpower to operate.",
        icon: "/icons/solar.svg",
    },
    HAB: {
        type: "HAB",
        name: "Habitation Pod",
        cost: 15,
        powerGen: 0,
        powerDrain: 3,
        manpowerGen: 2,
        manpowerDrain: 0,
        o2Gen: 0,
        o2Drain: 5,
        description: "-3 kW, -5% O2. Produces 2 manpower.",
        icon: "/icons/hab.svg",
    },
    HYDRO: {
        type: "HYDRO",
        name: "Hydroponics",
        cost: 20,
        powerGen: 0,
        powerDrain: 8,
        manpowerGen: 0,
        manpowerDrain: 1,
        o2Gen: 15,
        o2Drain: 0,
        description: "-8 kW, +15% O2. Requires 1 manpower.",
        icon: "/icons/hydro.svg",
    },
    /*
    SHIELD: {
        type: "SHIELD",
        name: "Radiation Shield",
        cost: 25,
        powerGen: 0,
        powerDrain: 5,
        o2Gen: 0,
        o2Drain: 0,
        description: "-5 kW. Protects adjacent habitats.",
        icon: "/icons/shield.svg",
    },
    */
};