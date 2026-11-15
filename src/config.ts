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
export const START_CREDITS = 500000000;

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
        powerGen: 0,
        powerDrain: 0,
        manpowerGen: 0,
        manpowerDrain: 0,
        o2Gen: 6,
        o2Drain: 3,
        foodGen: 0,
        foodDrain: 2,
        stressGen: 1,
        stressReduce: 0,
        radReduce: 1,
        description: "Starting base. Always active.",
        icon: "/icons/base.svg",
    },
    SOLAR: {
        type: "SOLAR",
        name: "Solar Array",
        cost: 10,
        powerGen: 16,
        powerDrain: 0,
        manpowerGen: 0,
        manpowerDrain: 1,
        o2Gen: 0,
        o2Drain: 0,
        foodGen: 0,
        foodDrain: 0,
        stressGen: 1,
        stressReduce: 0,
        radReduce: 0,
        description: "Generates power for the outpost.\nPower Generation: +16 kW\nManpower Needed: +1 technician\nStress Generation: +1\nCoverage: Powers modules within the designated area\nNote: be sure to place modules within the solar panel tiles or they won't work!",
        icon: "/icons/Solar.png",
    },
    HAB: {
        type: "HAB",
        name: "Habitation Pod",
        cost: 15,
        powerGen: 0,
        powerDrain: 3,
        manpowerGen: 5,
        manpowerDrain: 0,
        o2Gen: 0,
        o2Drain: 2,
        foodGen: 0,
        foodDrain: 3,
        stressGen: 0,
        stressReduce: 0,
        radReduce: 0,
        description: "Provides living quarters and psychological space for the crew.\nPower Usage: -3 kW\nManpower Provided: +5 crew\nOxygen Usage: -2 (-4 outside Hydroponics range)\nFood Usage: -3\nRadiation Generation: +1.5 (unless next to a Radiation Shield)",
        icon: "/icons/Habitat.png",
    },
    HYDRO: {
        type: "HYDRO",
        name: "Hydroponics",
        cost: 20,
        powerGen: 0,
        powerDrain: 6,
        manpowerGen: 0, 
        manpowerDrain: 1,
        o2Gen: 10,
        o2Drain: 0,
        foodGen: 6,
        foodDrain: 0,
        stressGen: 2,
        stressReduce: 0,
        radReduce: 0,
        description: "Produces food and supplementary oxygen through plant photosynthesis.\nPower Usage: -6 kW\nManpower Needed: +1 agronomist\nOxygen Generation: +10\nFood Generation: +6\nStress Generation: +2\nCoverage: Supplies oxygen to habitation pods within 2 tiles",
        icon: "/icons/Hydroponics.png",
    },
    SHIELD: {
        type: "SHIELD",
        name: "Radiation Shield",
        cost: 15,
        powerGen: 0,
        powerDrain: 4,
        manpowerGen: 0,
        manpowerDrain: 1,
        o2Gen: 0,
        o2Drain: 0,
        foodGen: 0,
        foodDrain: 0,
        stressGen: 1,
        stressReduce: 0,
        radReduce: 3,
        description: "Protects adjacent habitation pods from cosmic rays and solar particle events.\nPower Usage: -4 kW\nManpower Needed: +1 technicians\nRadiation Reduction: -3\nStress Generation: +1",
        icon: "/icons/Radiation.png",
    },
    MEDICAL: {
        type: "MEDICAL",
        name: "Medical Bay",
        cost: 25,
        powerGen: 0,
        powerDrain: 3,
        manpowerGen: 0,
        manpowerDrain: 1,
        o2Gen: 0,
        o2Drain: 0,
        foodGen: 0,
        foodDrain: 0,
        stressGen: 0,
        stressReduce: 4,
        radReduce: 0,
        description: "Provides diagnostics, trauma care, and surgical capabilities to safeguard crew health.\nPower Usage: -3 kW\nManpower Needed: +1 medics\nStress Reduction: -4",
        icon: "/icons/Medical.png",
    },
};

export const LEVELS: LevelConfig[] = [
    { winDays: 10, pMeteor: 0.02, pDustStorm: 0.01, pSolarFlare: 0.01 },
    { winDays: 20, pMeteor: 0.03, pDustStorm: 0.02, pSolarFlare: 0.02 },
    { winDays: 30, pMeteor: 0.04, pDustStorm: 0.03, pSolarFlare: 0.03 },
];
