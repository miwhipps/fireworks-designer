import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shellPhysics } from '../utils/professionalFireworks';

const PeonyShellEffect = ({ position, startTime, currentTime, colors, shellSize = '4inch' }) => {
  const pointsRef = useRef();

  // Professional shell specifications
  const specs = useMemo(() => {
    switch (shellSize) {
      case '4inch':
        return { starCount: 55, burnTime: 2.8, velocity: 8.5, diameter: 40 };
      case '6inch':
        return { starCount: 90, burnTime: 3.5, velocity: 10, diameter: 60 };
      case '8inch':
        return { starCount: 120, burnTime: 4.2, velocity: 12, diameter: 75 };
      default:
        return { starCount: 55, burnTime: 2.8, velocity: 8.5, diameter: 40 };
    }
  }, [shellSize]);

  // Create professional star pattern
  const { positions, velocities, starColors } = useMemo(() => {
    const positions = new Float32Array(specs.starCount * 3);
    const velocities = new Float32Array(specs.starCount * 3);
    const starColors = new Float32Array(specs.starCount * 3);

    // Single color for authentic peony shell
    const shellColor = new THREE.Color(colors[0] || '#ff2e2e');

    for (let i = 0; i < specs.starCount; i++) {
      const i3 = i * 3;
      
      // Perfect spherical distribution (industry standard)
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      
      // Professional velocity with 5-8% variation (realistic manufacturing tolerance)
      const velocityVariation = 0.92 + Math.random() * 0.16; // ±8%
      const speed = specs.velocity * velocityVariation;
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.cos(phi);
      velocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      
      // Start at shell break point
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      // Uniform color (authentic peony characteristic)
      starColors[i3] = shellColor.r;
      starColors[i3 + 1] = shellColor.g;
      starColors[i3 + 2] = shellColor.b;
    }

    return { positions, velocities, starColors };
  }, [position, colors, specs]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const elapsed = currentTime - startTime;
    if (elapsed < 0 || elapsed > specs.burnTime) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const colorAttribute = pointsRef.current.geometry.attributes.color;

    for (let i = 0; i < specs.starCount; i++) {
      const i3 = i * 3;
      
      // Professional star physics
      const gravity = shellPhysics.gravity;
      const airResistance = 0.98;
      
      // Air resistance increases over time (realistic)
      const dragFactor = Math.pow(airResistance, elapsed * 4);
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Professional burn characteristics - linear fade (industry standard)
      const burnProgress = elapsed / specs.burnTime;
      const alpha = Math.max(0, 1 - burnProgress);
      
      // Slight intensity variation (realistic star manufacturing)
      const starVariation = 0.85 + (i % 10) * 0.03; // Different stars burn slightly differently
      const intensity = alpha * starVariation;
      
      colorAttribute.array[i3] = starColors[i3] * intensity;
      colorAttribute.array[i3 + 1] = starColors[i3 + 1] * intensity;
      colorAttribute.array[i3 + 2] = starColors[i3 + 2] * intensity;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  // Professional star size based on shell size
  const starSize = shellSize === '8inch' ? 0.9 : shellSize === '6inch' ? 0.7 : 0.6;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={specs.starCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={specs.starCount}
          array={starColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={starSize}
        vertexColors={true}
        transparent={true}
        opacity={0.85}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default PeonyShellEffect;