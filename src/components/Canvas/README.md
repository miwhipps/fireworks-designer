# Fireworks Particle System

A React Three Fiber-based particle system for rendering realistic fireworks effects.

## Components

### ParticleSystem.jsx
Main component that orchestrates different firework effects based on type.

**Props:**
- `type`: Firework type ('burst', 'fountain', 'spiral', 'willow')
- `color`: Hex color string (e.g., '#ff4444')
- `position`: 3D position array [x, y, z]
- `startTime`: When the effect starts (seconds)
- `currentTime`: Current animation time (seconds)
- `isActive`: Whether to render particles

### FireworksCanvas.jsx
Example integration component showing how to use the particle system with timeline data.

## Effects

### BurstEffect
- **Particles**: 150 particles exploding outward in sphere pattern
- **Duration**: 2 seconds
- **Visual**: Classic firework explosion

### FountainEffect
- **Particles**: 25 particles per second, continuous spawn
- **Duration**: 4 seconds (based on timeline)
- **Visual**: Particles shooting upward then falling with gravity

### SpiralEffect
- **Particles**: 120 particles following helical paths
- **Duration**: 3 seconds
- **Visual**: Spiral pattern around central axis

### WillowEffect
- **Particles**: 100 particles with drooping behavior
- **Duration**: 3.5 seconds
- **Visual**: Weeping willow tree effect

## Performance

- Uses buffer geometry for efficient rendering
- Particle pooling to reduce memory allocation
- Target: 500+ particles at 60fps
- Additive blending for realistic glow effects

## Usage Example

```javascript
import { Canvas } from '@react-three/fiber';
import ParticleSystem from './Canvas/ParticleSystem';

function App() {
  const fireworks = [
    {
      id: 'fw-1',
      type: 'burst',
      color: '#ff4444',
      position: { x: 400, y: 300 },
      startTime: 2.0,
      duration: 2.0
    }
  ];

  return (
    <Canvas>
      {fireworks.map(fw => (
        <ParticleSystem
          key={fw.id}
          type={fw.type}
          color={fw.color}
          position={[fw.position.x/20, fw.position.y/20, 0]}
          startTime={fw.startTime}
          currentTime={currentTime}
          isActive={currentTime >= fw.startTime && currentTime <= fw.startTime + fw.duration}
        />
      ))}
    </Canvas>
  );
}
```

## Physics

- Gravity: -9.8 m/s²
- Realistic velocity and acceleration
- Particle lifetime management
- Alpha fading based on age

## File Structure

```
src/components/Canvas/
├── ParticleSystem.jsx          # Main orchestrator
├── FireworksCanvas.jsx         # Integration example
├── effects/
│   ├── BurstEffect.jsx         # Sphere explosion
│   ├── FountainEffect.jsx      # Upward spray
│   ├── SpiralEffect.jsx        # Helical pattern
│   └── WillowEffect.jsx        # Drooping effect
└── utils/
    └── particlePhysics.js      # Physics calculations
```