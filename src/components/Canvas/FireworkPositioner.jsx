import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const FireworkPositioner = ({ 
  position = [0, 0, 0], 
  color = '#ffffff', 
  isSelected = false,
  isActive = false,
  fireworkType = 'burst',
  fireworkId,
  onPositionChange
}) => {
  const { camera, raycaster } = useThree();
  const groupRef = useRef();
  const ringRef = useRef();
  const glowRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPlane] = useState(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  const handlePointerDown = (event) => {
    if (event.metaKey || event.ctrlKey) {
      event.stopPropagation();
      setIsDragging(true);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (event) => {
    if (!isDragging || !onPositionChange) return;
    
    event.stopPropagation();
    
    // Convert mouse position to 3D world coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, intersectPoint);
    
    // Clamp position to reasonable bounds
    const clampedPosition = [
      Math.max(-80, Math.min(80, intersectPoint.x)),
      Math.max(-60, Math.min(60, intersectPoint.y)),
      Math.max(-20, Math.min(20, intersectPoint.z))
    ];
    
    onPositionChange(fireworkId, clampedPosition);
  };

  const handlePointerUp = (event) => {
    if (isDragging) {
      event.stopPropagation();
      setIsDragging(false);
      document.body.style.cursor = 'default';
    }
  };

  // Add global pointer event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging]);

  useFrame((state) => {
    if (groupRef.current && !isActive) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    
    if (ringRef.current) {
      const scale = isSelected ? 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1 : 1.0;
      ringRef.current.scale.setScalar(scale);
    }

    if (glowRef.current) {
      const opacity = isSelected ? 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.2 : 0.3;
      glowRef.current.material.opacity = opacity;
    }
  });

  if (isActive) {
    return null;
  }

  const getIndicatorGeometry = () => {
    switch (fireworkType) {
      case 'fountain':
        return <coneGeometry args={[0.3, 0.8, 8]} />;
      case 'spiral':
        return <cylinderGeometry args={[0.2, 0.2, 0.8, 8]} />;
      case 'willow':
        return <sphereGeometry args={[0.4, 8, 6]} />;
      default: // burst
        return <sphereGeometry args={[0.3, 8, 6]} />;
    }
  };

  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerDown={handlePointerDown}
      onPointerOver={() => {
        if (!isDragging) {
          document.body.style.cursor = 'grab';
        }
      }}
      onPointerOut={() => {
        if (!isDragging) {
          document.body.style.cursor = 'default';
        }
      }}
    >
      {/* Main indicator */}
      <mesh>
        {getIndicatorGeometry()}
        <meshBasicMaterial 
          color={isDragging ? '#ffff00' : color} 
          transparent 
          opacity={isDragging ? 0.9 : 0.7}
          wireframe={true}
        />
      </mesh>

      {/* Selection ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.05, 8, 16]} />
        <meshBasicMaterial 
          color={isSelected ? '#ffffff' : color} 
          transparent 
          opacity={isSelected ? 0.8 : 0.4}
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 16, 12]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Launch direction indicator for fountain */}
      {fireworkType === 'fountain' && (
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.05, 0.1, 0.5, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

export default FireworkPositioner;