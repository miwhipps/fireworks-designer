import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { 
  trailConfigs, 
  getTrailProgress
} from './TrajectoryCalculator';

const LaunchTrail = ({ 
  startPosition = [0, -5, 0],
  endPosition = [0, 0, 0], 
  fireworkType = 'burst',
  launchStartTime = 0,
  currentTime = 0,
  isActive = true
}) => {
  const lineRef = useRef();
  const glowLineRef = useRef();

  // Get configuration for this firework type
  const config = trailConfigs[fireworkType] || trailConfigs.burst;
  
  // Calculate realistic curved trajectory with environmental factors
  const fullTrajectory = useMemo(() => {
    const segments = 30;
    const points = [];
    
    // Create consistent but varied wind/drag effects based on firework type and position
    const hash = fireworkType.charCodeAt(0) * (startPosition[0] + startPosition[2]);
    const windStrengthX = ((hash % 100) - 50) / 200; // Range: -0.25 to 0.25
    const windStrengthZ = (((hash * 7) % 100) - 50) / 300; // Range: -0.16 to 0.16
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Base linear interpolation (always ends at exact target)
      let x = startPosition[0] + (endPosition[0] - startPosition[0]) * t;
      let y = startPosition[1] + (endPosition[1] - startPosition[1]) * t;
      let z = startPosition[2] + (endPosition[2] - startPosition[2]) * t;
      
      // Add parabolic arc for gravity effect (peaks mid-flight, returns to target)
      const gravityArc = -4 * (t - 0.5) * (t - 0.5) + 1;
      const arcHeight = Math.abs(endPosition[1] - startPosition[1]) * 0.08;
      // Only apply arc to middle portion, fade out near start and end
      const arcFade = Math.sin(t * Math.PI); // Smooth fade in/out
      y += gravityArc * arcHeight * arcFade * 0.4;
      
      // Add wind drift that grows then shrinks (wind effect diminishes as rocket gains speed)
      const windCurve = Math.sin(t * Math.PI * 0.8); // Bell-shaped curve
      const windFactor = windCurve * (1 - t * 0.3); // Reduce effect near end
      x += windStrengthX * windFactor * 2;
      z += windStrengthZ * windFactor * 2;
      
      points.push([x, y, z]);
    }
    
    return points;
  }, [startPosition, endPosition, fireworkType]);

  // Calculate current trail progress
  const progress = getTrailProgress(currentTime, launchStartTime, config.launchTime);
  
  // Get moving trail portion (fixed length, moves along trajectory)
  const { visiblePoints, trailAlphas } = useMemo(() => {
    if (progress <= 0) return { visiblePoints: [], trailAlphas: [] };
    
    const trailLength = 8; // Fixed trail length in segments
    const currentIndex = Math.floor(fullTrajectory.length * progress);
    const startIndex = Math.max(0, currentIndex - trailLength);
    const endIndex = Math.min(fullTrajectory.length - 1, currentIndex);
    
    const points = fullTrajectory.slice(startIndex, endIndex + 1);
    
    // Create fade effect - brightest at front (rocket position), fading toward back
    const alphas = points.map((_, index) => {
      const fadeProgress = index / (points.length - 1); // 0 = back, 1 = front
      return Math.pow(fadeProgress, 0.5); // Square root for smoother fade
    });
    
    return { visiblePoints: points, trailAlphas: alphas };
  }, [fullTrajectory, progress]);

  // Create gradient colors for the moving trail
  const colors = useMemo(() => {
    if (visiblePoints.length === 0) return new Float32Array([]);
    
    const color = new THREE.Color(config.color);
    const trailColors = [];
    
    trailAlphas.forEach((alpha) => {
      const intensity = alpha * config.intensity; // Use config intensity and fade
      trailColors.push(color.r * intensity, color.g * intensity, color.b * intensity);
    });
    
    return new Float32Array(trailColors);
  }, [visiblePoints, trailAlphas, config.color, config.intensity]);

  // Don't render if inactive or no progress
  if (!isActive || progress <= 0 || visiblePoints.length < 2) {
    return null;
  }

  return (
    <group>
      {/* Main trail line with vertex colors */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={visiblePoints.length}
            array={new Float32Array(visiblePoints.flat())}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={visiblePoints.length}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors={true}
          transparent={true}
          opacity={1.0}
          linewidth={config.thickness}
        />
      </line>
      
      {/* Glow effect line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={visiblePoints.length}
            array={new Float32Array(visiblePoints.flat())}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={visiblePoints.length}
            array={new Float32Array(colors.map(c => c * 0.5))} // Dimmer glow
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors={true}
          transparent={true}
          opacity={0.6}
          linewidth={config.thickness * 1.2}
        />
      </line>
      
      {/* Particle sparks along the trail */}
      {visiblePoints.length > 5 && (
        <TrailSparks 
          points={visiblePoints}
          alphas={trailAlphas}
          color={config.color}
          intensity={config.intensity * 0.5} // Dimmer sparks
        />
      )}
    </group>
  );
};

// Component for particle sparks along the trail
const TrailSparks = ({ points, alphas, color, intensity }) => {
  const { sparkPositions, sparkColors } = useMemo(() => {
    // Create sparks at every 3rd point along the trail
    const sparks = [];
    const colors = [];
    const baseColor = new THREE.Color(color);
    
    for (let i = 0; i < points.length; i += 3) {
      if (points[i] && alphas[i]) {
        // Add slight random offset for more realistic sparks
        const [x, y, z] = points[i];
        sparks.push([
          x + (Math.random() - 0.5) * 0.1,
          y + (Math.random() - 0.5) * 0.1,
          z + (Math.random() - 0.5) * 0.1
        ]);
        
        // Apply fade to spark colors
        const sparkIntensity = alphas[i] * intensity;
        colors.push(
          baseColor.r * sparkIntensity,
          baseColor.g * sparkIntensity,
          baseColor.b * sparkIntensity
        );
      }
    }
    return { sparkPositions: sparks, sparkColors: new Float32Array(colors) };
  }, [points, alphas, color, intensity]);

  if (sparkPositions.length === 0) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={sparkPositions.length}
          array={new Float32Array(sparkPositions.flat())}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={sparkPositions.length}
          array={sparkColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors={true}
        transparent={true}
        opacity={1.0}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default LaunchTrail;