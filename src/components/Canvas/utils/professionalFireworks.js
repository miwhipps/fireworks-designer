// Professional Fireworks: Industry-standard specifications and authentic chemistry

// Authentic firework colors based on real pyrotechnic chemistry
export const authenticColors = {
  // Metal salts produce these exact colors in real fireworks
  red: '#ff2e2e',      // Strontium compounds
  green: '#2eaa2e',    // Barium compounds  
  blue: '#2e2eff',     // Copper compounds
  yellow: '#ffff2e',   // Sodium compounds
  orange: '#ff8c2e',   // Calcium compounds  
  purple: '#aa2eaa',   // Strontium + Copper mix
  white: '#ffffff',    // Magnesium/aluminum
  gold: '#ffd700',     // Iron/charcoal
  silver: '#c0c0c0',   // Aluminum/titanium
};

// Professional shell physics specifications
export const shellPhysics = {
  // Real-world shell velocities (scaled for display)
  launchVelocity: {
    '4inch': 12,  // Scaled from 65 fps
    '6inch': 16,  // Scaled from 85 fps
    '8inch': 20   // Scaled from 105 fps
  },
  
  // Time to apogee (break point)
  timeToBreak: {
    '4inch': 2.8,
    '6inch': 3.8, 
    '8inch': 4.8
  },
  
  // Environmental factors
  gravity: 9.8,
  airDensity: 1.225,
  dragCoefficient: 0.47,
  
  // Star characteristics
  starMass: 0.01,
  burnRate: 'linear',
  terminalVelocity: 15
};

// Professional shell specifications
export const professionalShells = {
  peony_4inch: {
    id: 'peony_4inch',
    name: '4" Peony Shell', 
    shellSize: '4inch',
    breakHeight: 40,
    breakDiameter: 40,
    duration: 3.5,
    starCount: 55,
    starBurnTime: 2.8,
    colors: [
      authenticColors.red,
      authenticColors.green, 
      authenticColors.blue,
      authenticColors.yellow,
      authenticColors.orange,
      authenticColors.purple,
      authenticColors.white
    ],
    physics: {
      initialVelocity: 8.5,
      gravity: -9.8,
      airResistance: 0.98,
      starSpread: 'spherical_uniform'
    },
    safetyDistance: 100,
    type: 'peony'
  },

  chrysanthemum_6inch: {
    id: 'chrysanthemum_6inch',
    name: '6" Chrysanthemum',
    shellSize: '6inch', 
    breakHeight: 60,
    breakDiameter: 60,
    duration: 4.5,
    starCount: 90,
    starBurnTime: 3.5,
    trailCount: 15, // sparks per star
    colors: [
      authenticColors.gold,
      authenticColors.silver,
      authenticColors.red,
      authenticColors.green
    ],
    physics: {
      initialVelocity: 10,
      gravity: -9.8,
      airResistance: 0.97,
      starSpread: 'spherical_uniform',
      trailPhysics: true
    },
    safetyDistance: 150,
    type: 'chrysanthemum'
  },

  willow_6inch: {
    id: 'willow_6inch',
    name: '6" Silver Willow',
    shellSize: '6inch',
    breakHeight: 60, 
    breakDiameter: 50,
    duration: 5.0,
    starCount: 70,
    starBurnTime: 4.0,
    colors: [
      authenticColors.silver,
      authenticColors.gold,
      authenticColors.green
    ],
    physics: {
      initialVelocity: 7, // Slower for drooping effect
      gravity: -9.8,
      airResistance: 0.95, // Heavier stars
      starSpread: 'willow_droop',
      heavyStars: true
    },
    safetyDistance: 150,
    type: 'willow'
  },

  palm_8inch: {
    id: 'palm_8inch',
    name: '8" Golden Palm',
    shellSize: '8inch',
    breakHeight: 75,
    breakDiameter: 70, 
    duration: 6.0,
    starCount: 30, // Fewer but thicker trails
    starBurnTime: 5.0,
    colors: [
      authenticColors.gold,
      '#ffaa00' // Darker gold
    ],
    physics: {
      initialVelocity: 12,
      gravity: -9.8,
      airResistance: 0.96,
      starSpread: 'palm_rising',
      thickTrails: true,
      risingPhase: 1.5,
      fallingPhase: 3.5
    },
    safetyDistance: 200,
    type: 'palm'
  },

  crossette_6inch: {
    id: 'crossette_6inch', 
    name: '6" Purple Crossette',
    shellSize: '6inch',
    breakHeight: 60,
    breakDiameter: 80, // Wider due to secondary breaks
    duration: 5.5,
    starCount: 45,
    starBurnTime: 2.0, // Primary stars
    secondaryStars: 4, // Per primary star
    secondaryBurnTime: 1.5,
    breakDelay: 1.5, // When secondaries activate
    colors: [
      authenticColors.purple,
      authenticColors.white // Secondary color
    ],
    physics: {
      initialVelocity: 9,
      gravity: -9.8,
      airResistance: 0.97,
      starSpread: 'spherical_uniform',
      secondaryBreak: true
    },
    safetyDistance: 150,
    type: 'crossette'
  },

  kamuro_8inch: {
    id: 'kamuro_8inch',
    name: '8" Kamuro Crown',
    shellSize: '8inch',
    breakHeight: 75,
    breakDiameter: 60,
    duration: 4.5,
    starCount: 250, // Dense crackling particles
    starBurnTime: 4.0,
    colors: [
      authenticColors.gold,
      authenticColors.white
    ],
    physics: {
      initialVelocity: 6, // Slower dome effect
      gravity: -9.8, 
      airResistance: 0.94, // Heavy crackling particles
      starSpread: 'dome_crown',
      cracklingEffect: true
    },
    safetyDistance: 200,
    type: 'kamuro'
  }
};

