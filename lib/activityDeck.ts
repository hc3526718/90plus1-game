// Activity Deck - Event-driven day planning system for 90+1 v1.5

import { 
  ActivityOption, 
  ActivityCategory,
  Player, 
  Partner, 
  Teammate,
  SeasonPhase,
  PlayerAttributes 
} from './types';

// Helper to check if activity is unlocked based on career progression
export function isActivityUnlocked(
  category: ActivityCategory,
  activityId: string,
  player: Player
): boolean {
  const { weeklyWage, mediaHeat, currentTier, recentPurchases } = player;
  
  // Training always available
  if (category === 'training' || category === 'rest') return true;
  
  // Partner activities unlock after meeting someone
  if (category === 'partner') return true; // Partner existence checked elsewhere
  
  // Teammate activities
  if (category === 'teammate') {
    if (activityId.includes('gambling')) {
      return weeklyWage >= 500; // Mid-tier unlock
    }
    return true; // Basic teammate hangouts always available
  }
  
  // Shopping unlocks
  if (category === 'shopping') {
    if (activityId.includes('luxury')) {
      return weeklyWage >= 2000 && mediaHeat >= 40;
    }
    if (activityId.includes('car')) {
      return weeklyWage >= 1000;
    }
    return weeklyWage >= 500;
  }
  
  // Media/sponsorship
  if (category === 'media') {
    if (activityId.includes('sponsorship')) {
      return mediaHeat >= 50 && currentTier >= 1;
    }
    return mediaHeat >= 30;
  }
  
  // Manager/agent always available at key moments
  if (category === 'manager' || category === 'agent') return true;
  
  // Story cards random, always available when drawn
  if (category === 'story') return true;
  
  return true;
}

// Generate training activities (with variants)
function generateTrainingActivities(player: Player, phase: SeasonPhase): ActivityOption[] {
  const activities: ActivityOption[] = [];
  
  // Diminishing returns if trained too much recently
  const diminishingMultiplier = Math.max(0.3, 1 - (player.consecutiveTraining * 0.15));
  const injuryRisk = Math.min(0.4, player.consecutiveTraining * 0.08);
  
  // Shooting drill
  activities.push({
    id: 'train-shooting',
    category: 'training',
    title: 'Shooting Drill',
    description: `Work on finishing with the coach. ${player.consecutiveTraining > 2 ? '⚠️ Risk of overtraining' : ''}`,
    energyCost: 20,
    unlocked: true,
    effects: {
      energy: -20,
      form: 3,
      trust: 3,
      attributeChance: 'finishing',
    },
    metadata: {
      trainingType: 'shooting-drill',
      injuryRisk,
    },
  });
  
  // Fitness training
  if (player.currentTier >= 0) {
    activities.push({
      id: 'train-fitness',
      category: 'training',
      title: 'Fitness Training',
      description: `Build stamina and pace. ${player.consecutiveTraining > 2 ? '⚠️ Risk of overtraining' : ''}`,
      energyCost: 25,
      unlocked: true,
      effects: {
        energy: -25,
        form: 2,
        trust: 2,
        attributeChance: Math.random() > 0.5 ? 'stamina' : 'pace',
      },
      metadata: {
        trainingType: 'fitness',
        injuryRisk,
      },
    });
  }
  
  // Tactical session
  if (player.currentTier >= 1) {
    activities.push({
      id: 'train-tactical',
      category: 'training',
      title: 'Tactical Session',
      description: `Study positioning and awareness. ${player.consecutiveTraining > 2 ? '⚠️ Risk of overtraining' : ''}`,
      energyCost: 15,
      unlocked: true,
      effects: {
        energy: -15,
        form: 2,
        trust: 4,
        attributeChance: 'awareness',
      },
      metadata: {
        trainingType: 'tactical',
        injuryRisk: injuryRisk * 0.5, // Lower injury risk
      },
    });
  }
  
  // Weighted by season phase
  if (phase === 'preseason') {
    return activities; // All training options in preseason
  } else if (phase === 'run-in') {
    return activities.slice(0, 2); // Fewer heavy training in run-in
  }
  
  return activities;
}

