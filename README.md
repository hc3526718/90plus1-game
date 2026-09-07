# 90+1

A browser-based football career game inspired by Jumpers for Goalposts and New Star Soccer.

## Version 1.5 - Activity Deck Update

**90+1 v1.5** introduces the **Activity Deck** system, replacing repetitive day planning with an event-driven experience where each free day presents 2-4 unique invitations plus always-available Rest.

## Overview

**90+1** is a Flash-era styled football career game where you create a player and work your way up from non-league to the top flight. The game focuses on dynamic weekly planning, matchday performance with skill moments, and life management with a nostalgic chunky UI aesthetic.

## Features

### Core Gameplay Loop

1. **Player Creation**
   - Name your player
   - Choose preferred foot (left, right, or both)
   - Start with basic attributes that improve over time

2. **Weekly Briefing**
   - Review your energy, form, manager trust, and media heat
   - Check relationship with partner (if you have one)
   - Preview upcoming match
   - Review career statistics

3. **Activity Deck** (Monday - Saturday, free days)
   Each day presents **2-4 unique invitations** based on your career state:
   
   **Training Variants**
   - Shooting Drill, Fitness Training, Tactical Session
   - Diminishing returns if trained too much (injury risk!)
   - Different drills unlock as career progresses
   
   **Partner Activities**
   - Dinner dates, days out, phone calls
   - Specific invites based on relationship state
   - Costs energy and money but improves mood
   
   **Teammate Events**
   - Night out with the lads
   - Bus gambling (higher-lower cards, £50 stake)
   - Captain's BBQ and other team socials
   
   **Shopping & Lifestyle**
   - Buy new kit, upgrade your car, luxury watches
   - Unlocks based on wages and media heat
   - Affects partner mood and media coverage
   
   **Media & Career**
   - Press interviews, sponsorship meetings
   - Manager meetings (if form/trust low)
   - Agent calls (transfer window)
   
   **Story Cards** (1-2 per week)
   - Tabloid offers, family visits, charity events
   - Accept or skip - each choice has consequences
   
   **Rest** (always available)
   - +30 energy, no cost
   - Reset consecutive training counter

4. **Matchday**
   - Live text commentary feed with match clock
   - Watch events unfold in real-time
   - Get chances to score with timed skill minigames

5. **Skill Minigames**
   - Timed power meter mechanic (hit the sweet spot!)
   - Success based on timing + player attributes
   - Tighter timing windows in injury time (90+)
   - Score goals or miss chances affecting your rating

6. **Post-Match**
   - View match result and your performance rating
   - Manager's reaction based on performance
   - Career stats updated (appearances, goals, assists)
   - Energy depleted, form and trust adjusted

7. **Progression**
   - Attributes improve through training
   - Form increases with good performances
   - Manager trust grows with consistent play
   - Transfer offers come when form is high

8. **Transfers**
   - Higher division clubs make offers
   - Compare current club vs offering club
   - Accept to move up the pyramid or stay loyal

### Player Attributes

- **Finishing** (1-20): Affects shot success rate
- **Composure** (1-20): Helps in high-pressure moments
- **Pace** (1-20): Overall athleticism
- **Stamina** (1-20): Energy management
- **Awareness** (1-20): Match intelligence

### Personal Life

- Meet partners through Personal actions
- Maintain relationship or it deteriorates
- Happy partners boost media heat
- Ignoring relationships affects mood
- Gambling with teammates: 50/50 chance to win 2x stake

### Season Phases

The Activity Deck changes based on season phase:

- **Preseason** (Weeks 1-4): More training options, friendly matches
- **Early Season** (Weeks 5-15): Team socials, settling in
- **Midseason** (Weeks 16-35): Grind mode, more media opportunities
- **Run-in** (Weeks 36-46): Tighter recovery focus, high-stakes matches
- **Summer** (Weeks 47-52): Transfer window, holiday options, no league matches

### Career Unlocks

Activities unlock as you progress:

| Unlock | Requirement |
|--------|-------------|
| Basic teammate hangouts | Always available |
| Bus gambling | £500+ weekly wage |
| Basic shopping (kit) | £500+ wage |
| Car upgrades | £1000+ wage |
| Media interviews | 30+ media heat |
| Sponsorship deals | 50+ media, League Two+ |
| Luxury shopping | £2000+ wage, 40+ media |

### Match Chance Scaling

Player chances during matches scale with opponent strength:

**Formula**: `targetChances = 3 * (playerStrength / opponentStrength)`

- **Floor**: Minimum 1 chance even vs strong opponents
- **Ceiling**: Maximum 6 chances even vs weak opponents
- **Distribution**: Spread across first half, second half, possible injury time

