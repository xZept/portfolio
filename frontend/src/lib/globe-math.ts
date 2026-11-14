export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  screenX: number;
  screenY: number;
  z: number;
  scale: number;
  opacity: number;
}

export function generateFibonacciSpherePoints(count: number): Point3D[] {
  const points: Point3D[] = [];
  if (count <= 0) return points;
  if (count === 1) return [{ x: 0, y: 1, z: 0 }];

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push({ x, y, z });
  }
  return points;
}

export function rotatePoint3D(point: Point3D, rotX: number, rotY: number): Point3D {
  // Rotate around Y axis (yaw)
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  const y1 = point.y;

  // Rotate around X axis (pitch)
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;

  return { x: x1, y: y2, z: z2 };
}

export function projectPoint(
  point: Point3D,
  radius: number,
  centerX: number,
  centerY: number,
  fov = 3.2,
): ProjectedPoint {
  const depthFactor = fov / (fov - point.z);
  const screenX = centerX + point.x * radius * depthFactor;
  const screenY = centerY + point.y * radius * depthFactor;
  const scale = 0.72 + ((point.z + 1) / 2) * 0.42;
  const opacity = 0.45 + ((point.z + 1) / 2) * 0.55;

  return {
    screenX,
    screenY,
    z: point.z,
    scale,
    opacity,
  };
}
