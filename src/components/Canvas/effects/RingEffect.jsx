import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 150;
const LIFE_DURATION = 3.0;

const RingEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();

  // Create perfect ring of particles
  const { positions, velocities, particleColors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Perfect circle in horizontal plane with slight randomization
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const radius = 1; // Starting radius
      const speed = 4 + Math.random() * 1.5; // More realistic slower speeds
      
      // Horizontal ring expansion
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * 1; // Reduced vertical spread for realism
      velocities[i3 + 2] = Math.sin(angle) * speed;
      
      // Start at explosion center
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      // Color gradient around the ring
      const colorIndex = Math.floor((i / PARTICLE_COUNT) * (colors.length - 1));
      const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
      const t = (i / PARTICLE_COUNT) * (colors.length - 1) - colorIndex;
      
      const color1 = new THREE.Color(colors[colorIndex]);
      const color2 = new THREE.Color(colors[nextColorIndex]);
      const color = color1.lerp(color2, t);
      
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
      
      // Ring expansion with realistic air resistance and gravity
      const airResistance = 0.96;
      const gravity = 9.8;
      const dragFactor = Math.pow(airResistance, elapsed * 8);
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Smooth fade out
      const life = elapsed / LIFE_DURATION;
      const alpha = Math.max(0, 1 - life * life);
      
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
        size={0.6}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default RingEffect;