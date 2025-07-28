import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 90;  // 6-inch professional count
const TRAIL_SPARKS_PER_STAR = 15;
const STAR_BURN_TIME = 3.5;
const TRAIL_BURN_TIME = 5.0; // Trails last longer

const ChrysanthemumShellEffect = ({ position, startTime, currentTime, colors }) => {
  const starsRef = useRef();
  const trailsRef = useRef();

  // Create main stars and trailing sparks
  const particleData = useMemo(() => {
    const starPositions = new Float32Array(STAR_COUNT * 3);
    const starVelocities = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    
    const totalTrails = STAR_COUNT * TRAIL_SPARKS_PER_STAR;
    const trailPositions = new Float32Array(totalTrails * 3);
    const trailVelocities = new Float32Array(totalTrails * 3);
    const trailColors = new Float32Array(totalTrails * 3);
    const trailDelays = new Float32Array(totalTrails); // Staggered trail creation

    // Main color (gold or silver typically)
    const mainColor = new THREE.Color(colors[0] || '#ffd700');
    const trailColor = new THREE.Color('#ffffff'); // White/gold trails

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      
      // Professional spherical distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const speed = 9 + Math.random() * 2; // 6-inch shell velocity
      
      starVelocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      starVelocities[i3 + 1] = speed * Math.cos(phi);
      starVelocities[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
      
      starPositions[i3] = position[0];
      starPositions[i3 + 1] = position[1];
      starPositions[i3 + 2] = position[2];
      
      starColors[i3] = mainColor.r;
      starColors[i3 + 1] = mainColor.g;
      starColors[i3 + 2] = mainColor.b;

      // Create trailing sparks for this star
      for (let j = 0; j < TRAIL_SPARKS_PER_STAR; j++) {
        const trailIndex = i * TRAIL_SPARKS_PER_STAR + j;
        const ti3 = trailIndex * 3;
        
        // Trail sparks follow main star with slight randomization
        const trailSpeedFactor = 0.7 + Math.random() * 0.4; // 70-110% of star speed
        const randomOffset = (Math.random() - 0.5) * 0.5; // Small random direction
        
        trailVelocities[ti3] = starVelocities[i3] * trailSpeedFactor + randomOffset;
        trailVelocities[ti3 + 1] = starVelocities[i3 + 1] * trailSpeedFactor + randomOffset;
        trailVelocities[ti3 + 2] = starVelocities[i3 + 2] * trailSpeedFactor + randomOffset;
        
        trailPositions[ti3] = position[0];
        trailPositions[ti3 + 1] = position[1];
        trailPositions[ti3 + 2] = position[2];
        
        // Trail delay - sparks appear progressively
        trailDelays[trailIndex] = j * 0.05; // 50ms stagger per spark
        
        trailColors[ti3] = trailColor.r;
        trailColors[ti3 + 1] = trailColor.g;
        trailColors[ti3 + 2] = trailColor.b;
      }
    }

    return {
      stars: { positions: starPositions, velocities: starVelocities, colors: starColors },
      trails: { positions: trailPositions, velocities: trailVelocities, colors: trailColors, delays: trailDelays }
    };
  }, [position, colors]);

  useFrame(() => {
    const elapsed = currentTime - startTime;
    if (elapsed < 0) {
      if (starsRef.current) starsRef.current.visible = false;
      if (trailsRef.current) trailsRef.current.visible = false;
      return;
    }

    // Update main stars
    if (starsRef.current && elapsed <= STAR_BURN_TIME) {
      starsRef.current.visible = true;
      const posAttr = starsRef.current.geometry.attributes.position;
      const colorAttr = starsRef.current.geometry.attributes.color;

      for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3;
        
        // Professional physics
        const airResistance = 0.97;
        const gravity = 9.8;
        const dragFactor = Math.pow(airResistance, elapsed * 5);
        
        const x = position[0] + particleData.stars.velocities[i3] * elapsed * dragFactor;
        const y = position[1] + particleData.stars.velocities[i3 + 1] * elapsed * dragFactor - 0.5 * gravity * elapsed * elapsed;
        const z = position[2] + particleData.stars.velocities[i3 + 2] * elapsed * dragFactor;

        posAttr.array[i3] = x;
        posAttr.array[i3 + 1] = y;
        posAttr.array[i3 + 2] = z;

        // Linear burn fade
        const burnProgress = elapsed / STAR_BURN_TIME;
        const alpha = Math.max(0, 1 - burnProgress);
        
        colorAttr.array[i3] = particleData.stars.colors[i3] * alpha;
        colorAttr.array[i3 + 1] = particleData.stars.colors[i3 + 1] * alpha;
        colorAttr.array[i3 + 2] = particleData.stars.colors[i3 + 2] * alpha;
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    } else if (starsRef.current) {
      starsRef.current.visible = false;
    }

    // Update trailing sparks
    if (trailsRef.current && elapsed <= TRAIL_BURN_TIME) {
      trailsRef.current.visible = true;
      const posAttr = trailsRef.current.geometry.attributes.position;
      const colorAttr = trailsRef.current.geometry.attributes.color;

      for (let i = 0; i < STAR_COUNT * TRAIL_SPARKS_PER_STAR; i++) {
        const i3 = i * 3;
        const trailElapsed = Math.max(0, elapsed - particleData.trails.delays[i]);
        
        if (trailElapsed > 0) {
          // Trail physics - more air resistance than stars
          const airResistance = 0.95;
          const gravity = 9.8;
          const dragFactor = Math.pow(airResistance, trailElapsed * 6);
          
          const x = position[0] + particleData.trails.velocities[i3] * trailElapsed * dragFactor;
          const y = position[1] + particleData.trails.velocities[i3 + 1] * trailElapsed * dragFactor - 0.5 * gravity * trailElapsed * trailElapsed;
          const z = position[2] + particleData.trails.velocities[i3 + 2] * trailElapsed * dragFactor;

          posAttr.array[i3] = x;
          posAttr.array[i3 + 1] = y;
          posAttr.array[i3 + 2] = z;

          // Trail fade
          const trailBurnProgress = trailElapsed / TRAIL_BURN_TIME;
          const alpha = Math.max(0, 1 - trailBurnProgress);
          
          colorAttr.array[i3] = particleData.trails.colors[i3] * alpha * 0.6;
          colorAttr.array[i3 + 1] = particleData.trails.colors[i3 + 1] * alpha * 0.6;
          colorAttr.array[i3 + 2] = particleData.trails.colors[i3 + 2] * alpha * 0.6;
        } else {
          // Hide trails not yet started
          colorAttr.array[i3] = 0;
          colorAttr.array[i3 + 1] = 0;
          colorAttr.array[i3 + 2] = 0;
        }
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    } else if (trailsRef.current) {
      trailsRef.current.visible = false;
    }
  });

  return (
    <group>
      {/* Main Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={STAR_COUNT}
            array={particleData.stars.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={STAR_COUNT}
            array={particleData.stars.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          vertexColors={true}
          transparent={true}
          opacity={0.9}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Trailing Sparks */}
      <points ref={trailsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={STAR_COUNT * TRAIL_SPARKS_PER_STAR}
            array={particleData.trails.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={STAR_COUNT * TRAIL_SPARKS_PER_STAR}
            array={particleData.trails.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.3}
          vertexColors={true}
          transparent={true}
          opacity={0.7}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

export default ChrysanthemumShellEffect;