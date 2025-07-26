import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  createParticle, 
  updateParticleSystem,
  generateRandomDirection, 
  getRealisticParticleAlpha,
  getFireworkColor,
  getZoomBrightnessMultiplier
} from '../utils/particlePhysics';

const PARTICLE_COUNT = 800;
const INITIAL_SPEED = 15;
const LIFE_DURATION = 2.0;

const BurstEffect = ({ color, shouldInitialize }) => {
  const { camera } = useThree();
  const pointsRef = useRef();
  const particlesRef = useRef([]);
  const geometryRef = useRef();
  const materialRef = useRef();
  const initializedRef = useRef(false);
  const geometryInitializedRef = useRef(false);
  
  // Initialize particles when effect starts (only once per firework)
  useEffect(() => {
    console.log(`BurstEffect useEffect: shouldInitialize=${shouldInitialize}, initialized=${initializedRef.current}, particleCount=${particlesRef.current.length}`);
    if (shouldInitialize && (!initializedRef.current || particlesRef.current.length === 0)) {
      console.log('BurstEffect: Creating particles!');
      const newParticles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const direction = generateRandomDirection();
        const speed = INITIAL_SPEED * (0.8 + Math.random() * 0.4);
        const velocity = direction.map(d => d * speed);
        
        newParticles.push(createParticle(
          [0, 0, 0],
          velocity,
          color,
          LIFE_DURATION * (0.8 + Math.random() * 0.4),
          0.03 + Math.random() * 0.07
        ));
      }
      particlesRef.current = newParticles;
      initializedRef.current = true;
      geometryInitializedRef.current = false; // Flag that geometry needs initialization
    }
  }, [shouldInitialize, color]);

  // Clean up when color changes (new firework)
  useEffect(() => {
    console.log('BurstEffect: Cleanup effect running for color:', color);
    return () => {
      console.log('BurstEffect: Cleanup function called for color:', color);
      particlesRef.current = [];
      initializedRef.current = false;
      geometryInitializedRef.current = false;
    };
  }, [color]);

  useFrame((_, delta) => {
    // Initialize geometry when particles exist and geometry is available
    if (particlesRef.current.length > 0 && !geometryInitializedRef.current && geometryRef.current) {
      console.log('BurstEffect: Initializing geometry in useFrame');
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particlesRef.current.length * 3), 3));
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(new Float32Array(particlesRef.current.length * 3), 3));
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(new Float32Array(particlesRef.current.length), 1));
      geometryInitializedRef.current = true;
    }

    // Continue updating particles even when not active, until they all die naturally
    if (!particlesRef.current.length) return;
    
    // Update particles with proper delta time
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

        const alpha = getRealisticParticleAlpha(particle, 'burst');
        const [r, g, b] = getFireworkColor(color, alpha, 'burst', brightnessMultiplier);

        colorArray[i * 3] = r;
        colorArray[i * 3 + 1] = g;
        colorArray[i * 3 + 2] = b;
        
        sizeArray[i] = particle.size * alpha * 12 * Math.sqrt(brightnessMultiplier);
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
    console.log('BurstEffect: No particles to render');
    return null;
  }

  console.log(`BurstEffect: Rendering ${particlesRef.current.length} particles`);

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        ref={materialRef}
        size={0.4}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default BurstEffect;