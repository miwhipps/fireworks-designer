// Physics calculations for realistic firework launch trajectories

// Trail configurations for different firework types
export const trailConfigs = {
  // Original firework trails - dimmed and narrowed
  burst: { 
    launchTime: 0.8,     // seconds before explosion
    color: '#ffaa44',    // dimmer orange-white trail
    thickness: 0.8,      // much thinner line
    arc: 'high',         // high parabolic arc
    intensity: 0.09      // 20% brighter trail brightness
  },
  fountain: { 
    launchTime: 0.3,     // shorter launch (ground effect)
    color: '#ff6600',    // dimmer orange trail
    thickness: 0.6,
    arc: 'low',          // low arc or straight up
    intensity: 0.072     // 20% brighter
  },
  spiral: { 
    launchTime: 1.0,     // longer launch time
    color: '#4488ff',    // dimmer blue trail
    thickness: 0.9,
    arc: 'corkscrew',    // spiral trajectory
    intensity: 0.108     // 20% brighter
  },
  willow: { 
    launchTime: 0.9,
    color: '#ffcc44',    // dimmer yellow trail
    thickness: 0.8,
    arc: 'high',
    intensity: 0.09     // 20% brighter
  },
  
  // New multi-color firework trails - dimmed and narrowed
  chrysanthemum: { 
    launchTime: 1.2, 
    color: '#ffd23f', 
    thickness: 1.2, 
    arc: 'high',
    intensity: 0.12     // 20% brighter
  },
  crossette: { 
    launchTime: 0.9, 
    color: '#e91e63', 
    thickness: 1.0, 
    arc: 'medium',
    intensity: 0.108    // 20% brighter
  },
  palmtree: { 
    launchTime: 1.0, 
    color: '#ffd700', 
    thickness: 0.9, 
    arc: 'high',
    intensity: 0.09     // 20% brighter
  },
  strobe: { 
    launchTime: 0.7, 
    color: '#ffffff', 
    thickness: 0.8, 
    arc: 'medium',
    intensity: 0.072    // 20% brighter
  },
  ring: { 
    launchTime: 0.8, 
    color: '#8a2be2', 
    thickness: 1.0, 
    arc: 'medium',
    intensity: 0.108    // 20% brighter
  },
  
  // Professional shell trails - dimmed and narrowed
  peony_4inch: { 
    launchTime: 2.8, 
    color: '#ffd700', 
    thickness: 1.0, 
    arc: 'high',
    intensity: 0.12     // 20% brighter
  },
  chrysanthemum_6inch: { 
    launchTime: 3.8, 
    color: '#ffd700', 
    thickness: 1.2, 
    arc: 'high',
    intensity: 0.132    // 20% brighter
  },
  willow_6inch: { 
    launchTime: 3.8, 
    color: '#c0c0c0', 
    thickness: 1.1, 
    arc: 'medium',
    intensity: 0.12     // 20% brighter
  },
  palm_8inch: { 
    launchTime: 4.8, 
    color: '#ffd700', 
    thickness: 1.4, 
    arc: 'high',
    intensity: 0.15     // 20% brighter
  },
  crossette_6inch: { 
    launchTime: 3.8, 
    color: '#aa2eaa', 
    thickness: 1.1, 
    arc: 'medium',
    intensity: 0.126    // 20% brighter
  },
  kamuro_8inch: { 
    launchTime: 4.8, 
    color: '#ffd700', 
    thickness: 1.3, 
    arc: 'medium',
    intensity: 0.144    // 20% brighter
  }
};

// Linear interpolation helper
const lerp = (start, end, t) => start + (end - start) * t;

// Parabolic Y calculation with different arc types
const parabolicY = (startY, endY, t, arcType) => {
  const baseHeight = lerp(startY, endY, t);
  
  switch (arcType) {
    case 'high':
      // High arc - peaks at 60% of flight
      const highPeak = Math.max(endY * 1.3, endY + 5);
      const highParabola = -4 * (t - 0.6) * (t - 0.6) + 1;
      return baseHeight + (highPeak - baseHeight) * Math.max(0, highParabola);
      
    case 'medium':
      // Medium arc - moderate curve
      const mediumPeak = Math.max(endY * 1.15, endY + 3);
      const mediumParabola = -4 * (t - 0.5) * (t - 0.5) + 1;
      return baseHeight + (mediumPeak - baseHeight) * Math.max(0, mediumParabola * 0.7);
      
    case 'low':
      // Low arc - minimal curve, mostly straight up
      const lowPeak = endY + 1;
      const lowParabola = -4 * (t - 0.5) * (t - 0.5) + 1;
      return baseHeight + (lowPeak - baseHeight) * Math.max(0, lowParabola * 0.3);
      
    case 'corkscrew':
      // Spiral trajectory with vertical component
      const spiralPeak = Math.max(endY * 1.2, endY + 3);
      const spiralParabola = -4 * (t - 0.5) * (t - 0.5) + 1;
      return baseHeight + (spiralPeak - baseHeight) * Math.max(0, spiralParabola);
      
    default:
      return baseHeight;
  }
};

// Calculate realistic parabolic arc trajectory
export const calculateTrajectory = (start, end, arcType = 'high', segments = 50) => {
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    
    let x, y, z;
    
    if (arcType === 'corkscrew') {
      // Spiral trajectory for spiral fireworks
      const spiralRadius = 0.5;
      const spiralTurns = 2;
      const angle = t * spiralTurns * Math.PI * 2;
      
      x = lerp(start[0], end[0], t) + Math.cos(angle) * spiralRadius * (1 - t);
      z = lerp(start[2], end[2], t) + Math.sin(angle) * spiralRadius * (1 - t);
      y = parabolicY(start[1], end[1], t, arcType);
    } else {
      // Standard parabolic trajectory
      x = lerp(start[0], end[0], t);
      z = lerp(start[2], end[2], t);
      y = parabolicY(start[1], end[1], t, arcType);
    }
    
    points.push([x, y, z]);
  }
  
  return points;
};

// Get trail progress based on current time
export const getTrailProgress = (currentTime, launchStartTime, launchDuration) => {
  if (currentTime < launchStartTime) return 0;
  const elapsed = currentTime - launchStartTime;
  return Math.max(0, Math.min(1, elapsed / launchDuration));
};

// Calculate visible portion of trail based on progress
export const getVisibleTrailPoints = (allPoints, progress) => {
  if (progress <= 0) return [];
  
  const visibleCount = Math.floor(allPoints.length * progress);
  return allPoints.slice(0, Math.max(1, visibleCount));
};

// Get ground launch position from firework position
export const getGroundLaunchPosition = (fireworkPosition, fireworkId) => {
  // Use firework ID to create consistent but varied launch positions
  // This ensures the same firework always has the same launch position
  const hash = fireworkId ? hashString(fireworkId) : 0;
  const offsetX = ((hash % 200) - 100) / 50; // Range: -2 to 2
  const offsetZ = (((hash * 7) % 200) - 100) / 50; // Range: -2 to 2
  
  return [
    fireworkPosition[0] + offsetX,
    -5, // Ground level (below the grid)
    fireworkPosition[2] + offsetZ
  ];
};

// Simple hash function for consistent random-like values
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Calculate launch angle for display/debugging
export const calculateLaunchAngle = (start, end) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return Math.atan2(dy, distance) * (180 / Math.PI);
};