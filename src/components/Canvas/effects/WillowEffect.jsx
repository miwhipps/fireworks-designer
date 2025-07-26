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

const PARTICLE_COUNT = 500;
const INITIAL_SPEED = 12;
const LIFE_DURATION = 3.5;

const WillowEffect = ({ color, shouldInitialize }) => {
  const { camera } = useThree();
  const pointsRef = useRef();
  const particlesRef = useRef([]);
  const geometryRef = useRef();
  const materialRef = useRef();
  const initializedRef = useRef(false);
  const geometryInitializedRef = useRef(false);
  
  // Initialize particles when effect starts
  useEffect(() => {
    if (shouldInitialize && (!initializedRef.current || particlesRef.current.length === 0)) {
      const newParticles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const direction = generateRandomDirection();
        direction[1] = Math.abs(direction[1]) * 0.7 + 0.3;
        
        const speed = INITIAL_SPEED * (0.6 + Math.random() * 0.4);
        const velocity = direction.map(d => d * speed);
        
        newParticles.push(createParticle(
          [0, 0, 0],
          velocity,
          color,
          LIFE_DURATION * (0.8 + Math.random() * 0.4),
          0.025 + Math.random() * 0.075
        ));
      }
      particlesRef.current = newParticles;
      initializedRef.current = true;
      geometryInitializedRef.current = false;
    }
    
  }, [shouldInitialize, color]);

  // Clean up when color changes (new firework)
  useEffect(() => {
    return () => {
      particlesRef.current = [];
      initializedRef.current = false;
      geometryInitializedRef.current = false;
    };
  }, [color]);

  useFrame((_, delta) => {
    // Initialize geometry when particles exist and geometry is available
    if (particlesRef.current.length > 0 && !geometryInitializedRef.current && geometryRef.current) {
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particlesRef.current.length * 3), 3));
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(new Float32Array(particlesRef.current.length * 3), 3));
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(new Float32Array(particlesRef.current.length), 1));
      geometryInitializedRef.current = true;
    }

    // Continue updating particles even when not active, until they all die naturally
    if (!particlesRef.current.length) return;
    
    // Apply willow drooping effect before physics update
    particlesRef.current.forEach(particle => {
      if (particle.isAlive) {
        const ageRatio = particle.age / particle.maxLife;
        const droopFactor = Math.pow(ageRatio, 2) * 3;
        
        particle.velocity[0] *= 0.98;
        particle.velocity[2] *= 0.98;
        particle.velocity[1] -= droopFactor * delta * 15;
      }
    });
    
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

        const alpha = getRealisticParticleAlpha(particle, 'willow');
        const [r, g, b] = getFireworkColor(color, alpha, 'willow', brightnessMultiplier);
        
        // Willow effect maintains minimum visibility for the drooping effect
        const minVisibility = 0.15;
        const enhancedAlpha = Math.max(minVisibility, alpha);

        colorArray[i * 3] = r * (enhancedAlpha / alpha);
        colorArray[i * 3 + 1] = g * (enhancedAlpha / alpha);
        colorArray[i * 3 + 2] = b * (enhancedAlpha / alpha);
        
        sizeArray[i] = particle.size * enhancedAlpha * 15 * Math.sqrt(brightnessMultiplier);
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
        size={0.3}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default WillowEffect;