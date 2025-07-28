import { useRef, useMemo, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getZoomBrightnessMultiplier } from './utils/particlePhysics';

const SceneBackground = ({ 
  backgroundColor = '#001122',
  showGrid = true,
  backgroundImage = null
}) => {
  const { camera } = useThree();
  const meshRef = useRef();
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();

  const [texture, setTexture] = useState(null);

  // Load texture from background image data URL
  useEffect(() => {
    if (!backgroundImage) {
      setTexture(null);
      return;
    }

    // Create image element directly
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('Image loaded, dimensions:', img.width, 'x', img.height);
      
      const tex = new THREE.Texture(img);
      tex.wrapS = THREE.ClampToEdgeWrap;
      tex.wrapT = THREE.ClampToEdgeWrap;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.flipY = true;
      tex.needsUpdate = true;
      
      console.log('Texture created:', tex);
      setTexture(tex);
    };
    
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      setTexture(null);
    };
    
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Force material update when texture changes
  useEffect(() => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material;
      material.map = texture;
      material.needsUpdate = true;
      console.log('Material updated directly:', material);
    }
  }, [texture]);

  useFrame(() => {
    if (ambientLightRef.current && directionalLightRef.current) {
      const cameraDistance = camera.position.length();
      const brightnessMultiplier = getZoomBrightnessMultiplier(cameraDistance);
      
      // Aggressively adjust lighting intensity for better scene visibility
      ambientLightRef.current.intensity = 0.4 * brightnessMultiplier;
      directionalLightRef.current.intensity = 0.6 * brightnessMultiplier;
    }

    // Debug material state
    if (meshRef.current && texture) {
      const material = meshRef.current.material;
      if (material.map !== texture) {
        console.log('Material map mismatch, updating...');
        material.map = texture;
        material.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* Background Plane */}
      <mesh ref={meshRef} position={[0, 0, -30]} scale={[300, 200, 1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          color={texture ? '#ffffff' : backgroundColor}
          map={texture}
          transparent={false}
          side={THREE.FrontSide}
          key={texture ? texture.uuid : 'no-texture'}
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