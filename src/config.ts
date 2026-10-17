import { LevelConfig, ModuleConfig, ModuleType } from "./types";

export const GRID_SIZE = 10;
export const CELL_SIZE = 60; // px

export const MAX_POWER = 100;
export const MAX_OXYGEN = 100;
export const MAX_FOOD = 100;
export const MAX_STRESS = 100;
export const MAX_RADIATION = 100;


export const START_POWER = 50;
export const START_MANPOWER = 5;
export const START_OXYGEN = 100;
export const START_FOOD = 50;
export const START_STRESS = 0;
export const START_RADIATION = 0;
export const START_CREDITS = 50;

export const CREDITS_PER_DAY = 5;
export const TICKS_PER_DAY = 24;      // 24 seconds per day
export const BLACKOUT_GRACE = 10;     // seconds of no power before losing

export const COVERAGE_POWER = 3;    // Solar powers tiles within this Manhattan radius

export const COVERAGE_O2 = 2;      // Hydro supplies O2 within this radius

export const DUST_STORM_DURATION = 30;

export const MODULES: Record<ModuleType, ModuleConfig> = {
    BASE: {
        type: "BASE",
        name: "Command Hub",
        cost: 0,
        powerGen: 5,
        powerDrain: 0,
        manpowerGen: 0,
        manpowerDrain: 0,
        o2Gen: 5,
        o2Drain: 0,
        foodGen: 2,
        foodDrain: 0,
        stressGen: 0,
        stressReduce: 1,
        radReduce: 1,
        description: "Starting base. Always active.",
        icon: "/icons/base.svg",
    },
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
        foodGen: 0,
        foodDrain: 0,
        stressGen: 0,
        stressReduce: 0,
        radReduce: 0,
        description: "+12 kW. Requires 1 manpower to operate.",
        icon: "/icons/solar.png",
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
        o2Drain: 3,
        foodGen: 0,
        foodDrain: 3,
        stressGen: 0,
        stressReduce: 0,
        radReduce: 0,
        description: "-3 kW, -3 O2, -3 food. +2 manpower. Emits radiation.",
        icon: "/icons/hab.png",
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
        foodGen: 5,
        foodDrain: 0,
        stressGen: 0,
        stressReduce: 0,
        radReduce: 0,
        description: "-8 kW, +15 O2, +5 food. Supplies O2 within radius 2.",
        icon: "/icons/hydro.png",
    },
    SHIELD: {
        type: "SHIELD",
        name: "Radiation Shield",
        cost: 25,
        powerGen: 0,
        powerDrain: 5,
        manpowerGen: 0,
        manpowerDrain: 1,
        o2Gen: 0,
        o2Drain: 0,
        foodGen: 0,
        foodDrain: 0,
        stressGen: 0,
        stressReduce: 0,
        radReduce: 3,
        description: "-5 kW. Shields adjacent habitats from radiation.",
        icon: "/icons/shield.svg",
    },
    MEDICAL: {
        type: "MEDICAL",
        name: "Medical Bay",
        cost: 30,
        powerGen: 0,
        powerDrain: 5,
        manpowerGen: 0,
        manpowerDrain: 2,
        o2Gen: 0,
        o2Drain: 0,
        foodGen: 0,
        foodDrain: 0,
        stressGen: 0,
        stressReduce: 4,
        radReduce: 0,
        description: "-5 kW. Reduces crew stress.",
        icon: "/icons/medical.svg",
    },
};

export const LEVELS: LevelConfig[] = [
    { winDays: 10, pMeteor: 0.02, pDustStorm: 0.01, pSolarFlare: 0.01 },
    { winDays: 20, pMeteor: 0.03, pDustStorm: 0.02, pSolarFlare: 0.02 },
    { winDays: 30, pMeteor: 0.04, pDustStorm: 0.03, pSolarFlare: 0.03 },
];