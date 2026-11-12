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
        powerDrain: 3,
        manpowerGen: 0,
        manpowerDrain: 0,
        o2Gen: 6,
        o2Drain: 3,
        foodGen: 0,
        foodDrain: 2,
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
        // description: "Description: Generates power for the outpost.\nPower Generation: +12 kW\nManpower: 1 operator / technician\nOther Resources: None (requires periodic surface dust-cleaning).",
        description: "Generates power for the outpost.\nPower Generation: +12 kW\nManpower Needed: +1 technician\nStress Generation: +1\nCoverage: Powers modules within 3 tiles",
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
        // description: "Description: Provide living quarters, hygiene facilities, and psychological space for the crew.\nEnergy: 4 kW\nManpower: 0.5 (maintenance/sanitation rotation)\nOther Resources:\nWater: ~30 liters/day (supplied by filtration/recycling units)\nOxygen: ~0.84 kg/day per crew member.",
        description: "Provides living quarters and psychological space for the crew.\nPower Usage: -3 kW\nManpower Provided: +2 crew\nOxygen Usage: -3 (-6 outside Hydroponics range)\nFood Usage: -3\nRadiation Generation: +1.5 (unless next to a Radiation Shield)",
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
        stressGen: 1,
        stressReduce: 0,
        radReduce: 0,
        // description: "Description: Produce food, support biomass recycling, and supply supplementary oxygen via plant photosynthesis.\nEnergy: 8 kW (primarily for artificial grow-lighting and climate control)\nManpower: 2 agronomists / botanists\nOther Resources:\nWater: High consumption (~200–500 liters/day, largely supplied by greywater recycling)\nCarbon Dioxide (CO2CO2): Required for plant growth (sourced from crew respiration)",
        description: "Produces food and supplementary oxygen through plant photosynthesis.\nPower Usage: -8 kW\nManpower Needed: +1 agronomist\nOxygen Generation: +15\nFood Generation: +5\nStress Generation: +1\nCoverage: Supplies oxygen to habitation pods within 2 tiles",
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
        stressGen: 0,
        stressReduce: 0,
        radReduce: 3,
        // description: "Description: Generates an active magnetic or dense physical field to protect nearby modules, electronics, and habitat units from cosmic rays and solar particle events.\nEnergy: 15 kW (heavy draw for shielding arrays or active deflection coils)\nManpower: 0.5 (automated system requiring remote monitoring)\nOther Resources: Coolant fluids (such as ammonia or water loops) to manage thermal buildup from high-energy field generation.",
        description: "Protects adjacent habitation pods from cosmic rays and solar particle events.\nPower Usage: -5 kW\nManpower Needed: +2 technicians\nRadiation Reduction: -3\nStress Generation: +2",
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
        // description: "Description: Provides diagnostic equipment, trauma care, surgical capabilities, and pharmaceutical storage to safeguard crew health.\nEnergy: 5 kW (higher spikes during diagnostic imaging or surgical procedures)\nManpower: 1 Chief Medical Officer / Medic\nOther Resources:\nWater: ~50 liters/day (sterilization, equipment cooling, patient care)\nOxygen: Medical-grade oxygen tanks for trauma and surgical support\nConsumables: Pharmaceuticals, sterile bandages, and diagnostic disposables.",
        description: "Provides diagnostics, trauma care, and surgical capabilities to safeguard crew health.\nPower Usage: -5 kW\nManpower Needed: +2 medics\nStress Reduction: -4",
        icon: "/icons/Medical.png",
    },
};

export const LEVELS: LevelConfig[] = [
    { winDays: 10, pMeteor: 0.02, pDustStorm: 0.01, pSolarFlare: 0.01 },
    { winDays: 20, pMeteor: 0.03, pDustStorm: 0.02, pSolarFlare: 0.02 },
    { winDays: 30, pMeteor: 0.04, pDustStorm: 0.03, pSolarFlare: 0.03 },
];