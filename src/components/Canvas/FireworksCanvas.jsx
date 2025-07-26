import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ParticleSystem from './ParticleSystem';
import SceneBackground from './SceneBackground';
import FireworkPositioner from './FireworkPositioner';
import { clampPosition } from './utils/coordinateUtils';

// Helper function to get particle lifetime for each effect type
const getParticleLifetime = (type) => {
  switch (type) {
    case 'burst':
      return 2.0; // LIFE_DURATION from BurstEffect
    case 'fountain':
      return 3.0; // LIFE_DURATION from FountainEffect
    case 'spiral':
      return 3.0; // LIFE_DURATION from SpiralEffect
    case 'willow':
      return 3.5; // LIFE_DURATION from WillowEffect
    default:
      return 2.0;
  }
};

const CanvasContent = ({ 
  fireworks, 
  currentTime, 
  selectedFireworkId, 
  onSelectFirework,
  draggedItem,
  onAddFirework,
  onFireworkPosition 
}) => {
  const [isCmdPressed, setIsCmdPressed] = useState(false);

  // Track Cmd key state globally for firework positioning
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey) {
        setIsCmdPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (!event.metaKey && !event.ctrlKey) {
        setIsCmdPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleFireworkClick = (event, fireworkId) => {
    event.stopPropagation();
    onSelectFirework(fireworkId);
  };

  return (
    <>
      <OrbitControls 
        enablePan={!draggedItem && !isCmdPressed}
        enableZoom={true}
        enableRotate={!draggedItem && !isCmdPressed}
        maxPolarAngle={Math.PI / 2}
        minDistance={10}
        maxDistance={500}
      />
      
      <SceneBackground 
        backgroundColor="#001122"
        showGrid={true}
      />

      {/* Invisible plane to capture clicks */}
      {draggedItem && (
        <mesh 
          position={[0, 0, 0]} 
          onClick={(event) => {
            if (!draggedItem) return;
            
            event.stopPropagation();
            
            // Use the intersection point directly from the click event
            const intersectionPoint = event.point;
            const worldPos = [intersectionPoint.x, intersectionPoint.y, intersectionPoint.z];
            const clampedPos = clampPosition(worldPos);
            
            console.log('Direct intersection - Raw:', worldPos, 'Clamped:', clampedPos);
            
            onAddFirework(draggedItem, currentTime, clampedPos);
          }}
          visible={false}
        >
          <planeGeometry args={[400, 400]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      <group>
        {/* Render particle systems for active fireworks */}
        {fireworks.map((fw) => {
          // Allow extra time for particles to complete their lifecycle
          const particleLifetime = getParticleLifetime(fw.type);
          const effectEndTime = fw.startTime + fw.duration + particleLifetime;
          const isActive = currentTime >= fw.startTime && 
                          currentTime <= effectEndTime;
          
          
          
          return (
            <group key={fw.id}>
              <ParticleSystem
                type={fw.type}
                color={fw.color}
                position={fw.position3D || [0, 0, 0]}
                startTime={fw.startTime}
                currentTime={currentTime}
                duration={fw.duration}
                isActive={isActive}
              />
              
              <group 
                onClick={(e) => handleFireworkClick(e, fw.id)}
                onPointerOver={(e) => e.stopPropagation()}
              >
                <FireworkPositioner
                  position={fw.position3D || [0, 0, 0]}
                  color={fw.color}
                  isSelected={selectedFireworkId === fw.id}
                  isActive={isActive}
                  fireworkType={fw.type}
                  fireworkId={fw.id}
                  onPositionChange={onFireworkPosition}
                />
              </group>
            </group>
          );
        })}
      </group>
    </>
  );
};

const FireworksCanvas = ({ 
  fireworks = [], 
  currentTime = 0,
  selectedFireworkId,
  onSelectFirework,
  draggedItem,
  onAddFirework,
  onFireworkPosition
}) => {
  const canvasRef = useRef();
  const [showControlsModal, setShowControlsModal] = useState(false);

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 20, 60], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#001122');
        }}
      >
        <CanvasContent
          fireworks={fireworks}
          currentTime={currentTime}
          selectedFireworkId={selectedFireworkId}
          onSelectFirework={onSelectFirework}
          draggedItem={draggedItem}
          onAddFirework={onAddFirework}
          onFireworkPosition={onFireworkPosition}
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
        <div className="flex flex-col gap-1">
          <div>🎆 {fireworks.length} fireworks</div>
          <div>⏱️ {currentTime.toFixed(1)}s</div>
          {draggedItem && (
            <div className="text-blue-400">
              Click to place {draggedItem.name}
            </div>
          )}
        </div>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setShowControlsModal(true)}
        className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Show Controls Help"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Controls Modal */}
      {showControlsModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowControlsModal(false)}
        >
          <div 
            className="bg-gray-800 text-white p-6 rounded-lg max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-300">Controls Guide</h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-yellow-300 font-medium mb-2 flex items-center">
                  <span className="mr-2">📹</span> Camera Controls
                </div>
                <div className="space-y-1 ml-6 text-gray-300">
                  <div>🖱️ <strong>Left drag:</strong> Rotate view</div>
                  <div>⌥ <strong>Alt + drag:</strong> Pan camera</div>
                  <div>🔍 <strong>Scroll:</strong> Zoom in/out</div>
                </div>
              </div>

              <div>
                <div className="text-green-300 font-medium mb-2 flex items-center">
                  <span className="mr-2">🎆</span> Fireworks (3D View)
                </div>
                <div className="space-y-1 ml-6 text-gray-300">
                  <div>🖱️ <strong>Click:</strong> Select/place firework</div>
                  <div>⌘ <strong>Cmd + drag:</strong> Move position</div>
                  <div>🗑️ <strong>Double click:</strong> Remove (if selected)</div>
                </div>
              </div>

              <div>
                <div className="text-purple-300 font-medium mb-2 flex items-center">
                  <span className="mr-2">⏱️</span> Timeline Controls
                </div>
                <div className="space-y-1 ml-6 text-gray-300">
                  <div>🖱️ <strong>Click:</strong> Scrub time/place firework</div>
                  <div>⌘ <strong>Cmd + drag:</strong> Move firework in time</div>
                  <div>🔴 <strong>Drag red handle:</strong> Scrub timeline</div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-400 text-center">
              💡 Tip: Use Cmd consistently for firework positioning in both 3D and timeline views
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FireworksCanvas;