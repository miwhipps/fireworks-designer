import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getZoomBrightnessMultiplier } from './utils/particlePhysics';

const SceneBackground = ({ 
  backgroundColor = '#001122',
  showGrid = true 
}) => {
  const { camera } = useThree();
  const meshRef = useRef();
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();

  useFrame(() => {
    if (ambientLightRef.current && directionalLightRef.current) {
      const cameraDistance = camera.position.length();
      const brightnessMultiplier = getZoomBrightnessMultiplier(cameraDistance);
      
      // Aggressively adjust lighting intensity for better scene visibility
      ambientLightRef.current.intensity = 0.4 * brightnessMultiplier;
      directionalLightRef.current.intensity = 0.6 * brightnessMultiplier;
    }
  });

  return (
    <>
      {/* Background Plane */}
      <mesh ref={meshRef} position={[0, 0, -50]} scale={[300, 200, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          color={backgroundColor}
          transparent={false}
        />
      </mesh>

      {/* Ground Grid */}
      {showGrid && (
        <gridHelper 
          args={[200, 100, '#333333', '#222222']} 
          position={[0, -15, 0]} 
          rotation={[0, 0, 0]}
        />
      )}

      {/* Ambient lighting setup */}
      <ambientLight ref={ambientLightRef} intensity={0.2} color="#ffffff" />
      <directionalLight 
        ref={directionalLightRef}
        position={[10, 10, 5]} 
        intensity={0.3} 
        color="#ffffff"
        castShadow={false}
      />
      
      {/* Atmospheric fog */}
      <fog attach="fog" args={[backgroundColor, 100, 600]} />
    </>
  );
};

export default SceneBackground;