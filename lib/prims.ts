// Tiny modelling kit: everything in the house is described as a list of
// primitives (boxes, rounded boxes, cylinders, ...) which are merged into a
// handful of meshes per material when rendered.

export type Mat =
  | 'matte' | 'wood' | 'fabric' | 'cloth' | 'metal' | 'chrome' | 'ceramic' | 'gloss'
  | 'glass' | 'glow' | 'shade' | 'screen' | 'mirror' | 'tile' | 'leaf';

export type Prim = {
  s: 'box' | 'rbox' | 'cyl' | 'sph' | 'tor' | 'pleat';
  /** box/rbox: w,h,d · cyl: topRadius,height · sph: radius · tor: radius,tube · pleat: w,h */
  size: [number, number, number];
  /** centre of the primitive */
  pos: [number, number, number];
  color: string;
  mat?: Mat;
  /** euler rotation, applied in Y-X-Z order */
  rx?: number;
  ry?: number;
  rz?: number;
  sc?: [number, number, number];
  /** rbox: corner radius · cyl: bottom radius */
  r?: number;
  arc?: number;
  open?: boolean;
};

export type Opt = Partial<Pick<Prim, 'mat' | 'rx' | 'ry' | 'rz' | 'sc' | 'r' | 'arc' | 'open'>>;

// In all helpers below `y` is the BOTTOM of the shape (except sph/tor/hcyl: centre).
export const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, o: Opt = {}): Prim =>
  ({ s: 'box', size: [w, h, d], pos: [x, y + h / 2, z], color, ...o });
export const rbox = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, o: Opt = {}): Prim =>
  ({ s: 'rbox', size: [w, h, d], pos: [x, y + h / 2, z], color, ...o });
export const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, o: Opt = {}): Prim =>
  ({ s: 'cyl', size: [r, h, 0], pos: [x, y + h / 2, z], color, ...o });
/** horizontal cylinder, centred, lying along the x or z axis */
export const hcyl = (r: number, len: number, x: number, y: number, z: number, axis: 'x' | 'z', color: string, o: Opt = {}): Prim =>
  ({ s: 'cyl', size: [r, len, 0], pos: [x, y, z], color, ...(axis === 'x' ? { rz: Math.PI / 2 } : { rx: Math.PI / 2 }), ...o });
export const sph = (r: number, x: number, y: number, z: number, color: string, o: Opt = {}): Prim =>
  ({ s: 'sph', size: [r, 0, 0], pos: [x, y, z], color, ...o });
export const tor = (R: number, tube: number, x: number, y: number, z: number, color: string, o: Opt = {}): Prim =>
  ({ s: 'tor', size: [R, tube, 0], pos: [x, y, z], color, ...o });
export const pleat = (w: number, h: number, x: number, y: number, z: number, color: string, o: Opt = {}): Prim =>
  ({ s: 'pleat', size: [w, h, 0], pos: [x, y + h / 2, z], color, mat: 'cloth', ...o });

/** Move a group of primitives to (x, z), turned by `ry` around the vertical axis, lifted by `y`. */
export function place(ps: Prim[], x: number, z: number, ry = 0, y = 0): Prim[] {
  const c = Math.cos(ry), s = Math.sin(ry);
  return ps.map((p) => ({
    ...p,
    pos: [x + p.pos[0] * c + p.pos[2] * s, p.pos[1] + y, z - p.pos[0] * s + p.pos[2] * c] as [number, number, number],
    ry: (p.ry ?? 0) + ry,
  }));
}

/** Lean a group (which must not use ry) around the x axis; positive angles tip the top towards +z. */
export function lean(ps: Prim[], a: number): Prim[] {
  const c = Math.cos(a), s = Math.sin(a);
  return ps.map((p) => ({
    ...p,
    pos: [p.pos[0], p.pos[1] * c - p.pos[2] * s, p.pos[1] * s + p.pos[2] * c] as [number, number, number],
    rx: (p.rx ?? 0) + a,
  }));
}

/** k < 0 darkens, k > 0 lightens */
export function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// deterministic pseudo-random numbers so furniture looks the same every time
let _seed = 1;
export const seed = (n: number) => { _seed = Math.max(1, Math.floor(n)) % 2147483647; };
export const rnd = () => { _seed = (_seed * 16807) % 2147483647; return (_seed - 1) / 2147483646; };
export const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length) % a.length];
