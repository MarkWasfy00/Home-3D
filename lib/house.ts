// Floor plan taken from "moamen house.pdf". Units are metres.
// x runs west -> east, z runs north -> south (same orientation as the drawing).

export type Rect = { x0: number; x1: number; z0: number; z1: number };
export type Box = Rect & { y0: number; y1: number };

export const WALL_H = 2.7;
export const DOOR_H = 2.05;
export const SILL = 0.9;
export const WIN_TOP = 2.1;

type Opening = { from: number; to: number; kind: 'door' | 'window' };
type Wall = {
  /** 'x' = wall runs along x (a..b is its z thickness); 'z' = runs along z (a..b is its x thickness) */
  dir: 'x' | 'z';
  a: number;
  b: number;
  from: number;
  to: number;
  openings?: Opening[];
};

const WALLS: Wall[] = [
  // north facade with the entrance door
  { dir: 'x', a: -0.12, b: 0, from: -0.12, to: 8.4, openings: [{ from: 4.87, to: 5.67, kind: 'door' }] },
  // north-east jog of the hall
  { dir: 'x', a: 0, b: 0.24, from: 6.34, to: 8.28 },
  // wall between the top rooms and the bottom rooms
  {
    dir: 'x', a: 3.19, b: 3.29, from: -0.12, to: 8.4,
    openings: [
      { from: 4.42, to: 5.2, kind: 'door' }, // hall -> room 2
      { from: 5.42, to: 6.45, kind: 'door' }, // hall -> corridor
    ],
  },
  // bathroom south wall / back-room entrance
  { dir: 'x', a: 4.77, b: 4.95, from: 5.72, to: 8.24, openings: [{ from: 5.72, to: 6.45, kind: 'door' }] },
  // south walls
  { dir: 'x', a: 6.62, b: 6.74, from: 1.18, to: 5.42 },
  { dir: 'x', a: 6.45, b: 6.57, from: 5.42, to: 8.24 },

  // room 1 west wall (window)
  { dir: 'z', a: -0.12, b: 0, from: 0, to: 3.19, openings: [{ from: 0.98, to: 2.23, kind: 'window' }] },
  // room 1 / hall
  { dir: 'z', a: 4.14, b: 4.24, from: 0, to: 3.19, openings: [{ from: 2.21, to: 2.99, kind: 'door' }] },
  // hall east wall (window)
  { dir: 'z', a: 8.28, b: 8.4, from: 0, to: 3.19, openings: [{ from: 2.0, to: 2.95, kind: 'window' }] },
  // room 2 west wall (window to balcony)
  { dir: 'z', a: 1.18, b: 1.3, from: 3.29, to: 6.62, openings: [{ from: 3.9, to: 5.2, kind: 'window' }] },
  // room 2 east wall
  { dir: 'z', a: 5.3, b: 5.42, from: 3.29, to: 6.62 },
  // thick wall left of the back room
  { dir: 'z', a: 5.42, b: 5.72, from: 4.77, to: 6.45 },
  // small room west wall (door)
  { dir: 'z', a: 6.45, b: 6.55, from: 3.29, to: 4.77, openings: [{ from: 3.88, to: 4.63, kind: 'door' }] },
  // small room east wall
  { dir: 'z', a: 8.12, b: 8.24, from: 3.29, to: 4.77 },
  // back room east wall (window)
  { dir: 'z', a: 8.12, b: 8.24, from: 4.95, to: 6.45, openings: [{ from: 5.37, to: 6.18, kind: 'window' }] },
];

const rectOf = (w: Wall, s: number, e: number): Rect =>
  w.dir === 'x' ? { x0: s, x1: e, z0: w.a, z1: w.b } : { x0: w.a, x1: w.b, z0: s, z1: e };

export const wallBoxes: Box[] = [];
export const glassBoxes: Box[] = [];
export const colliders: Rect[] = [];

