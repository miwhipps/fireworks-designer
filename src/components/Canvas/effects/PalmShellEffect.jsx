import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TRAIL_COUNT = 30; // 8-inch palm shell - fewer but thicker trails
const PARTICLES_PER_TRAIL = 20; // Thick particle trails
const RISING_PHASE = 1.5; // seconds
const FALLING_PHASE = 3.5; // seconds
const TOTAL_DURATION = 6.0;

const PalmShellEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();

  // Create palm trail pattern
  const { positions, velocities, particleColors, trailData } = useMemo(() => {
    const totalParticles = TRAIL_COUNT * PARTICLES_PER_TRAIL;
    const positions = new Float32Array(totalParticles * 3);
    const velocities = new Float32Array(totalParticles * 3);
    const particleColors = new Float32Array(totalParticles * 3);
    const trailData = new Float32Array(totalParticles * 2); // [trailId, particleIndex]

    // Palm colors (golden)
    const palmGold = new THREE.Color(colors[0] || '#ffd700');
    const darkGold = new THREE.Color('#ffaa00');

    for (let trail = 0; trail < TRAIL_COUNT; trail++) {
      // Each trail has a fan-like direction (palm frond pattern)
      const angle = (trail / TRAIL_COUNT) * Math.PI * 2;
      const elevation = Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 8; // 45° ± 22.5°
      const trailSpeed = 10 + Math.random() * 4; // 8-inch shell velocity
      
      const baseVelX = trailSpeed * Math.cos(elevation) * Math.cos(angle);
      const baseVelY = trailSpeed * Math.sin(elevation);
      const baseVelZ = trailSpeed * Math.cos(elevation) * Math.sin(angle);

      for (let particle = 0; particle < PARTICLES_PER_TRAIL; particle++) {
        const particleIndex = trail * PARTICLES_PER_TRAIL + particle;
        const i3 = particleIndex * 3;
        
        // Particles within each trail have slight variation
        const particleVariation = (Math.random() - 0.5) * 0.3;
        const speedVariation = 0.8 + Math.random() * 0.4;
        
        velocities[i3] = baseVelX * speedVariation + particleVariation;
        velocities[i3 + 1] = baseVelY * speedVariation + particleVariation;
        velocities[i3 + 2] = baseVelZ * speedVariation + particleVariation;
        
        positions[i3] = position[0];
        positions[i3 + 1] = position[1];
        positions[i3 + 2] = position[2];
        
        // Color gradient from gold to darker gold
        const colorMix = particle / PARTICLES_PER_TRAIL;
        const color = palmGold.clone().lerp(darkGold, colorMix);
        
        particleColors[i3] = color.r;
        particleColors[i3 + 1] = color.g;
        particleColors[i3 + 2] = color.b;
        
        // Store trail info for later use
        trailData[particleIndex * 2] = trail;
        trailData[particleIndex * 2 + 1] = particle;
      }
    }

    return { positions, velocities, particleColors, trailData };
  }, [position, colors]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const elapsed = currentTime - startTime;
    if (elapsed < 0 || elapsed > TOTAL_DURATION) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const colorAttribute = pointsRef.current.geometry.attributes.color;

    for (let i = 0; i < TRAIL_COUNT * PARTICLES_PER_TRAIL; i++) {
      const i3 = i * 3;
      
      // Palm physics - thick trails with strong air resistance
      const gravity = 9.8;
      const airResistance = 0.96; // Strong air resistance for thick trails
      
      let phase, phaseElapsed, dragFactor, alpha;
      
      if (elapsed <= RISING_PHASE) {
        // Rising phase - trails shoot upward
        phase = 'rising';
        phaseElapsed = elapsed;
        dragFactor = Math.pow(airResistance, phaseElapsed * 3);
        alpha = 1.0; // Full brightness
      } else {
        // Falling phase - trails cascade down
        phase = 'falling';
        phaseElapsed = elapsed - RISING_PHASE;
        dragFactor = Math.pow(airResistance, RISING_PHASE * 3 + phaseElapsed * 8);
        
        // Fade during falling phase
        const fallProgress = phaseElapsed / FALLING_PHASE;
        alpha = Math.max(0, 1 - fallProgress);
      }
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Enhanced brightness for golden palm effect
      const brightness = phase === 'rising' ? 1.2 : 1.0 - (phaseElapsed / FALLING_PHASE) * 0.3;
      const intensity = alpha * brightness;
      
      colorAttribute.array[i3] = particleColors[i3] * intensity;
      colorAttribute.array[i3 + 1] = particleColors[i3 + 1] * intensity;
      colorAttribute.array[i3 + 2] = particleColors[i3 + 2] * intensity;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TRAIL_COUNT * PARTICLES_PER_TRAIL}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={TRAIL_COUNT * PARTICLES_PER_TRAIL}
          array={particleColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        vertexColors={true}
        transparent={true}
        opacity={0.9}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default PalmShellEffect;