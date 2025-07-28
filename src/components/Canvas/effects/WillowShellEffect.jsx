import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 70; // 6-inch willow shell
const STAR_BURN_TIME = 4.0;

const WillowShellEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();

  // Create willow star pattern
  const { positions, velocities, starColors, starMasses } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const velocities = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    const starMasses = new Float32Array(STAR_COUNT); // Willow stars have variable mass

    // Willow color (typically silver, gold, or green)
    const willowColor = new THREE.Color(colors[0] || '#c0c0c0');

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      
      // Willow distribution - more concentrated in upper hemisphere
      const phi = Math.acos(Math.random()); // Bias toward upper hemisphere
      const theta = 2 * Math.PI * Math.random();
      
      // Slower initial velocity for willow effect
      const speed = 6 + Math.random() * 2.5; // Slower than typical shells
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.cos(phi);
      velocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      // Variable star mass for realistic drooping
      starMasses[i] = 0.8 + Math.random() * 0.4; // 0.8-1.2x normal mass
      
      starColors[i3] = willowColor.r;
      starColors[i3 + 1] = willowColor.g;
      starColors[i3 + 2] = willowColor.b;
    }

    return { positions, velocities, starColors, starMasses };
  }, [position, colors]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const elapsed = currentTime - startTime;
    if (elapsed < 0 || elapsed > STAR_BURN_TIME) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const colorAttribute = pointsRef.current.geometry.attributes.color;

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      
      // Willow physics - heavy stars with strong air resistance
      const gravity = 9.8;
      const baseDrag = 0.95; // Heavier air resistance
      const massEffect = starMasses[i]; // Heavier stars fall faster
      
      // Mass affects both drag and gravity
      const dragFactor = Math.pow(baseDrag, elapsed * 6 * massEffect);
      const gravityEffect = gravity * massEffect;
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravityEffect * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Willow burn characteristics - slower fade for heavier stars
      const burnProgress = elapsed / STAR_BURN_TIME;
      const massAdjustedBurn = burnProgress / massEffect; // Heavier stars burn longer
      const alpha = Math.max(0, 1 - massAdjustedBurn);
      
      // Slight color variation for realism
      const starVariation = 0.8 + (i % 15) * 0.02;
      const intensity = alpha * starVariation;
      
      colorAttribute.array[i3] = starColors[i3] * intensity;
      colorAttribute.array[i3 + 1] = starColors[i3 + 1] * intensity;
      colorAttribute.array[i3 + 2] = starColors[i3 + 2] * intensity;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={STAR_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={STAR_COUNT}
          array={starColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.7}
        vertexColors={true}
        transparent={true}
        opacity={0.85}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default WillowShellEffect;