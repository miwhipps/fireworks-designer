import * as THREE from 'three';

export const screenToWorld = (clientX, clientY, camera, canvasRect) => {
  const mouse = new THREE.Vector2();
  mouse.x = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
  mouse.y = -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const targetZ = 0;
  const distance = (targetZ - camera.position.z) / raycaster.ray.direction.z;
  const worldPosition = raycaster.ray.at(distance, new THREE.Vector3());

  return [worldPosition.x, worldPosition.y, worldPosition.z];
};

export const worldToScreen = (worldPosition, camera, canvasRect) => {
  const vector = new THREE.Vector3(...worldPosition);
  vector.project(camera);

  const screenX = (vector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
  const screenY = (vector.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top;

  return { x: screenX, y: screenY };
};

export const timelineToWorld = (timelinePosition, totalDuration, worldBounds = { x: 20, y: 10 }) => {
  const normalizedTime = timelinePosition.x / totalDuration;
  const worldX = (normalizedTime - 0.5) * worldBounds.x;
  const worldY = Math.random() * worldBounds.y - worldBounds.y / 2;
  
  return [worldX, worldY, 0];
};

export const clampPosition = (position, bounds = { x: 80, y: 60, z: 20 }) => {
  return [
    Math.max(-bounds.x, Math.min(bounds.x, position[0])),
    Math.max(-bounds.y, Math.min(bounds.y, position[1])),
    Math.max(-bounds.z, Math.min(bounds.z, position[2]))
  ];
};

export const getRandomPosition = (bounds = { x: 10, y: 6, z: 2 }) => {
  return [
    (Math.random() - 0.5) * bounds.x * 2,
    (Math.random() - 0.5) * bounds.y * 2,
    (Math.random() - 0.5) * bounds.z * 2
  ];
};