Example:
- Equal strength (1.0 ratio) = ~3 chances
- Stronger opponent (0.7 ratio) = ~2 chances
- Weaker opponent (1.5 ratio) = ~4-5 chances

Player strength = Club strength + form/10 + energy/10

### Fictional Club Structure

**Tier 0 - Non-League**
- Heath United
- Riverside Town
- Manor FC
- Parkside Rangers
- Valley Athletic

**Tier 1 - League Two-ish**
- Northbridge City
- Eastgate Wanderers
- Marlton United
- Oakwood Town
- Redhill FC
- Southport Rovers

**Tier 2 - League One-ish**
- Millbrook City
- Westford Athletic
- Hartley Town
- Ashfield United
- Bromley Wanderers
- Kingston Rangers

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone or download the repository
cd 90plus1

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play!

### Building for Production

```bash
npm run build
npm start
```

## Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: React hooks
- **Storage**: localStorage (automatic save/load)
- **Rendering**: Canvas API for minigames

## Game Architecture

```
/app
  /page.tsx               - Main entry point
  /layout.tsx             - Root layout
  /globals.css            - Flash-era aesthetic styles

/components
  /GameContainer.tsx      - Main game state container
  /screens
    /StartScreen.tsx              - Title screen
    /CreatePlayerScreen.tsx       - Player creation
    /WeeklyBriefingScreen.tsx     - Week briefing
    /DayPlannerScreen.tsx         - Daily activities
    /MatchScreen.tsx              - Live match commentary
    /MinigameScreen.tsx           - Canvas-based skill games
    /PostMatchScreen.tsx          - Match results
    /TransferDecisionScreen.tsx   - Transfer offers

/lib
  /types.ts               - TypeScript type definitions
  /gameData.ts            - Static data (clubs, names)
  /gameEngine.ts          - Core game logic
  /storage.ts             - localStorage utilities
```

## Data Models

### GameState
The main game state contains:
- Player data (attributes, stats, career)
- Current week and day plans
- Match state during games
- Minigame state during chances
- Partner and teammates
- Transfer offers
- Current screen

### Player
```typescript
{
  name: string
  preferredFoot: 'left' | 'right' | 'both'
  attributes: { finishing, composure, pace, stamina, awareness }
  energy: 0-100
  form: 0-100
  managerTrust: 0-100
  mediaHeat: 0-100
  currentClubId: string
  currentTier: number
  careerStats: { appearances, goals, assists }
}
```

### Match Simulation
- Seeded random for deterministic outcomes
- Team strength + player form determine chances
- Events generated with timing (0' to 90+')
- Player chances trigger minigames
- Goals/misses update live score and rating

## Extension Points

The v1 slice is complete but leaves clear hooks for expansion:

### Ready to Add
- More minigame types (headers, volleys, 1v1s)
- Agent interactions (contract negotiations)
- Teammate relationships (bus card games expanded)
- Training minigames
- Multiple partners/life paths
- Cups and tournaments
- International career
- Manager tactics affecting match style
- Injuries and fitness system
- Social media events
- Endorsement deals

### How to Add New Clubs
Edit `/lib/gameData.ts`:

```typescript
// Add to CLUBS array
{
  id: 'your-club-id',
  name: 'Your Club Name',
  tier: 2,  // 0, 1, 2, etc.
  strength: 65  // 40-90 range
}
```

### How to Add New Attributes
1. Update `PlayerAttributes` in `/lib/types.ts`
2. Update `createNewPlayer()` in `/lib/gameEngine.ts`
3. Update attribute display in `CreatePlayerScreen.tsx`
4. Use new attributes in `evaluateMinigameSuccess()`

## Design Philosophy

### Visual North Star
- Flash-era aesthetic (Jumpers for Goalposts + New Star Soccer)
- Flat/soft 2D art
- Chunky, readable UI
- No AI-slop art or photoreal faces
- Limited color palette with gradients
- Over-the-shoulder training/match moments

### Gameplay Philosophy
- Low visuals, high craft
- Deterministic enough to feel fair
- Snappy minigames (2-4 second decisions)
- Life systems are levers, not checklists
- You ARE the player, not managing a team

## Save System

The game automatically saves to localStorage after every state change:
- No manual save button needed
- Can close browser and continue later
- "Continue" button appears on title screen when save exists
- Save persists across browser sessions

## Performance Notes

- Canvas-based minigames run at 60fps
- Match commentary displays at 800ms intervals
- No external API calls or assets required
- Runs entirely client-side
- Mobile-friendly responsive design

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This is a prototype/demo game. No real player or club licenses used.

## Credits

Inspired by:
- Jumpers for Goalposts (Flash game)
- New Star Soccer (mobile game)
- The beautiful game ⚽

---

**Game on and reach the top flight! 🏆**
