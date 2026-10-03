# NASA-Hackathon-Game

grid based game
tile entities involve:

1. living quarters
2. oxygen tank
3. generator
4. hydroponics
5. statistics involved:
6. manpower
7. food
8. O2
9. power

Rules implementation:
RESOURCES

1. credits (earned passively per day):
   Starting: ??
   per day: (default: +5)
   Max: Unlimited
2. power:
   Starting: 50kW
   Max: 100kW

3. oxygen: 100%

MODULE CATALOG (Name - Cost - Power Generation/Drain - O2 Output/Drain - Special Effect

1. Solar Array - $10 - +12kW - 0%O2 - Generating 0 kW during Lunar Night (Maybe Implement)
2. Habitation - $15 - -3kW - -5%O2 - Required to house crew. Drains O2 Over time
3. Hydroponics - $20 - -8kW - +15%O2 - Need power to generate O2
4. Rad Shield - $25 - -5kW - 0%O2 - Protects adjacent habitats from radiation leaks

GAME MECHANICS

1. Placement Rule:
   - Players click a tile on the grid to place the currently selected building
   - Building fails if the player lacks sufficient Credits ($) or if the tile is already occupied.
2. The 1-Second Simulation Tick:

- Net Power = sum(power Gen) - sum(power Drain)
- Net Oxygen = sum(O2 Output) - sum(O2 Drain)
- Power cap check = 0kW <= power <= 100kW

3. Power Blackout Penalty:

- if total stored Power reaches 0kW while Net Power is negative, all Hydroponics shut down, causing O2 to drain at a penalty rate of 10%/sec

4. Day / Night Cycle Hazard (Maybe Implement):

- every 15 seconds, the environment flips between Daylight and Lunar Light
- During Lunar Night, all Solar Arrays output 0kW. Players must store excess power or build backup generators to survive the night

WINNING/ LOOSING CONDITIONS
WIN: Survive through 30 Days without critical failures
LOOSE:

- Oxygen Drops to 0%
- Base run out of power for more than 10 seconds
<<<<<<< Updated upstream
=======

for devs:

## Feature RoadMap

The project is scoped into three tiers:

- **Tier 1** — core loop, implemented now
- **Tier 2** — high-value additions, planned next
- **Tier 3** — reconsidered, deferred with justification

### Tier 1 — Core (IMPLEMENTED)

The minimum viable game. Everything below ships and is playable.

Tiles:

- Solar Array — generates power
- Habitation Pod — consumes power + O2, generates manpower
- Hydroponics — consumes power + manpower, generates oxygen

Stats:

- Power (0–100 kW)
- Manpower (0–∞)
- Oxygen (0–100%)\
- Starting Credits ($50)

Loop:

- 1-second simulation tick
- 15 seconds = 1 day
- Win after 30 days
- Lose on O2 = 0, blackout for 10s, or manpower exhausted

**Why these three tiles:** they form a closed loop. Solar → power. Hab → manpower. Hydro → O2. Every tile depends on the other two to function. No third-party resource required. Shield tile is commented out because it is a waste of energy if implemented before any radiation events

### Tier 2 — Next (PLANNED)

Add these in order once Tier 1 is stable and playtested.

1. Base tile

- Base tile placed at start (only 1, cannot be removed)
- Credits earned passively per day
- Modules cost credits on placement
- Adds a second economic gate alongside manpower

2. Coverage radius

- Power reaches tiles within 3 of a Solar
- O2 reaches tiles within 2 of a Hydro
- Tiles outside coverage stop producing
- Creates spatial puzzle: you can't just spam one corner

3. Radiation stat + Radiation Shield tile

- Habitats passively leak radiation each tick
- Radiation Shield tiles protect adjacent Habitats (adjacency = 4 or 8 neighbours)
- Radiation > threshold → manpower drains faster
- Radiation = 100 → game over
- Creates a second spatial puzzle: coverage radius is about _supply_, Rad Shield is about _protection_
- Both use the same adjacency-check pattern, so the second is cheap once the first exists

4. Medical tile + Stress stat

- Stress rises when food is short
- Medical tiles reduce stress
- Adds a failure mode that isn't binary (dead/alive)

5. Food stat

- Hydroponics produce food as well as O2
- Habitats consume food
- Food shortage → stress → manpower loss
- Closes the survival loop

6. Random events

- Meteor strike (−power, random tile)
- Dust storm (Solar output halved for 20s)
- Solar flare (O2 drain spike)
- Cheap to implement (a few lines in `tick`), high replay value

**Why Tier 2 is worth building:** each addition is self-contained — a new module type, a new State field, a few lines in `tick`. None of them require rewriting the core FRP structure.

### Tier 3 — Reconsidered (DEFERRED)

These features appeared in the design doc but are deliberately not being built. Justification below.

1. Gas Pipe and Electrical Wiring tiles

The doc proposes pipes and wires as placeable tiles that transfer O2 and power to connected modules.

**Why deferred:**

- Requires a **connectivity graph** between tiles (BFS/DFS pathfinding)
- Requires **tile traversal rules** (pipes orthogonal, wires diagonal — the doc even hints at this)
- Requires **rendering pipes/wires on top of modules**
- Requires **propagation logic** for fluids and power

Estimated implementation: 150–200 lines minimum, plus significant debugging. That's a game on its own.

Recommended alternative: use coverage radius (Tier 2, item 2). Same emergent behaviour — tiles far from generators fail — with 10× less code.

2. Pressure stat

The doc lists pressure as "manipulated" but doesn't explain how the player controls it. Its only documented effect is triggering pipe breaks — which requires the pipe system.

Why deferred: Without pipes, pressure has no meaningful input or output. Cut it entirely.

3. Feed allocation system (manpower vs. medical)

The doc proposes splitting food between Living Quarters (manpower) and Medical (stress reduction) via player allocation.

Why deferred: Requires a UI slider or allocation control, per-tile state, and per-tick recalculation. High UI cost, low gameplay depth for a hackathon.

Recommended alternative: food is consumed automatically. If supply >= demand → manpower rises. If supply < demand --> stress rises. Same trade-off, no new UI.

4. Distance-based power failure event

The doc describes tiles more than 1 away from a generator having a chance to fail.

Why deferred: Requires the same distance-field system as coverage radius (Tier 2). Once that exists, this becomes trivial — so build coverage first.

5. Pipe break / Electrical line break events

These only matter if pipes and wires exist. Without them, the events have no valid target.

Recommended alternative: replace with Meteor strike and Dust storm events (Tier 2, item 5). Same thematic effect, no infrastructure dependency.

6. Non-dupe / Dupe tile rules

The doc distinguishes tiles that can stack on top of each other (pipes on modules) from tiles that can't.

**Why deferred:** Already implicit in the current code. `if (cell.module !== null) return s;` prevents any stacking. Only meaningful if pipes are added.
>>>>>>> Stashed changes
