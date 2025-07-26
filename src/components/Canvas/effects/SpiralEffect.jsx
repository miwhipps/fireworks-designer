import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  createParticle, 
  updateParticleSystem,
  getRealisticParticleAlpha,
  getFireworkColor,
  getZoomBrightnessMultiplier
} from '../utils/particlePhysics';

const PARTICLES_PER_SECOND = 200;
const INITIAL_SPEED = 8;
const LIFE_DURATION = 3.0;
const SPIRAL_TURNS = 3;
const SPIRAL_SPEED = 2; // How fast the emission point spins (rotations per second)

const SpiralEffect = ({ color, shouldInitialize, isEmitting = true }) => {
  const { camera } = useThree();
  const pointsRef = useRef();
  const particlesRef = useRef([]);
  const geometryRef = useRef();
  const materialRef = useRef();
  const accumulatedTimeRef = useRef(0);
  const spiralTimeRef = useRef(0);
  const geometryInitializedRef = useRef(false);
  
  // Clean up when color changes (new firework)
  useEffect(() => {
    return () => {
      particlesRef.current = [];
      accumulatedTimeRef.current = 0;
      spiralTimeRef.current = 0;
      geometryInitializedRef.current = false;
    };
  }, [color]);

  // Reset state when effect becomes inactive (timeline scrubbing backwards)
  useEffect(() => {
    if (!shouldInitialize) {
      accumulatedTimeRef.current = 0;
      spiralTimeRef.current = 0;
      particlesRef.current = [];
      geometryInitializedRef.current = false;
    }
  }, [shouldInitialize]);

  useFrame((_, delta) => {
    // Initialize geometry when particles exist and geometry is available
    if (particlesRef.current.length > 0 && !geometryInitializedRef.current && geometryRef.current) {
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(1000 * 3), 3)); // Pre-allocate for max particles
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(new Float32Array(1000 * 3), 3));
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(new Float32Array(1000), 1));
      geometryInitializedRef.current = true;
    }

    // Continue updating existing particles even when not emitting
    if (!shouldInitialize && !particlesRef.current.length) return;
    
    // Update spiral time and accumulated time when emitting
    if (isEmitting) {
      spiralTimeRef.current += delta;
      accumulatedTimeRef.current += delta;
    }
    
    // Spawn new particles while emitting with spinning emission point
    if (isEmitting) {
      const spawnInterval = 1 / PARTICLES_PER_SECOND;
      while (accumulatedTimeRef.current >= spawnInterval) {
        // Calculate current spiral angle based on spiral time
        const spiralAngle = spiralTimeRef.current * SPIRAL_SPEED * Math.PI * 2;
        
        // Emission direction based on current spiral angle (rotated 90 degrees to face forward)
        const direction = [
          Math.cos(spiralAngle),
          Math.sin(spiralAngle), // This creates the spiral in the vertical plane
          0.8 + Math.random() * 0.4  // Forward bias (was upward)
        ];
        
        const speed = INITIAL_SPEED * (0.8 + Math.random() * 0.4);
        const velocity = direction.map(d => d * speed);
        
        particlesRef.current.push(createParticle(
          [0, 0, 0], // All start from center
          velocity,
          color,
          LIFE_DURATION * (0.8 + Math.random() * 0.4),
          0.02 + Math.random() * 0.05
        ));
        
        accumulatedTimeRef.current -= spawnInterval;
      }
    }
    
    // Update particle physics
    particlesRef.current = updateParticleSystem(particlesRef.current, delta);
    
    // Update geometry if we have particles and geometry is initialized
    if (particlesRef.current.length > 0 && geometryRef.current && geometryInitializedRef.current) {
      const posArray = new Float32Array(particlesRef.current.length * 3);
      const colorArray = new Float32Array(particlesRef.current.length * 3);
      const sizeArray = new Float32Array(particlesRef.current.length);

      // Calculate brightness multiplier based on camera distance
      const cameraDistance = camera.position.length();
      const brightnessMultiplier = getZoomBrightnessMultiplier(cameraDistance);

      particlesRef.current.forEach((particle, i) => {
        posArray[i * 3] = particle.position[0];
        posArray[i * 3 + 1] = particle.position[1];
        posArray[i * 3 + 2] = particle.position[2];

        const alpha = getRealisticParticleAlpha(particle, 'spiral');
        const [r, g, b] = getFireworkColor(color, alpha, 'spiral', brightnessMultiplier);

        colorArray[i * 3] = r;
        colorArray[i * 3 + 1] = g;
        colorArray[i * 3 + 2] = b;
        
        sizeArray[i] = particle.size * alpha * 18 * Math.sqrt(brightnessMultiplier);
      });

      // Update buffer attributes
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
      
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.attributes.color.needsUpdate = true;
      geometryRef.current.attributes.size.needsUpdate = true;
    }
  });

  // Only render if we have particles (regardless of isActive state)
  if (!particlesRef.current.length) {
    return null;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        ref={materialRef}
        size={0.25}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default SpiralEffect;