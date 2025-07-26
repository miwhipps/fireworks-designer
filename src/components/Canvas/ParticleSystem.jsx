import React, { useMemo, useRef } from 'react';
import BurstEffect from './effects/BurstEffect';
import FountainEffect from './effects/FountainEffect';
import SpiralEffect from './effects/SpiralEffect';
import WillowEffect from './effects/WillowEffect';

const ParticleSystem = ({ 
  type, 
  color, 
  position = [0, 0, 0], 
  startTime, 
  currentTime, 
  duration,
  isActive = true 
}) => {
  const groupRef = useRef();
  
  const relativeTime = useMemo(() => {
    return Math.max(0, currentTime - startTime);
  }, [currentTime, startTime]);


  // Always render once started, effects manage their own lifecycle
  const shouldRender = relativeTime >= 0;

  const EffectComponent = useMemo(() => {
    switch (type) {
      case 'burst':
        return BurstEffect;
      case 'fountain':
        return FountainEffect;
      case 'spiral':
        return SpiralEffect;
      case 'willow':
        return WillowEffect;
      default:
        return BurstEffect;
    }
  }, [type]);

  if (!shouldRender) {
    return null;
  }

  const shouldInitializeValue = isActive;

  // Debug for burst effects during playback
  if (type === 'burst') {
    console.log(`ParticleSystem burst: currentTime=${currentTime.toFixed(2)}, startTime=${startTime.toFixed(2)}, relativeTime=${relativeTime.toFixed(2)}, isActive=${isActive}, shouldInitialize=${shouldInitializeValue}`);
  }
  

  return (
    <group ref={groupRef} position={position}>
      <EffectComponent 
        color={color}
        shouldInitialize={shouldInitializeValue}
        isEmitting={relativeTime <= duration}
      />
    </group>
  );
};

export default ParticleSystem;