// Professional safety specifications
export const safetySpecs = {
  minimumDistances: {
    '4inch': 100, // meters
    '6inch': 150,
    '8inch': 200
  },
  noiseLevel: 120, // decibels
  falloutRadius: {
    '4inch': 50,
    '6inch': 75, 
    '8inch': 100
  },
  windLimits: 25, // mph maximum
  professionalUseOnly: true
};

// Trail configurations for professional shells
export const professionalTrails = {
  peony_4inch: { 
    launchTime: 2.8, 
    color: authenticColors.gold, 
    thickness: 2.5, 
    arc: 'high',
    intensity: 0.4
  },
  chrysanthemum_6inch: { 
    launchTime: 3.8, 
    color: authenticColors.gold, 
    thickness: 3, 
    arc: 'high',
    intensity: 0.45
  },
  willow_6inch: { 
    launchTime: 3.8, 
    color: authenticColors.silver, 
    thickness: 2.8, 
    arc: 'medium',
    intensity: 0.4
  },
  palm_8inch: { 
    launchTime: 4.8, 
    color: authenticColors.gold, 
    thickness: 3.5, 
    arc: 'high',
    intensity: 0.5
  },
  crossette_6inch: { 
    launchTime: 3.8, 
    color: authenticColors.purple, 
    thickness: 2.8, 
    arc: 'medium',
    intensity: 0.42
  },
  kamuro_8inch: { 
    launchTime: 4.8, 
    color: authenticColors.gold, 
    thickness: 3.2, 
    arc: 'medium',
    intensity: 0.48
  }
};

// Utility function to get shell by ID
export const getShellById = (id) => {
  return professionalShells[id] || professionalShells.peony_4inch;
};

// Utility function to get all shells of a specific size
export const getShellsBySize = (size) => {
  return Object.values(professionalShells).filter(shell => shell.shellSize === size);
};

// Professional naming utility
export const formatShellName = (shell, color = null) => {
  const colorName = color ? getColorName(color) : '';
  return `${shell.shellSize} ${colorName} ${shell.name}`.trim();
};

// Get color name from hex value
export const getColorName = (hex) => {
  const colorEntries = Object.entries(authenticColors);
  const match = colorEntries.find(([name, value]) => value === hex);
  return match ? match[0].charAt(0).toUpperCase() + match[0].slice(1) : '';
};