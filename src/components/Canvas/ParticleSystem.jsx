import React, { useMemo, useRef } from 'react';
import BurstEffect from './effects/BurstEffect';
import FountainEffect from './effects/FountainEffect';
import SpiralEffect from './effects/SpiralEffect';
import WillowEffect from './effects/WillowEffect';
import ChrysanthemumEffect from './effects/ChrysanthemumEffect';
import RingEffect from './effects/RingEffect';
import StrobeEffect from './effects/StrobeEffect';
import CrossetteEffect from './effects/CrossetteEffect';
import PalmTreeEffect from './effects/PalmTreeEffect';
import PeonyShellEffect from './effects/PeonyShellEffect';
import ChrysanthemumShellEffect from './effects/ChrysanthemumShellEffect';
import WillowShellEffect from './effects/WillowShellEffect';
import PalmShellEffect from './effects/PalmShellEffect';

const ParticleSystem = ({ 
  type, 
  color, 
  colors, // Multi-color array for new effects
  shellSize, // Professional shell size
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
      case 'chrysanthemum':
        return ChrysanthemumEffect;
      case 'ring':
        return RingEffect;
      case 'strobe':
        return StrobeEffect;
      case 'crossette':
        return CrossetteEffect;
      case 'palmtree':
        return PalmTreeEffect;
      // Professional shells
      case 'peony':
        return PeonyShellEffect;
      case 'chrysanthemum_6inch':
        return ChrysanthemumShellEffect;
      case 'willow_6inch':
        return WillowShellEffect;
      case 'palm_8inch':
        return PalmShellEffect;
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
  

  // Determine if this is a multi-color effect or professional shell
  const isMultiColorEffect = ['chrysanthemum', 'ring', 'strobe', 'crossette', 'palmtree'].includes(type);
  const isProfessionalShell = ['peony', 'chrysanthemum_6inch', 'willow_6inch', 'palm_8inch'].includes(type);
  
  return (
    <group ref={groupRef} position={position}>
      <EffectComponent 
        position={[0, 0, 0]}
        startTime={startTime}
        currentTime={currentTime}
        color={color}
        colors={(isMultiColorEffect || isProfessionalShell) ? colors : undefined}
        shellSize={shellSize}
        shouldInitialize={shouldInitializeValue}
        isEmitting={relativeTime <= duration}
      />
    </group>
  );
};

export default ParticleSystem;