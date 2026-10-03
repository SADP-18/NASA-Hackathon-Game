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
