'use client';

import { MutableRefObject, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { START, colliders, roomAt } from '@/lib/house';

export type Pose = { x: number; z: number; yaw: number };

const EYE = 1.62;
const RADIUS = 0.2;

function blocked(x: number, z: number) {
  for (const c of colliders) {
    const dx = x - Math.max(c.x0, Math.min(x, c.x1));
    const dz = z - Math.max(c.z0, Math.min(z, c.z1));
    if (dx * dx + dz * dz < RADIUS * RADIUS) return true;
  }
  return false;
}

export default function Player({
  active, pose, onRoom,
}: {
  active: boolean;
  pose: MutableRefObject<Pose>;
  onRoom: (id: string | null) => void;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const st = useRef({ pitch: 0, joyX: 0, joyY: 0 });
  const activeRef = useRef(active);
  const lastRoom = useRef<string | null | undefined>(undefined);
  activeRef.current = active;

  useEffect(() => {
    if (!active) {
      keys.current = {};
      st.current.joyX = st.current.joyY = 0;
    }
  }, [active]);

  useEffect(() => {
    const el = gl.domElement;
    const look = (dx: number, dy: number, k: number) => {
      pose.current.yaw -= dx * k;
      st.current.pitch = Math.max(-1.45, Math.min(1.45, st.current.pitch - dy * k));
    };
    const down = (e: KeyboardEvent) => { if (activeRef.current) keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const mouse = (e: MouseEvent) => {
      if (document.pointerLockElement === el) look(e.movementX, e.movementY, 0.0022);
      // fallback when the mouse could not be captured: hold the button and drag
      else if (activeRef.current && e.buttons & 1) look(-e.movementX, -e.movementY, 0.004);
    };

    // touch: left half of the screen is a joystick, right half looks around
    let moveId = -1, lookId = -1, ox = 0, oy = 0, lx = 0, ly = 0;
    const tStart = (e: TouchEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < window.innerWidth / 2 && moveId < 0) { moveId = t.identifier; ox = t.clientX; oy = t.clientY; }
        else if (lookId < 0) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
    };
    const tMove = (e: TouchEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === moveId) {
          st.current.joyX = Math.max(-1, Math.min(1, (t.clientX - ox) / 50));
          st.current.joyY = Math.max(-1, Math.min(1, (t.clientY - oy) / 50));
        } else if (t.identifier === lookId) {
          look(t.clientX - lx, t.clientY - ly, 0.005);
          lx = t.clientX; ly = t.clientY;
        }
      }
    };
    const tEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === moveId) { moveId = -1; st.current.joyX = st.current.joyY = 0; }
        if (t.identifier === lookId) lookId = -1;
      }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    document.addEventListener('mousemove', mouse);
    el.addEventListener('touchstart', tStart, { passive: false });
    el.addEventListener('touchmove', tMove, { passive: false });
    el.addEventListener('touchend', tEnd);
    el.addEventListener('touchcancel', tEnd);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      document.removeEventListener('mousemove', mouse);
      el.removeEventListener('touchstart', tStart);
      el.removeEventListener('touchmove', tMove);
      el.removeEventListener('touchend', tEnd);
      el.removeEventListener('touchcancel', tEnd);
    };
  }, [gl, pose]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = pose.current;
    const k = keys.current;
    if (activeRef.current) {
      let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - st.current.joyY;
      let s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + st.current.joyX;
      const len = Math.hypot(f, s);
      if (len > 1) { f /= len; s /= len; }
      const speed = (k.ShiftLeft || k.ShiftRight ? 4.2 : 2.4) * dt;
      const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
      const nx = p.x + (-sin * f + cos * s) * speed;
      const nz = p.z + (-cos * f - sin * s) * speed;
      if (!blocked(nx, p.z)) p.x = Math.max(-25, Math.min(33, nx));
      if (!blocked(p.x, nz)) p.z = Math.max(-25, Math.min(31, nz));
    }
    camera.rotation.order = 'YXZ';
    camera.rotation.set(st.current.pitch, p.yaw, 0);
    camera.position.set(p.x, EYE, p.z);

    const id = roomAt(p.x, p.z)?.id ?? null;
    if (id !== lastRoom.current) {
      lastRoom.current = id;
      onRoom(id);
    }
  });

  return null;
}

export const initialPose = (): Pose => ({ ...START });
