import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 125;
const LIFE_DURATION = 2.5;

const StrobeEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();
  const materialRef = useRef();

  // Create strobing particles with different frequencies
  const { positions, velocities, particleColors, strobeFreqs } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const strobeFreqs = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Sphere distribution for strobe particles
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const speed = 3 + Math.random() * 5; // Slower, more realistic speeds
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.cos(phi);
      velocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      
      // Start at explosion center
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      // Assign random strobe frequency (6-12 Hz for more realistic rapid flashing)
      strobeFreqs[i] = 6 + Math.random() * 6;
      
      // Cycle through strobe colors
      const colorIndex = i % colors.length;
      const color = new THREE.Color(colors[colorIndex]);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    return { positions, velocities, particleColors, strobeFreqs };
  }, [position, colors]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const elapsed = currentTime - startTime;
    if (elapsed < 0 || elapsed > LIFE_DURATION) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const colorAttribute = pointsRef.current.geometry.attributes.color;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Update positions with realistic physics
      const airResistance = 0.97;
      const gravity = 9.8;
      const dragFactor = Math.pow(airResistance, elapsed * 6);
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // More realistic strobing - sharp on/off instead of sinusoidal
      const strobePhase = (elapsed * strobeFreqs[i]) % 1;
      const isOn = strobePhase < 0.3; // On for 30% of cycle, off for 70%
      const intensity = isOn ? 1.0 : 0.0;
      
      // Base life fade
      const life = elapsed / LIFE_DURATION;
      const alpha = Math.max(0, 1 - life) * intensity;
      
      colorAttribute.array[i3] = particleColors[i3] * alpha;
      colorAttribute.array[i3 + 1] = particleColors[i3 + 1] * alpha;
      colorAttribute.array[i3 + 2] = particleColors[i3 + 2] * alpha;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={particleColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.7}
        vertexColors={true}
        transparent={true}
        opacity={0.9}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default StrobeEffect;