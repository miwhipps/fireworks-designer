const GRAVITY = -9.8;

export const createParticle = (position, velocity, color, life = 1.0, size = 1.0) => ({
  position: [...position],
  velocity: [...velocity],
  color,
  life,
  maxLife: life,
  size,
  age: 0,
  isAlive: true
});

export const updateParticle = (particle, deltaTime) => {
  if (!particle.isAlive) return false;
  
  particle.age += deltaTime;
  particle.life = Math.max(0, particle.maxLife - particle.age);
  
  if (particle.life <= 0) {
    particle.isAlive = false;
    return false;
  }
  
  particle.velocity[1] += GRAVITY * deltaTime;
  
  particle.position[0] += particle.velocity[0] * deltaTime;
  particle.position[1] += particle.velocity[1] * deltaTime;
  particle.position[2] += particle.velocity[2] * deltaTime;
  
  return true;
};

export const updateParticleSystem = (particles, deltaTime) => {
  return particles.filter(particle => updateParticle(particle, deltaTime));
};

export const generateRandomDirection = () => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  ];
};

export const generateRandomInCone = (coneAngle = Math.PI / 4) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * coneAngle;
  
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ];
};

export const lerpColor = (color1, color2, t) => {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const getParticleAlpha = (particle) => {
  return Math.max(0, particle.life / particle.maxLife);
};

// Enhanced alpha calculation with realistic firework fade curves
export const getRealisticParticleAlpha = (particle, effectType = 'burst') => {
  const lifeRatio = Math.max(0, particle.life / particle.maxLife);
  
  switch (effectType) {
    case 'burst':
      // Bright start, dramatic fade at end (exponential)
      return Math.pow(lifeRatio, 0.6);
      
    case 'fountain':
      // Sustained brightness, smoother fade
      return Math.pow(lifeRatio, 0.8);
      
    case 'spiral':
      // Bright trails with smooth fade
      return Math.pow(lifeRatio, 0.7);
      
    case 'willow':
      // Start bright, gradual fade with slight acceleration at end
      return lifeRatio > 0.3 ? Math.pow(lifeRatio, 0.5) : Math.pow(lifeRatio, 1.2);
      
    default:
      return lifeRatio;
  }
};

// Calculate brightness multiplier based on camera distance (zoom level)
export const getZoomBrightnessMultiplier = (cameraDistance, minDistance = 10, maxDistance = 500) => {
  // Normalize distance to 0-1 range
  const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - minDistance) / (maxDistance - minDistance)));
  
  // Apply very aggressive brightness curve for extreme distances
  // Use exponential curve for dramatic visibility at far viewing distances
  return 1 + Math.pow(normalizedDistance, 0.3) * 19; // 1x to 20x brightness multiplier
};

// Color fade that mimics real firework cooling with zoom-based brightness
export const getFireworkColor = (baseColor, alpha, effectType = 'burst', brightnessMultiplier = 1) => {
  const r = parseInt(baseColor.slice(1, 3), 16) / 255;
  const g = parseInt(baseColor.slice(3, 5), 16) / 255;
  const b = parseInt(baseColor.slice(5, 7), 16) / 255;
  
  // As particles fade, they often shift toward warmer/cooler colors
  let finalR = r, finalG = g, finalB = b;
  
  if (effectType === 'burst' || effectType === 'willow') {
    // Burst and willow particles fade to orange/red as they cool
    const coolFactor = 1 - alpha;
    finalR = Math.min(1, r + coolFactor * 0.3);
    finalG = Math.max(0, g - coolFactor * 0.2);
    finalB = Math.max(0, b - coolFactor * 0.4);
  }
  
  // Apply brightness multiplier and clamp to valid range
  const brightenedAlpha = Math.min(1, alpha * brightnessMultiplier);
  return [
    Math.min(1, finalR * brightenedAlpha),
    Math.min(1, finalG * brightenedAlpha),
    Math.min(1, finalB * brightenedAlpha)
  ];
};