for (const w of WALLS) {
  const solid = (s: number, e: number) => {
    const r = rectOf(w, s, e);
    wallBoxes.push({ ...r, y0: 0, y1: WALL_H });
    colliders.push(r);
  };
  let cur = w.from;
  for (const o of [...(w.openings ?? [])].sort((p, q) => p.from - q.from)) {
    if (o.from > cur) solid(cur, o.from);
    const r = rectOf(w, o.from, o.to);
    if (o.kind === 'door') {
      wallBoxes.push({ ...r, y0: DOOR_H, y1: WALL_H });
    } else {
      wallBoxes.push({ ...r, y0: 0, y1: SILL }, { ...r, y0: WIN_TOP, y1: WALL_H });
      const mid = (w.a + w.b) / 2;
      const g = rectOf({ ...w, a: mid - 0.015, b: mid + 0.015 }, o.from, o.to);
      glassBoxes.push({ ...g, y0: SILL, y1: WIN_TOP });
      colliders.push(r);
    }
    cur = o.to;
  }
  if (cur < w.to) solid(cur, w.to);
}

// balcony railing (west of room 2)
export const railBoxes: Box[] = [
  { x0: -0.12, x1: -0.06, z0: 3.29, z1: 6.74, y0: 0, y1: 1.0 },
  { x0: -0.12, x1: 1.18, z0: 6.68, z1: 6.74, y0: 0, y1: 1.0 },
];
railBoxes.forEach((b) => colliders.push(b));

/** Building footprint, used for the floor slab and the roof. */
export const footprint: Rect[] = [
  { x0: -0.12, x1: 8.4, z0: -0.12, z1: 3.29 },
  { x0: 1.18, x1: 5.42, z0: 3.29, z1: 6.74 },
  { x0: 5.42, x1: 8.24, z0: 3.29, z1: 6.57 },
];
export const balcony: Rect = { x0: -0.12, x1: 1.18, z0: 3.29, z1: 6.74 };

export type Room = {
  id: string;
  name: string;
  /** area used to lay out furniture */
  rect: Rect;
  /** floor patches belonging to this room */
  floors: Rect[];
  /** rotation of the furniture frame: the "back" wall is the one without doors */
  rot: number;
  mirror?: boolean;
  defaultType: string;
};

export const ROOMS: Room[] = [
  {
    id: 'room1', name: 'Room 1',
    rect: { x0: 0, x1: 4.14, z0: 0, z1: 3.19 },
    floors: [{ x0: 0, x1: 4.14, z0: 0, z1: 3.19 }],
    rot: 0, defaultType: 'bedroom',
  },
  {
    id: 'hall', name: 'Main hall',
    rect: { x0: 4.24, x1: 8.28, z0: 0.24, z1: 3.19 },
    floors: [
      { x0: 4.24, x1: 8.28, z0: 0, z1: 3.19 },
      { x0: 5.42, x1: 6.45, z0: 3.19, z1: 4.77 },
      { x0: 5.72, x1: 6.45, z0: 4.77, z1: 4.95 },
    ],
    rot: -Math.PI / 2, defaultType: 'living',
  },
  {
    id: 'room2', name: 'Room 2',
    rect: { x0: 1.3, x1: 5.3, z0: 3.29, z1: 6.62 },
    floors: [{ x0: 1.3, x1: 5.3, z0: 3.29, z1: 6.62 }],
    rot: Math.PI, mirror: true, defaultType: 'bedroom',
  },
  {
    id: 'small', name: 'Small room',
    rect: { x0: 6.55, x1: 8.12, z0: 3.29, z1: 4.77 },
    floors: [{ x0: 6.55, x1: 8.12, z0: 3.29, z1: 4.77 }],
    rot: -Math.PI / 2, defaultType: 'bathroom',
  },
  {
    id: 'back', name: 'Back room',
    rect: { x0: 5.72, x1: 8.12, z0: 4.95, z1: 6.45 },
    floors: [{ x0: 5.72, x1: 8.12, z0: 4.95, z1: 6.45 }],
    rot: Math.PI, defaultType: 'kitchen',
  },
];

/** [width along the back wall, depth] of a room in its furniture frame */
export function roomDims(r: Room): [number, number] {
  const dx = r.rect.x1 - r.rect.x0;
  const dz = r.rect.z1 - r.rect.z0;
  return Math.abs(Math.sin(r.rot)) > 0.5 ? [dz, dx] : [dx, dz];
}

export function roomAt(x: number, z: number): Room | null {
  for (const r of ROOMS)
    for (const f of r.floors)
      if (x >= f.x0 - 0.06 && x <= f.x1 + 0.06 && z >= f.z0 - 0.06 && z <= f.z1 + 0.06) return r;
  return null;
}

export const START = { x: 5.27, z: -3.2, yaw: Math.PI };
