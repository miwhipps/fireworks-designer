import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Square } from "lucide-react";
import FireworksCanvas from "./Canvas/FireworksCanvas";
import { trailConfigs } from "./Canvas/TrajectoryCalculator";
import { professionalShells } from "./Canvas/utils/professionalFireworks";

const FireworksApp = () => {
  const [fireworks, setFireworks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const totalDuration = 30;
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedFireworkId, setSelectedFireworkId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFireworkId, setDraggedFireworkId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isCmdPressed, setIsCmdPressed] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);

  const animationRef = useRef();
  const timelineRef = useRef();

  const fireworkTypes = [
    // Original artistic fireworks
    { id: "burst", name: "Burst", color: "#ff4444", duration: 2 },
    { id: "fountain", name: "Fountain", color: "#44ff44", duration: 2 },
    { id: "spiral", name: "Spiral", color: "#4444ff", duration: 5.5 },
    { id: "willow", name: "Willow", color: "#ffff44", duration: 2 },
    { id: "chrysanthemum", name: "Chrysanthemum", colors: ['#ff6b35', '#f7931e', '#ffd23f', '#06ffa5', '#3b82f6'], color: '#ffd23f', duration: 3.5 },
    { id: "ring", name: "Ring", colors: ['#8a2be2', '#4b0082', '#0000ff', '#00bfff'], color: '#8a2be2', duration: 3 },
    { id: "strobe", name: "Strobe", colors: ['#ffffff', '#00ffff', '#ff00ff'], color: '#ffffff', duration: 2.5 },
    { id: "crossette", name: "Crossette", colors: ['#e91e63', '#9c27b0', '#673ab7'], color: '#e91e63', duration: 4 },
    { id: "palmtree", name: "Palm Tree", colors: ['#ffd700', '#ffaa00', '#ff8800', '#ff6600'], color: '#ffd700', duration: 5 },
    
    // Professional shells with authentic colors
    ...Object.values(professionalShells).map(shell => ({
      id: shell.id,
      name: shell.name,
      color: shell.colors[0], // Primary color for timeline
      colors: shell.colors,
      duration: shell.duration,
      starCount: shell.starCount,
      shellSize: shell.shellSize,
      type: shell.type,
      safetyDistance: shell.safetyDistance,
      isProfessional: true
    }))
  ];

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.016;
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  const addFirework = useCallback(
    (type, timePosition, position3D = [0, 0, 0]) => {
      const newFirework = {
        id: `fw-${Date.now()}`,
        type: type.id,
        name: type.name,
        startTime: timePosition,
        duration: type.duration,
        color: type.color,
        colors: type.colors, // Preserve multi-color array
        shellSize: type.shellSize, // Professional shell size
        isProfessional: type.isProfessional,
        safetyDistance: type.safetyDistance,
        position: { x: 400, y: 300 },
        position3D: position3D,
      };
      setFireworks((prev) => [...prev, newFirework]);
      return newFirework.id;
    },
    []
  );

  const handleCanvasAddFirework = useCallback(
    (type, timePosition, position3D) => {
      const fireworkId = addFirework(type, timePosition, position3D);
      setSelectedFireworkId(fireworkId);
      setDraggedItem(null); // Clear the dragged item after placing
      return fireworkId;
    },
    [addFirework]
  );

  const handleTimelineClick = useCallback(
    (e) => {
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - timelineRect.left;
      const timelineWidth = timelineRect.width;
      const timePosition = (clickX / timelineWidth) * totalDuration;

      if (draggedItem) {
        // Add firework at clicked time
        const fireworkId = addFirework(draggedItem, Math.max(0, timePosition));
        setSelectedFireworkId(fireworkId);
        setDraggedItem(null);
      } else {
        // Scrub to clicked time
        setCurrentTime(Math.max(0, Math.min(totalDuration, timePosition)));
        setIsPlaying(false); // Stop playback when manually scrubbing
      }
    },
    [draggedItem, totalDuration, addFirework]
  );

  const handleScrubberMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsPlaying(false); // Stop playback when starting to drag
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !timelineRef.current) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - timelineRect.left;
      const timelineWidth = timelineRect.width;
      const timePosition = (clickX / timelineWidth) * totalDuration;

      setCurrentTime(Math.max(0, Math.min(totalDuration, timePosition)));
    },
    [isDragging, totalDuration]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for timeline scrubber drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const updateFireworkPosition = useCallback((id, position3D) => {
    setFireworks((prev) =>
      prev.map((fw) => (fw.id === id ? { ...fw, position3D } : fw))
    );
  }, []);

  const removeFirework = useCallback(
    (id) => {
      setFireworks((prev) => prev.filter((fw) => fw.id !== id));
      if (selectedFireworkId === id) {
        setSelectedFireworkId(null);
      }
    },
    [selectedFireworkId]
  );

  const updateFireworkStartTime = useCallback((id, newStartTime) => {
    setFireworks((prev) =>
      prev.map((fw) => 
        fw.id === id 
          ? { ...fw, startTime: Math.max(0, Math.min(totalDuration, newStartTime)) }
          : fw
      )
    );
  }, [totalDuration]);

  const togglePlayback = () => setIsPlaying(!isPlaying);

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const timeToPixels = useCallback((time) => {
    if (!timelineRef.current) return 0;
    const timelineWidth = timelineRef.current.getBoundingClientRect().width;
    return (time / totalDuration) * timelineWidth;
  }, [totalDuration]);

  const handleFireworkMouseDown = useCallback((e, fireworkId) => {
    // Only start drag if Cmd (metaKey) is held
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
      setDraggedFireworkId(fireworkId);
      setSelectedFireworkId(fireworkId);
      setIsPlaying(false);
      
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - timelineRect.left;
      const firework = fireworks.find(fw => fw.id === fireworkId);
      const fireworkStartPixel = timeToPixels(firework.startTime);
      setDragOffset(clickX - fireworkStartPixel);
    }
  }, [fireworks, timeToPixels]);

  const handleTimelineMouseMove = useCallback((e) => {
    if (!draggedFireworkId || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - timelineRect.left - dragOffset;
    const timelineWidth = timelineRect.width;
    const newStartTime = (mouseX / timelineWidth) * totalDuration;
    
    updateFireworkStartTime(draggedFireworkId, newStartTime);
  }, [draggedFireworkId, dragOffset, totalDuration, updateFireworkStartTime]);

  const handleTimelineMouseUp = useCallback(() => {
    setDraggedFireworkId(null);
    setDragOffset(0);
  }, []);

  // Add global mouse event listeners for firework timeline drag
  useEffect(() => {
    if (draggedFireworkId) {
      document.addEventListener("mousemove", handleTimelineMouseMove);
      document.addEventListener("mouseup", handleTimelineMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleTimelineMouseMove);
        document.removeEventListener("mouseup", handleTimelineMouseUp);
      };
    }
  }, [draggedFireworkId, handleTimelineMouseMove, handleTimelineMouseUp]);

  // Track Cmd key state for timeline drag indication
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

  const handleBackgroundImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      console.log('Uploading image:', file.name, file.type, file.size);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Image data URL created, length:', e.target.result.length);
        setBackgroundImage(e.target.result);
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('Invalid file type or no file selected');
    }
  }, []);

  const clearBackgroundImage = useCallback(() => {
    setBackgroundImage(null);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Fireworks Display Designer</h1>
        <p className="text-gray-400 text-sm">
          Design your show: select a firework type, then click the timeline or
          3D view to place it
        </p>
      </div>

      {/* 3D Canvas Display */}
      <div className="flex-1 min-h-0">
        <FireworksCanvas
          fireworks={fireworks}
          currentTime={currentTime}
          onFireworkPosition={updateFireworkPosition}
          selectedFireworkId={selectedFireworkId}
          onSelectFirework={setSelectedFireworkId}
          draggedItem={draggedItem}
          onAddFirework={handleCanvasAddFirework}
          backgroundImage={backgroundImage}
          isPlaying={isPlaying}
        />
      </div>

      {/* Timeline Section */}
      <div className="h-80 bg-gray-800 border-t border-gray-700 p-4 overflow-y-auto">
        {/* Background Image Controls */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Background Image</h3>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="px-3 py-2 rounded border-2 border-gray-600 hover:border-gray-400 cursor-pointer transition-all text-sm bg-purple-600 hover:bg-purple-700">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
                className="hidden"
              />
              📁 Upload Image
            </label>
            {backgroundImage && (
              <button
                onClick={clearBackgroundImage}
                className="px-3 py-2 rounded border-2 border-red-600 hover:border-red-400 text-sm bg-red-600 hover:bg-red-700 transition-all"
              >
                🗑️ Clear
              </button>
            )}
            {backgroundImage && (
              <span className="text-green-400 text-sm">✓ Image loaded</span>
            )}
          </div>
        </div>

        {/* Firework Library */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Firework Library</h3>
          <div className="flex gap-2 flex-wrap">
            {fireworkTypes.map((type) => (
              <button
                key={type.id}
                className={`px-3 py-2 rounded border-2 transition-all text-sm ${
                  draggedItem?.id === type.id
                    ? "border-blue-400 bg-blue-400/20"
                    : "border-gray-600 hover:border-gray-400"
                }`}
                style={{
                  backgroundColor:
                    draggedItem?.id === type.id ? type.color + "20" : undefined,
                }}
                onClick={() =>
                  setDraggedItem(draggedItem?.id === type.id ? null : type)
                }
              >
                <div className="flex items-center gap-2">
                  {type.colors ? (
                    // Multi-color gradient indicator
                    <div className="w-3 h-3 rounded-full flex overflow-hidden">
                      {type.colors.map((color, index) => (
                        <div
                          key={index}
                          className="flex-1 h-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : (
                    // Single color indicator
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{type.name}</span>
                    {type.isProfessional && (
                      <span className="text-xs text-yellow-400">
                        Professional {type.shellSize}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {draggedItem && (
            <p className="text-blue-400 mt-2 text-sm">
              Click on the timeline or 3D view to place {draggedItem.name}
            </p>
          )}
        </div>

        {/* Playback Controls */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={stopPlayback}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors text-sm"
            >
              <Square size={16} />
              Stop
            </button>
            <div className="text-gray-400 text-sm">
              Time: {currentTime.toFixed(1)}s / {totalDuration}s
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-750 rounded p-3">
          <h3 className="text-md font-semibold mb-3">Timeline</h3>

          {/* Time markers */}
          <div className="relative mb-2">
            <div className="flex justify-between text-xs text-gray-400">
              {Array.from({ length: totalDuration + 1 }, (_, i) => (
                <span key={i}>{i}s</span>
              ))}
            </div>
          </div>

          {/* Main timeline area */}
          <div
            ref={timelineRef}
            className="relative h-24 bg-gray-700 rounded cursor-pointer border-2 border-gray-600"
            onClick={handleTimelineClick}
          >
            {/* Current time indicator with draggable head */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 z-20"
              style={{ left: `${timeToPixels(currentTime)}px` }}
            />
            <div
              className="absolute top-0 w-3 h-3 bg-red-500 rounded-full cursor-pointer z-30 transform -translate-x-1.5 hover:bg-red-400 transition-colors"
              style={{ left: `${timeToPixels(currentTime)}px` }}
              title="Drag to scrub timeline or click timeline to seek"
              onMouseDown={handleScrubberMouseDown}
            />

            {/* Fireworks on timeline */}
            {fireworks.map((firework) => {
              const trailConfig = trailConfigs[firework.type] || trailConfigs.burst;
              const launchStartTime = firework.startTime - trailConfig.launchTime;
              
              return (
                <div key={firework.id} className="absolute top-1 h-22">
                  {/* Launch trail indicator */}
                  <div
                    className="absolute h-full bg-opacity-30 rounded-l border-l-2 border-dashed"
                    style={{
                      left: `${timeToPixels(launchStartTime)}px`,
                      width: `${timeToPixels(trailConfig.launchTime)}px`,
                      backgroundColor: trailConfig.color + "20",
                      borderColor: trailConfig.color,
                    }}
                  />
                  
                  {/* Main firework explosion */}
                  <div
                    className={`absolute h-full bg-opacity-70 rounded border-2 group ${
                      draggedFireworkId === firework.id
                        ? "cursor-grabbing ring-2 ring-yellow-400 z-10"
                        : selectedFireworkId === firework.id
                        ? `${isCmdPressed ? "cursor-grab" : "cursor-pointer"} ring-2 ring-white`
                        : `${isCmdPressed ? "cursor-grab" : "cursor-pointer"} border-white/30 hover:border-white/60`
                    } ${isCmdPressed ? "hover:ring-2 hover:ring-blue-400" : ""}`}
                    style={{
                      left: `${timeToPixels(firework.startTime)}px`,
                      width: `${timeToPixels(firework.duration)}px`,
                      backgroundColor: firework.color + "40",
                      borderColor: firework.color,
                      opacity: draggedFireworkId === firework.id ? 0.8 : 1,
                    }}
                    onMouseDown={(e) => handleFireworkMouseDown(e, firework.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only handle regular click if Cmd is not pressed
                      if (!isCmdPressed && !draggedFireworkId) {
                        if (selectedFireworkId === firework.id) {
                          removeFirework(firework.id);
                        } else {
                          setSelectedFireworkId(firework.id);
                        }
                      }
                    }}
                  >
                <div className="p-1 text-xs">
                  <div className="font-semibold">{firework.name}</div>
                  <div className="text-gray-200">
                    {firework.startTime.toFixed(1)}s
                  </div>
                </div>
                <div className="absolute inset-0 bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {selectedFireworkId === firework.id ? "Remove" : "Select"}
                  </span>
                </div>
              </div>
                </div>
              );
            })}
          </div>

          {/* Timeline help text */}
          <div className="mt-2 text-xs text-gray-400">
            Click timeline to scrub time, or select a firework type and click to
            place at that time. Drag the red timeline head to scrub. Click
            fireworks to select/remove them.
          </div>
        </div>

        {/* Show Summary */}
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">Show Summary</h4>
          <div className="bg-gray-750 rounded p-3">
            {fireworks.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No fireworks added yet. Select a type and click to place!
              </p>
            ) : (
              <div>
                <p className="mb-2 text-sm">
                  Total fireworks: {fireworks.length}
                  {fireworks.some(fw => fw.isProfessional) && (
                    <span className="ml-2 text-yellow-400 text-xs">
                      (Professional shells included)
                    </span>
                  )}
                </p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {fireworks.map((fw) => (
                    <div
                      key={fw.id}
                      className={`flex items-center gap-2 text-xs cursor-pointer p-1 rounded ${
                        selectedFireworkId === fw.id
                          ? "bg-gray-600"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedFireworkId(fw.id)}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: fw.color }}
                      />
                      <span>
                        {fw.name} at {fw.startTime.toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireworksApp;
