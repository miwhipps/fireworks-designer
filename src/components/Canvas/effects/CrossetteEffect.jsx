import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PRIMARY_PARTICLES = 40;
const SECONDARY_PARTICLES_PER_BURST = 25;
const SECONDARY_BURSTS = 5;
const BREAK_TIME = 1.0; // More realistic timing for secondary bursts
const LIFE_DURATION = 3.5;

const CrossetteEffect = ({ position, startTime, currentTime, colors }) => {
  const pointsRef = useRef();

  // Create primary particles and secondary burst data
  const { positions, velocities, particleColors, particleTypes, burstData } = useMemo(() => {
    const totalParticles = PRIMARY_PARTICLES + (SECONDARY_BURSTS * SECONDARY_PARTICLES_PER_BURST);
    const positions = new Float32Array(totalParticles * 3);
    const velocities = new Float32Array(totalParticles * 3);
    const particleColors = new Float32Array(totalParticles * 3);
    const particleTypes = new Float32Array(totalParticles); // 0 = primary, 1 = secondary
    const burstData = [];

    let particleIndex = 0;

    // Primary particles
    for (let i = 0; i < PRIMARY_PARTICLES; i++) {
      const i3 = i * 3;
      
      // Random sphere distribution for initial burst
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const speed = 4 + Math.random() * 3; // Slower, more realistic speeds
      
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.cos(phi);
      velocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      particleTypes[i] = 0; // Primary particle
      
      // Primary particles use first color
      const color = new THREE.Color(colors[0]);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
      
      particleIndex++;
    }

    // Create secondary burst locations and particles
    for (let burst = 0; burst < SECONDARY_BURSTS; burst++) {
      // Random position for secondary burst (closer to center for realism)
      const burstPhi = Math.acos(2 * Math.random() - 1);
      const burstTheta = 2 * Math.PI * Math.random();
      const burstDistance = 5 + Math.random() * 3;
      
      const burstPos = [
        position[0] + burstDistance * Math.sin(burstPhi) * Math.cos(burstTheta),
        position[1] + burstDistance * Math.cos(burstPhi),
        position[2] + burstDistance * Math.sin(burstPhi) * Math.sin(burstTheta)
      ];
      
      burstData.push({
        position: burstPos,
        startIndex: particleIndex,
        endIndex: particleIndex + SECONDARY_PARTICLES_PER_BURST
      });

      // Secondary particles for this burst
      for (let i = 0; i < SECONDARY_PARTICLES_PER_BURST; i++) {
        const i3 = particleIndex * 3;
        
        // Smaller burst pattern
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        const speed = 2 + Math.random() * 2; // Slower secondary particles
        
        velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
        velocities[i3 + 1] = speed * Math.cos(phi);
        velocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
        
        // Start at burst position (will be set during animation)
        positions[i3] = burstPos[0];
        positions[i3 + 1] = burstPos[1];
        positions[i3 + 2] = burstPos[2];
        
        particleTypes[particleIndex] = 1; // Secondary particle
        
        // Secondary particles cycle through remaining colors
        const colorIndex = 1 + (burst % (colors.length - 1));
        const color = new THREE.Color(colors[colorIndex]);
        particleColors[i3] = color.r;
        particleColors[i3 + 1] = color.g;
        particleColors[i3 + 2] = color.b;
        
        particleIndex++;
      }
    }

    return { positions, velocities, particleColors, particleTypes, burstData };
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

    // Update primary particles with realistic physics
    for (let i = 0; i < PRIMARY_PARTICLES; i++) {
      const i3 = i * 3;
      
      const airResistance = 0.97;
      const gravity = 9.8;
      const dragFactor = Math.pow(airResistance, elapsed * 5);
      
      const x = position[0] + velocities[i3] * elapsed * dragFactor;
      const y = position[1] + velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
      const z = position[2] + velocities[i3 + 2] * elapsed * dragFactor;

      positionAttribute.array[i3] = x;
      positionAttribute.array[i3 + 1] = y;
      positionAttribute.array[i3 + 2] = z;

      // Primary particles fade out when secondary bursts start
      const life = elapsed / BREAK_TIME;
      const alpha = Math.max(0, 1 - life);
      
      colorAttribute.array[i3] = particleColors[i3] * alpha;
      colorAttribute.array[i3 + 1] = particleColors[i3 + 1] * alpha;
      colorAttribute.array[i3 + 2] = particleColors[i3 + 2] * alpha;
    }

    // Update secondary particles (visible after break time)
    if (elapsed >= BREAK_TIME) {
      const secondaryElapsed = elapsed - BREAK_TIME;
      const secondaryLife = secondaryElapsed / (LIFE_DURATION - BREAK_TIME);
      
      burstData.forEach((burst) => {
        for (let i = burst.startIndex; i < burst.endIndex; i++) {
          const i3 = i * 3;
          
          const airResistance = 0.95;
          const gravity = 9.8;
          const dragFactor = Math.pow(airResistance, secondaryElapsed * 7);
          
          const x = burst.position[0] + velocities[i3] * secondaryElapsed * dragFactor;
          const y = burst.position[1] + velocities[i3 + 1] * secondaryElapsed * dragFactor - 0.5 * gravity * secondaryElapsed * secondaryElapsed;
          const z = burst.position[2] + velocities[i3 + 2] * secondaryElapsed * dragFactor;

          positionAttribute.array[i3] = x;
          positionAttribute.array[i3 + 1] = y;
          positionAttribute.array[i3 + 2] = z;

          const alpha = Math.max(0, 1 - secondaryLife);
          
          colorAttribute.array[i3] = particleColors[i3] * alpha;
          colorAttribute.array[i3 + 1] = particleColors[i3 + 1] * alpha;
          colorAttribute.array[i3 + 2] = particleColors[i3 + 2] * alpha;
        }
      });
    } else {
      // Hide secondary particles before break time
      burstData.forEach((burst) => {
        for (let i = burst.startIndex; i < burst.endIndex; i++) {
          const i3 = i * 3;
          colorAttribute.array[i3] = 0;
          colorAttribute.array[i3 + 1] = 0;
          colorAttribute.array[i3 + 2] = 0;
        }
      });
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleColors.length / 3}
          array={particleColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors={true}
        transparent={true}
        opacity={0.7}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default CrossetteEffect;