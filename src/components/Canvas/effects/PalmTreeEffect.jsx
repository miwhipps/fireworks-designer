import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 100;
const LIFE_DURATION = 5.0;

const PalmTreeEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();

  // Create cascading palm frond particles
  const { positions, velocities, particleColors, trailLengths } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const trailLengths = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Fan pattern shooting upward and outward
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const elevation = Math.PI / 5 + (Math.random() - 0.5) * Math.PI / 10; // 36° ± 18° for realistic palm fronds
      const speed = 6 + Math.random() * 4; // Slower, more realistic launch speeds
      
      velocities[i3] = speed * Math.cos(elevation) * Math.cos(angle);
      velocities[i3 + 1] = speed * Math.sin(elevation);
      velocities[i3 + 2] = speed * Math.cos(elevation) * Math.sin(angle);
      
      // Start at explosion center
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      // Random trail length for variation
      trailLengths[i] = 0.5 + Math.random() * 1.0;
      
      // Color gradient from gold to orange based on angle/distance
      const colorIndex = Math.floor((speed - 6) / 4 * (colors.length - 1));
      const color = new THREE.Color(colors[Math.min(colorIndex, colors.length - 1)]);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    return { positions, velocities, particleColors, trailLengths };
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
      
      // Realistic physics with stronger air resistance for cascading effect
      const airResistance = 0.96; // Stronger air resistance for realistic cascade
      const gravity = 9.8;
      
      // Apply air resistance to all velocity components
      const dragFactor = Math.pow(airResistance, elapsed * 8);
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Color transitions and trail effects
      const life = elapsed / LIFE_DURATION;
      let alpha = 1.0;
      
      // Bright initial phase
      if (life < 0.3) {
        alpha = 1.0;
      }
      // Gradual fade as particles fall
      else {
        alpha = Math.max(0, 1 - (life - 0.3) / 0.7);
      }
      
      // Enhanced brightness for trailing effect
      const brightness = 1.2 - life * 0.4;
      
      colorAttribute.array[i3] = particleColors[i3] * alpha * brightness;
      colorAttribute.array[i3 + 1] = particleColors[i3 + 1] * alpha * brightness;
      colorAttribute.array[i3 + 2] = particleColors[i3 + 2] * alpha * brightness;
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
        size={0.7}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default PalmTreeEffect;