// Generate partner activities
function generatePartnerActivities(partner: Partner, player: Player): ActivityOption[] {
  if (!partner) return [];
  
  const activities: ActivityOption[] = [];
  
  // Dinner date
  if (Math.random() > 0.4) {
    activities.push({
      id: 'partner-dinner',
      category: 'partner',
      title: `Dinner with ${partner.name}`,
      description: partner.mood < 40 
        ? `${partner.name} wants to talk about your relationship.`
        : `Quality time over dinner.`,
      energyCost: 5,
      unlocked: true,
      effects: {
        energy: -5,
        partnerMood: 15,
        media: 3,
      },
      metadata: {
        partnerEvent: 'dinner',
      },
    });
  }
  
  // Day out
  if (Math.random() > 0.6 && player.money >= 100) {
    activities.push({
      id: 'partner-dayout',
      category: 'partner',
      title: `Day Out with ${partner.name}`,
      description: `Spend the day together. Cost: £100`,
      energyCost: 10,
      unlocked: true,
      effects: {
        energy: -10,
        partnerMood: 20,
        media: 5,
        money: -100,
      },
      metadata: {
        partnerEvent: 'dayout',
      },
    });
  }
  
  // Phone call (if relationship struggling)
  if (partner.mood < 50) {
    activities.push({
      id: 'partner-call',
      category: 'partner',
      title: `Call ${partner.name}`,
      description: `Quick phone call to check in.`,
      energyCost: 2,
      unlocked: true,
      effects: {
        energy: -2,
        partnerMood: 8,
      },
      metadata: {
        partnerEvent: 'call',
      },
    });
  }
  
  return activities;
}

// Generate teammate activities
function generateTeammateActivities(teammates: Teammate[], player: Player, phase: SeasonPhase): ActivityOption[] {
  const activities: ActivityOption[] = [];
  
  // Night out with the lads
  if (Math.random() > 0.5 && player.energy > 30) {
    activities.push({
      id: 'teammate-night-out',
      category: 'teammate',
      title: 'Night Out',
      description: 'Team bonding at the local pub.',
      energyCost: 20,
      unlocked: true,
      effects: {
        energy: -20,
        form: -5,
        media: 8,
      },
      metadata: {
        teammateEvent: 'night-out',
      },
    });
  }
  
  // Bus gambling (higher-lower cards)
  if (isActivityUnlocked('teammate', 'teammate-gambling', player) && Math.random() > 0.6) {
    activities.push({
      id: 'teammate-gambling',
      category: 'teammate',
      title: 'Bus Gambling',
      description: 'Higher-lower card game with the team. £50 stake.',
      energyCost: 5,
      unlocked: true,
      effects: {
        energy: -5,
      },
      metadata: {
        teammateEvent: 'gambling',
        itemCost: 50,
      },
    });
  }
  
  // Captain's BBQ (story event)
  if (Math.random() > 0.85 && phase === 'early-season') {
    activities.push({
      id: 'teammate-bbq',
      category: 'teammate',
      title: "Captain's BBQ",
      description: 'Team social at the captain\'s house.',
      energyCost: 10,
      unlocked: true,
      effects: {
        energy: -10,
        trust: 5,
      },
      metadata: {
        teammateEvent: 'bbq',
      },
    });
  }
  
  return activities;
}

// Generate shopping activities
function generateShoppingActivities(player: Player): ActivityOption[] {
  const activities: ActivityOption[] = [];
  
  // New kit
  if (Math.random() > 0.6 && player.money >= 200 && !player.recentPurchases.includes('kit')) {
    activities.push({
      id: 'shop-kit',
      category: 'shopping',
      title: 'Buy New Kit',
      description: 'Fresh boots and training gear. £200',
      energyCost: 5,
      unlocked: isActivityUnlocked('shopping', 'shop-kit', player),
      effects: {
        energy: -5,
        media: 5,
        money: -200,
      },
      metadata: {
        itemCost: 200,
      },
    });
  }
  
  // Car upgrade
  if (Math.random() > 0.7 && player.money >= 2000 && !player.recentPurchases.includes('car')) {
    activities.push({
      id: 'shop-car',
      category: 'shopping',
      title: 'Upgrade Your Car',
      description: 'Nicer wheels for match day. £2000',
      energyCost: 10,
      unlocked: isActivityUnlocked('shopping', 'shop-car', player),
      effects: {
        energy: -10,
        media: 15,
        partnerMood: 10,
        money: -2000,
      },
      metadata: {
        itemCost: 2000,
      },
    });
  }
  
  // Luxury watch
  if (Math.random() > 0.8 && player.money >= 5000) {
    activities.push({
      id: 'shop-luxury',
      category: 'shopping',
      title: 'Luxury Watch',
      description: 'Statement piece. £5000',
      energyCost: 5,
      unlocked: isActivityUnlocked('shopping', 'shop-luxury', player),
      effects: {
        energy: -5,
        media: 25,
        money: -5000,
      },
      metadata: {
        itemCost: 5000,
      },
    });
  }
  
  return activities.filter(a => a.unlocked && player.money >= (a.metadata?.itemCost || 0));
}

// Generate media/sponsorship activities
function generateMediaActivities(player: Player, phase: SeasonPhase): ActivityOption[] {
  const activities: ActivityOption[] = [];
  
  // Basic interview
  if (Math.random() > 0.5) {
    activities.push({
      id: 'media-interview',
      category: 'media',
      title: 'Press Interview',
      description: 'Quick word with local press.',
      energyCost: 10,
      unlocked: isActivityUnlocked('media', 'media-interview', player),
      effects: {
        energy: -10,
        media: 15,
        trust: -2,
      },
    });
  }
  
  // Sponsorship meet
  if (isActivityUnlocked('media', 'media-sponsorship', player) && Math.random() > 0.7) {
    activities.push({
      id: 'media-sponsorship',
      category: 'media',
      title: 'Sponsorship Meeting',
      description: 'Potential boot deal. £500 signing bonus.',
      energyCost: 15,
      unlocked: true,
      effects: {
        energy: -15,
        media: 20,
        money: 500,
      },
    });
  }
  
  return activities.filter(a => a.unlocked);
}

// Generate manager/agent activities
function generateManagerAgentActivities(player: Player, phase: SeasonPhase): ActivityOption[] {
  const activities: ActivityOption[] = [];
  
  // Manager meeting (if form/trust low)
  if (player.form < 40 || player.managerRating < 40) {
    if (Math.random() > 0.7) {
      activities.push({
        id: 'manager-meeting',
        category: 'manager',
        title: 'Manager Meeting',
        description: 'Boss wants a word about your form.',
        energyCost: 10,
        unlocked: true,
        effects: {
          energy: -10,
          trust: 10,
        },
      });
    }
  }
  
  // Agent call (transfer window or contract)
  if (phase === 'summer' && Math.random() > 0.6) {
    activities.push({
      id: 'agent-call',
      category: 'agent',
      title: 'Agent Call',
      description: 'Your agent has news about interest.',
      energyCost: 5,
      unlocked: true,
      effects: {
        energy: -5,
        media: 10,
      },
    });
  }
  
  return activities;
}

// Generate story cards (light, 1-2 per week max)
function generateStoryCards(player: Player, weekNumber: number): ActivityOption[] {
  // Only generate story cards occasionally
  if (Math.random() > 0.85) return [];
  
  const activities: ActivityOption[] = [];
  const stories = [
    {
      id: 'story-tabloid',
      title: 'Tabloid Offer',
      description: 'Gossip rag wants an exclusive. £200 but media circus.',
      effects: { energy: -5, media: 30, money: 200, trust: -10 },
    },
    {
      id: 'story-family',
      title: 'Family Visit',
      description: 'Mum and dad want to see your next match.',
      effects: { energy: -5, form: 5 },
    },
    {
      id: 'story-charity',
      title: 'Charity Event',
      description: 'Local hospital charity game. Good PR.',
      effects: { energy: -15, media: 20, trust: 5 },
    },
  ];
  
  const story = stories[Math.floor(Math.random() * stories.length)];
  
  activities.push({
    ...story,
    category: 'story',
    energyCost: Math.abs(story.effects.energy),
    unlocked: true,
    effects: story.effects,
  });
  
  return activities;
}

// Main function: Generate 2-4 activity invitations for a free day
export function generateDayActivities(
  player: Player,
  partner: Partner | null,
  teammates: Teammate[],
  seasonPhase: SeasonPhase,
  weekNumber: number
): ActivityOption[] {
  const allActivities: ActivityOption[] = [];
  
  // Always generate training options
  const trainingOptions = generateTrainingActivities(player, seasonPhase);
  allActivities.push(...trainingOptions.slice(0, 2)); // Max 2 training variants per day
  
  // Generate other categories (weighted by phase and player state)
  if (partner) {
    const partnerOptions = generatePartnerActivities(partner, player);
    if (partnerOptions.length > 0 && Math.random() > 0.4) {
      allActivities.push(partnerOptions[0]);
    }
  }
  
  const teammateOptions = generateTeammateActivities(teammates, player, seasonPhase);
  if (teammateOptions.length > 0 && Math.random() > 0.5) {
    allActivities.push(teammateOptions[0]);
  }
  
  const shoppingOptions = generateShoppingActivities(player);
  if (shoppingOptions.length > 0 && Math.random() > 0.6) {
    allActivities.push(shoppingOptions[0]);
  }
  
  const mediaOptions = generateMediaActivities(player, seasonPhase);
  if (mediaOptions.length > 0 && Math.random() > 0.5) {
    allActivities.push(mediaOptions[0]);
  }
  
  const managerAgentOptions = generateManagerAgentActivities(player, seasonPhase);
  if (managerAgentOptions.length > 0) {
    allActivities.push(...managerAgentOptions);
  }
  
  const storyOptions = generateStoryCards(player, weekNumber);
  if (storyOptions.length > 0) {
    allActivities.push(...storyOptions);
  }
  
  // Shuffle and return 2-4 activities
  const shuffled = allActivities.sort(() => Math.random() - 0.5);
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 activities
  
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Always-available Rest option
export function getRestActivity(): ActivityOption {
  return {
    id: 'rest',
    category: 'rest',
    title: 'Rest',
    description: 'Take it easy and recover energy.',
    energyCost: 0,
    unlocked: true,
    effects: {
      energy: 30,
    },
  };
}
