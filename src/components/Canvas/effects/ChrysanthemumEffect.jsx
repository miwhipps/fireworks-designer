import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 250;
const LIFE_DURATION = 3.5;

const ChrysanthemumEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();
  const materialRef = useRef();

  // Create particles with multi-color gradient based on distance from center
  const { positions, velocities, particleColors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Perfect sphere distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      
      // More realistic speed distribution (slower overall)
      const speed = 5 + Math.random() * 8;
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.cos(phi);
      velocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      
      // Start at explosion center
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      // Assign color based on distance from center (speed determines layer)
      const colorIndex = Math.floor((speed - 5) / 8 * (colors.length - 1));
      const color = new THREE.Color(colors[Math.min(colorIndex, colors.length - 1)]);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    return { positions, velocities, particleColors };
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
      const airResistance = 0.98;
      const gravity = 9.8;
      
      // Apply air resistance over time
      const dragFactor = Math.pow(airResistance, elapsed * 5);
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Color transitions and fading
      const life = elapsed / LIFE_DURATION;
      const alpha = Math.max(0, 1 - life);
      
      // Enhance colors as particles spread
      const colorBoost = 1 + life * 0.5;
      colorAttribute.array[i3] = particleColors[i3] * colorBoost * alpha;
      colorAttribute.array[i3 + 1] = particleColors[i3 + 1] * colorBoost * alpha;
      colorAttribute.array[i3 + 2] = particleColors[i3 + 2] * colorBoost * alpha;
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
        size={0.8}
        vertexColors={true}
        transparent={true}
        opacity={0.7}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ChrysanthemumEffect;