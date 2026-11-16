// Room purposes and their procedural furniture.
// Furniture is laid out in a local frame: origin at the room centre,
// back wall at z = -d/2, left wall at x = -w/2. The front-right corner is
// kept clear because that is where the doors are.

export type Prim = {
  s: 'box' | 'cyl' | 'sph';
  size: [number, number, number];
  pos: [number, number, number];
  color: string;
  glow?: boolean;
  opacity?: number;
  metal?: boolean;
};

type Extra = Pick<Prim, 'glow' | 'opacity' | 'metal'>;

const box = (w: number, h: number, d: number, x: number, z: number, color: string, y0 = 0, extra: Extra = {}): Prim =>
  ({ s: 'box', size: [w, h, d], pos: [x, y0 + h / 2, z], color, ...extra });
const cyl = (r: number, h: number, x: number, z: number, color: string, y0 = 0, extra: Extra = {}): Prim =>
  ({ s: 'cyl', size: [r, h, 0], pos: [x, y0 + h / 2, z], color, ...extra });
const sph = (r: number, x: number, y: number, z: number, color: string): Prim =>
  ({ s: 'sph', size: [r, 0, 0], pos: [x, y, z], color });

const WOOD = '#8a5a3a';
const WOOD_L = '#c49a6c';
const WHITE = '#f4f4f1';
const DARK = '#2b2d31';
const STEEL = '#b9bec4';

const legs = (w: number, d: number, h: number, x: number, z: number, color: string): Prim[] =>
  [-1, 1].flatMap((i) => [-1, 1].map((j) => box(0.05, h, 0.05, x + (i * (w - 0.08)) / 2, z + (j * (d - 0.08)) / 2, color)));

const chair = (x: number, z: number, bx: number, bz: number, color: string): Prim[] => [
  box(0.42, 0.05, 0.42, x, z, color, 0.42),
  bz ? box(0.42, 0.45, 0.05, x, z + bz * 0.19, color, 0.47) : box(0.05, 0.45, 0.42, x + bx * 0.19, z, color, 0.47),
  ...legs(0.4, 0.4, 0.42, x, z, DARK),
];

const plant = (x: number, z: number): Prim[] => [
  cyl(0.15, 0.32, x, z, '#c9764a'),
  sph(0.28, x, 0.64, z, '#3f8f4f'),
  sph(0.2, x + 0.08, 0.88, z - 0.05, '#55a866'),
];

const rug = (w: number, d: number, x: number, z: number, color: string): Prim => box(w, 0.015, d, x, z, color);

function living(w: number, d: number): Prim[] {
  const B = -d / 2, F = d / 2, L = -w / 2, R = w / 2;
  const sw = Math.min(2.2, w - 0.8);
  const sofa = '#5f7a8c';
  const p: Prim[] = [
    box(sw, 0.42, 0.9, 0, B + 0.52, sofa),
    box(sw, 0.48, 0.22, 0, B + 0.18, sofa, 0.42),
    box(0.2, 0.62, 0.9, -sw / 2 + 0.1, B + 0.52, '#526b7b'),
    box(0.2, 0.62, 0.9, sw / 2 - 0.1, B + 0.52, '#526b7b'),
    box(0.4, 0.14, 0.4, -sw / 4, B + 0.5, '#e3b66b', 0.42),
    box(0.4, 0.14, 0.4, sw / 4, B + 0.5, '#d9dfe3', 0.42),
  ];
  if (d > 2.6) {
    p.push(rug(Math.min(w - 0.8, 2.4), Math.min(d - 1.7, 1.7), 0, B + 1.9, '#d8cbb6'));
    p.push(box(1.0, 0.05, 0.55, 0, B + 1.8, WOOD, 0.36), ...legs(0.95, 0.5, 0.36, 0, B + 1.8, DARK));
  }
  if (d >= 3.2) {
    p.push(box(1.4, 0.45, 0.4, L + 1.2, F - 0.25, WOOD_L));
    p.push(box(1.15, 0.65, 0.05, L + 1.2, F - 0.2, '#111317', 0.58));
  }
  if (w - sw >= 1.2) {
    p.push(...plant(L + 0.35, B + 0.35));
    p.push(cyl(0.14, 0.03, R - 0.35, B + 0.35, DARK), cyl(0.015, 1.5, R - 0.35, B + 0.35, DARK));
    p.push(cyl(0.18, 0.26, R - 0.35, B + 0.35, '#ffe9b8', 1.45, { glow: true }));
  }
  return p;
}

function bed(bw: number, len: number, x: number, B: number, blanket: string): Prim[] {
  const z = B + len / 2 + 0.06;
  return [
    box(bw + 0.1, 0.3, len + 0.05, x, z, WOOD),
    box(bw, 0.2, len, x, z, WHITE, 0.3),
    box(bw + 0.1, 1.0, 0.08, x, B + 0.05, WOOD),
    box(bw + 0.02, 0.07, len * 0.62, x, B + 0.08 + len * 0.69, blanket, 0.47),
    ...(bw > 1.2
      ? [box(0.6, 0.12, 0.38, x - bw / 4, B + 0.36, '#e8e6df', 0.5), box(0.6, 0.12, 0.38, x + bw / 4, B + 0.36, '#e8e6df', 0.5)]
      : [box(0.6, 0.12, 0.38, x, B + 0.36, '#e8e6df', 0.5)]),
  ];
}

function bedroom(w: number, d: number): Prim[] {
  const B = -d / 2, F = d / 2, L = -w / 2;
  const big = w >= 3;
  const bw = big ? 1.6 : Math.min(0.95, w - 0.5);
  const len = Math.min(2.0, d - 0.4);
  const bx = big ? 0 : L + bw / 2 + 0.1;
  const p = bed(bw, len, bx, B, '#7c8fb0');
  if (big) {
    for (const s of [-1, 1]) {
      const nx = s * (bw / 2 + 0.38);
      p.push(box(0.45, 0.5, 0.42, nx, B + 0.26, WOOD_L));
      p.push(cyl(0.05, 0.16, nx, B + 0.26, DARK, 0.5), cyl(0.1, 0.16, nx, B + 0.26, '#ffe9b8', 0.64, { glow: true }));
    }
    if (d >= 3) {
      p.push(box(1.4, 2.1, 0.6, L + 0.8, F - 0.32, WOOD_L));
      p.push(box(0.012, 2.0, 0.01, L + 0.8, F - 0.625, DARK, 0.05));
      p.push(box(0.03, 0.25, 0.03, L + 0.72, F - 0.64, STEEL, 0.95), box(0.03, 0.25, 0.03, L + 0.88, F - 0.64, STEEL, 0.95));
    }
    p.push(rug(bw + 1.0, 1.2, 0, B + len + 0.1, '#d9d2c5'));
  }
  return p;
}

function kids(w: number, d: number): Prim[] {
  const B = -d / 2, L = -w / 2, R = w / 2;
  const len = Math.min(1.9, d - 0.4);
  const p = bed(Math.min(0.9, w - 0.5), len, L + 0.58, B, '#f08a5d');
  if (w >= 2.6) {
    p.push(box(1.1, 0.05, 0.55, R - 0.65, B + 0.32, WHITE, 0.68), ...legs(1.05, 0.5, 0.68, R - 0.65, B + 0.32, '#6fb6d9'));
    p.push(...chair(R - 0.65, B + 0.85, 0, 1, '#f6c445'));
    p.push(cyl(0.9, 0.015, 0.25, B + Math.min(d - 0.9, 2.1), '#7fc8a9'));
    const tz = B + Math.min(d - 0.9, 2.1);
    p.push(box(0.2, 0.2, 0.2, 0.1, tz, '#e4572e', 0.015), box(0.2, 0.2, 0.2, 0.34, tz + 0.1, '#3d8bfd', 0.015));
    p.push(box(0.2, 0.2, 0.2, 0.2, tz + 0.03, '#f6c445', 0.215), sph(0.16, 0.7, 0.175, tz - 0.3, '#d6336c'));
    p.push(box(0.5, 0.4, 0.4, L + 0.3, B + len + 0.5, '#6fb6d9'), box(0.5, 0.4, 0.4, L + 0.3, B + len + 0.95, '#f6c445'));
  }
  return p;
}

function kitchen(w: number, d: number): Prim[] {
  const B = -d / 2, L = -w / 2, R = w / 2;
  const fridge = w >= 2;
  const cw = w - (fridge ? 0.78 : 0.04);
  const cx = L + 0.02 + cw / 2;
  const p: Prim[] = [
    box(cw, 0.86, 0.6, cx, B + 0.31, '#e9e4da'),
    box(cw, 0.04, 0.64, cx, B + 0.33, '#3b3f45', 0.86),
    box(cw, 0.7, 0.35, cx, B + 0.185, '#e9e4da', 1.5),
    box(cw, 0.6, 0.02, cx, B + 0.012, '#cfd8dc', 0.9),
    // stove + oven
    box(0.58, 0.012, 0.5, cx + cw / 4, B + 0.32, '#111317', 0.9),
    box(0.56, 0.5, 0.02, cx + cw / 4, B + 0.615, '#1c1e22', 0.25),
    // sink + tap
    box(0.5, 0.012, 0.4, cx - cw / 4, B + 0.34, STEEL, 0.9, { metal: true }),
    cyl(0.018, 0.25, cx - cw / 4, B + 0.12, STEEL, 0.9, { metal: true }),
  ];
  for (const s of [-1, 1]) {
    p.push(cyl(0.07, 0.006, cx + cw / 4 + s * 0.14, B + 0.22, '#55585e', 0.912));
    p.push(cyl(0.09, 0.006, cx + cw / 4 + s * 0.14, B + 0.44, '#55585e', 0.912));
  }
  if (fridge) {
    p.push(box(0.7, 1.9, 0.68, R - 0.37, B + 0.36, '#d5d9dd', 0, { metal: true }));
    p.push(box(0.03, 0.6, 0.03, R - 0.62, B + 0.72, DARK, 0.9));
  }
  if (w >= 3 && d >= 2.8) {
    const tz = B + d * 0.66;
    p.push(cyl(0.5, 0.04, -0.3, tz, WOOD_L, 0.72), cyl(0.05, 0.72, -0.3, tz, DARK), cyl(0.25, 0.03, -0.3, tz, DARK));
    p.push(...chair(-0.3, tz - 0.62, 0, -1, WOOD), ...chair(-0.3, tz + 0.62, 0, 1, WOOD), ...chair(-0.92, tz, -1, 0, WOOD));
  }
  return p;
}

function dining(w: number, d: number): Prim[] {
  const B = -d / 2, L = -w / 2;
  const tw = Math.max(0.8, Math.min(1.8, w - 1.7));
  const td = Math.min(0.9, d - 1.5);
  const z = d >= 3 ? 0.2 : 0;
  const p: Prim[] = [
    rug(tw + 1.0, td + 1.5, 0, z, '#b9a48a'),
    box(tw, 0.05, td, 0, z, WOOD, 0.72),
    ...legs(tw - 0.1, td - 0.1, 0.72, 0, z, WOOD),
    cyl(0.07, 0.2, 0, z, '#3c6e8f', 0.77),
    sph(0.13, 0, 1.05, z, '#d9534f'),
  ];
  const n = tw >= 1.6 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const cx = n === 1 ? 0 : (i - 0.5) * (tw / 2);
    p.push(...chair(cx, z - td / 2 - 0.2, 0, -1, WOOD_L), ...chair(cx, z + td / 2 + 0.2, 0, 1, WOOD_L));
  }
  if (w >= 3.4) p.push(...chair(-tw / 2 - 0.25, z, -1, 0, WOOD_L));
  if (d >= 3 && w >= 3) {
    p.push(box(1.5, 0.8, 0.4, 0, B + 0.22, WOOD_L), ...plant(L + 0.35, B + 0.35));
  }
  return p;
}

function bathroom(w: number, d: number): Prim[] {
  const B = -d / 2, F = d / 2, L = -w / 2, R = w / 2;
  const glass = { opacity: 0.25 };
  const p: Prim[] = [];
  const tx = R - 0.38;
  // toilet
  p.push(box(0.38, 0.4, 0.5, tx, B + 0.43, WHITE), box(0.42, 0.38, 0.18, tx, B + 0.1, WHITE, 0.38));
  p.push(box(0.4, 0.03, 0.46, tx, B + 0.44, '#e3e3df', 0.4));
  if (w >= 2.8) {
    // bathtub + vanity
    p.push(box(0.78, 0.55, 1.7, L + 0.4, B + 0.86, WHITE), box(0.62, 0.02, 1.5, L + 0.4, B + 0.86, '#bfe3ee', 0.55));
    const vx = (L + 0.78 + tx - 0.19) / 2;
    p.push(box(0.8, 0.8, 0.5, vx, B + 0.26, WOOD_L), box(0.84, 0.04, 0.54, vx, B + 0.27, WHITE, 0.8));
    p.push(box(0.7, 0.7, 0.02, vx, B + 0.012, '#cfe6ee', 1.1, { metal: true }));
    p.push(rug(0.9, 0.55, vx, B + 1.0, '#7fb7c9'));
  } else {
    // corner shower + wall sink
    p.push(box(0.8, 0.06, 0.8, L + 0.4, B + 0.4, WHITE));
    p.push(box(0.8, 1.9, 0.02, L + 0.4, B + 0.8, '#bfe3ee', 0.06, glass), box(0.02, 1.9, 0.8, L + 0.8, B + 0.4, '#bfe3ee', 0.06, glass));
    p.push(cyl(0.012, 2.0, L + 0.08, B + 0.08, STEEL, 0, { metal: true }), cyl(0.09, 0.02, L + 0.14, B + 0.14, STEEL, 1.98, { metal: true }));
    const sz = F - 0.5;
    p.push(box(0.4, 0.12, 0.45, L + 0.22, sz, WHITE, 0.75), box(0.14, 0.75, 0.14, L + 0.12, sz, WHITE));
    p.push(box(0.02, 0.6, 0.4, L + 0.012, sz, '#cfe6ee', 1.1, { metal: true }));
    p.push(rug(0.5, 0.4, Math.min(0.1, R - 0.9), sz - 0.1, '#7fb7c9'));
  }
  return p;
}

function office(w: number, d: number): Prim[] {
  const B = -d / 2, L = -w / 2, R = w / 2;
  const dw = Math.min(1.5, w - 0.3);
  const p: Prim[] = [
    box(dw, 0.05, 0.7, 0, B + 0.4, WOOD_L, 0.72),
    box(0.04, 0.72, 0.66, -dw / 2 + 0.03, B + 0.4, DARK),
    box(0.04, 0.72, 0.66, dw / 2 - 0.03, B + 0.4, DARK),
    box(0.6, 0.36, 0.03, 0, B + 0.2, '#111317', 0.87),
    box(0.06, 0.1, 0.04, 0, B + 0.2, DARK, 0.77),
    box(0.42, 0.02, 0.14, 0, B + 0.5, '#d8dadd', 0.77),
    // chair
    cyl(0.26, 0.04, 0, B + 1.1, DARK), cyl(0.03, 0.42, 0, B + 1.1, STEEL, 0.04),
    box(0.46, 0.07, 0.46, 0, B + 1.1, '#34495e', 0.44),
    box(0.44, 0.55, 0.06, 0, B + 1.32, '#34495e', 0.5),
  ];
  if (w >= 3) {
    p.push(box(0.9, 1.9, 0.32, R - 0.5, B + 0.18, WOOD));
    const books = ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#8e44ad'];
    for (let i = 0; i < 4; i++)
      p.push(box(0.74, 0.28, 0.02, R - 0.5, B + 0.35, books[i], 0.25 + i * 0.42), box(0.82, 0.03, 0.03, R - 0.5, B + 0.35, WOOD_L, 0.2 + i * 0.42));
    p.push(...plant(L + 0.35, B + 0.35));
  }
  if (d > 2.6) p.push(rug(Math.min(w - 0.6, 2.2), 1.4, 0, B + 1.3, '#59606b'));
  return p;
}

function gym(w: number, d: number): Prim[] {
  const B = -d / 2, L = -w / 2, R = w / 2;
  const p: Prim[] = [
    rug(w - 0.3, d - 0.3, 0, 0, '#26282c'),
    box(Math.min(w - 0.5, 2.6), 1.6, 0.02, 0, B + 0.012, '#cfe6ee', 0.3, { metal: true }),
  ];
  if (w >= 2.6 && d >= 2.6) {
    const tx = L + 0.6;
    p.push(box(0.7, 0.16, 1.6, tx, B + 1.0, DARK), box(0.52, 0.01, 1.3, tx, B + 1.05, '#55585e', 0.16));
    p.push(box(0.05, 1.1, 0.05, tx - 0.3, B + 0.3, STEEL, 0.16), box(0.05, 1.1, 0.05, tx + 0.3, B + 0.3, STEEL, 0.16));
    p.push(box(0.66, 0.22, 0.08, tx, B + 0.3, DARK, 1.2));
    // bench
    p.push(box(0.35, 0.08, 1.2, 0.5, B + 1.4, '#b03a2e', 0.42), ...legs(0.3, 1.1, 0.42, 0.5, B + 1.4, DARK));
    if (d >= 3) p.push(box(0.6, 0.012, 1.7, R - 0.9, d / 2 - 1.15, '#8e6bbf', 0.015));
  }
  // dumbbell rack + ball
  const rx = Math.max(R - 0.7, 0);
  p.push(box(1.0, 0.45, 0.35, rx, B + 0.24, '#4a4d53'));
  for (let i = 0; i < 4; i++) p.push(box(0.1, 0.1, 0.28, rx - 0.36 + i * 0.24, B + 0.24, '#15171a', 0.45));
  p.push(sph(0.28, Math.min(L + 0.45, -0.2), 0.3, d / 2 - 0.5, '#3d8bfd'));
  return p;
}

function storage(w: number, d: number): Prim[] {
  const B = -d / 2, L = -w / 2;
  const sw = w - 0.3;
  const p: Prim[] = [];
  for (const s of [-1, 1]) p.push(box(0.04, 2.0, 0.4, (s * sw) / 2, B + 0.22, STEEL));
  const cols = ['#b98b5e', '#c9a57a', '#8fa3ad', '#b98b5e'];
  for (let i = 0; i < 4; i++) {
    const y = 0.15 + i * 0.55;
    p.push(box(sw, 0.03, 0.4, 0, B + 0.22, STEEL, y));
    const n = Math.max(1, Math.floor(sw / 0.55));
    for (let j = 0; j < n; j++)
      if ((i + j) % 4 !== 3) p.push(box(0.42, 0.3 + ((i * 3 + j) % 3) * 0.05, 0.32, -sw / 2 + 0.3 + j * 0.55, B + 0.22, cols[(i + j) % 4], y + 0.03));
  }
  if (d > 2.4) p.push(box(0.5, 0.45, 0.5, L + 0.35, B + 1.0, '#b98b5e'), box(0.4, 0.35, 0.4, L + 0.35, B + 1.0, '#c9a57a', 0.45));
  return p;
}

export type RoomType = {
  label: string;
  floor: string;
  pattern: 'planks' | 'tiles' | 'plain';
  accent: string;
  build: (w: number, d: number) => Prim[];
};

export const ROOM_TYPES: Record<string, RoomType> = {
  living: { label: 'Living room', floor: '#b58a5f', pattern: 'planks', accent: '#e0a45c', build: living },
  bedroom: { label: 'Bedroom', floor: '#c7a57c', pattern: 'planks', accent: '#7c8fb0', build: bedroom },
  kids: { label: 'Kids room', floor: '#d6c39c', pattern: 'planks', accent: '#f08a5d', build: kids },
  kitchen: { label: 'Kitchen', floor: '#d9d7cf', pattern: 'tiles', accent: '#9aa5ad', build: kitchen },
  dining: { label: 'Dining room', floor: '#a67850', pattern: 'planks', accent: '#b5651d', build: dining },
  bathroom: { label: 'Bathroom', floor: '#bcd3dc', pattern: 'tiles', accent: '#5fb3cc', build: bathroom },
  office: { label: 'Office', floor: '#8b8e96', pattern: 'plain', accent: '#5b6b8a', build: office },
  gym: { label: 'Gym', floor: '#6b6e75', pattern: 'plain', accent: '#c0392b', build: gym },
  storage: { label: 'Storage', floor: '#a3a29e', pattern: 'plain', accent: '#8d7b68', build: storage },
  empty: { label: 'Empty', floor: '#cfc8bb', pattern: 'plain', accent: '#b8b2a7', build: () => [] },
};

export const TYPE_IDS = Object.keys(ROOM_TYPES);
