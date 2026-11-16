'use client';

import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import House from './House';
import Player, { Pose, initialPose } from './Player';
import { ROOMS, WALL_H, roomDims, wallBoxes } from '@/lib/house';
import { ROOM_TYPES, TYPE_IDS } from '@/lib/roomTypes';

const STORE_KEY = 'home3d-room-types-v1';

const defaults = (): Record<string, string> => Object.fromEntries(ROOMS.map((r) => [r.id, r.defaultType]));

function loadTypes(): Record<string, string> {
  const d = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    for (const r of ROOMS) if (ROOM_TYPES[saved[r.id]]) d[r.id] = saved[r.id];
  } catch {}
  return d;
}

function Minimap({ types, pose, current }: { types: Record<string, string>; pose: MutableRefObject<Pose>; current: string | null }) {
  const arrow = useRef<SVGGElement>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const p = pose.current;
      arrow.current?.setAttribute('transform', `translate(${p.x} ${p.z}) rotate(${(-p.yaw * 180) / Math.PI})`);
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [pose]);
  return (
    <svg className="minimap" viewBox="-0.7 -1.6 9.7 8.9">
      {ROOMS.map((r) =>
        r.floors.map((f, i) => (
          <rect
            key={r.id + i} x={f.x0} y={f.z0} width={f.x1 - f.x0} height={f.z1 - f.z0}
            fill={ROOM_TYPES[types[r.id]].accent} opacity={r.id === current ? 1 : 0.55}
          />
        )),
      )}
      {wallBoxes.filter((b) => b.y0 === 0 && b.y1 === WALL_H).map((b, i) => (
        <rect key={i} x={b.x0} y={b.z0} width={b.x1 - b.x0} height={b.z1 - b.z0} fill="#f5f5f5" />
      ))}
      <g ref={arrow}>
        <polygon points="0,-0.42 0.26,0.28 0,0.12 -0.26,0.28" fill="#ff4d4d" stroke="#fff" strokeWidth="0.05" />
      </g>
    </svg>
  );
}

export default function HomeViewer() {
  const [types, setTypes] = useState(loadTypes);
  const [active, setActive] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const pose = useRef<Pose>(initialPose());
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const isTouch = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const live = useRef({ active, roomId, types });
  live.current = { active, roomId, types };

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(types)); } catch {}
  }, [types]);

  useEffect(() => {
    // handy for debugging: move the player from the browser console
    (window as unknown as { __pose: Pose }).__pose = pose.current;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const start = useCallback(() => {
    const el = canvasEl.current;
    if (isTouch || !el || !el.requestPointerLock) return setActive(true);
    // if the browser refuses to capture the mouse, fall back to drag-to-look
    try {
      const p = el.requestPointerLock() as unknown as Promise<void> | undefined;
      p?.catch?.(() => setActive(true));
    } catch {
      setActive(true);
    }
  }, [isTouch]);

  const pause = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    setActive(false);
  }, []);

  useEffect(() => {
    const onLock = () => {
      if (!isTouch) setActive(document.pointerLockElement === canvasEl.current);
    };
    const onKey = (e: KeyboardEvent) => {
      const { active: a, roomId: id, types: t } = live.current;
      if (!a) {
        if (e.code === 'Enter') start();
        return;
      }
      if (e.code === 'KeyE' || e.code === 'Escape') pause();
      if (e.code === 'KeyR' && id) {
        const next = TYPE_IDS[(TYPE_IDS.indexOf(t[id]) + 1) % TYPE_IDS.length];
        setTypes({ ...t, [id]: next });
        setToast(`${ROOMS.find((r) => r.id === id)!.name} is now: ${ROOM_TYPES[next].label}`);
      }
    };
    const onLockError = () => setActive(true);
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('pointerlockerror', onLockError);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerlockchange', onLock);
      document.removeEventListener('pointerlockerror', onLockError);
      window.removeEventListener('keydown', onKey);
    };
  }, [isTouch, start, pause]);

  const room = ROOMS.find((r) => r.id === roomId) ?? null;

  return (
    <div className="viewer">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 72, near: 0.05, far: 150 }}
        onCreated={({ gl }) => {
          canvasEl.current = gl.domElement;
        }}
      >
        <color attach="background" args={['#bfe1f7']} />
        <fog attach="fog" args={['#bfe1f7', 30, 90]} />
        <House types={types} />
        <Player active={active} pose={pose} onRoom={setRoomId} />
      </Canvas>

      {active && (
        <>
          <div className="crosshair" />
          <Minimap types={types} pose={pose} current={roomId} />
          <div className="status">
            <strong>{room ? room.name : 'Outside'}</strong>
            {room && <span className="tag">{ROOM_TYPES[types[room.id]].label}</span>}
            {!isTouch && <span className="hint">{room ? 'R: next purpose · ' : ''}E: rooms menu · Shift: run</span>}
          </div>
          {isTouch && (
            <>
              <button className="menu-btn" onClick={pause}>Rooms</button>
              <div className="touch-hint">Left side: move · Right side: look</div>
            </>
          )}
          {toast && <div className="toast">{toast}</div>}
        </>
      )}

      {!active && (
        <div className="overlay">
          <div className="panel">
            <h1>Moamen House</h1>
            <p className="sub">Walk through the house in 3D and decide what every room is for.</p>

            <div className="rooms">
              {ROOMS.map((r) => {
                const [w, d] = roomDims(r);
                return (
                  <label key={r.id} className={r.id === roomId ? 'row here' : 'row'}>
                    <span className="dot" style={{ background: ROOM_TYPES[types[r.id]].accent }} />
                    <span className="rname">
                      {r.name}
                      <small>{w.toFixed(2)} × {d.toFixed(2)} m{r.id === roomId ? ' · you are here' : ''}</small>
                    </span>
                    <select value={types[r.id]} onChange={(e) => setTypes({ ...types, [r.id]: e.target.value })}>
                      {TYPE_IDS.map((t) => (
                        <option key={t} value={t}>{ROOM_TYPES[t].label}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>

            <button className="go" onClick={start}>{roomId === null && pose.current.z < -3 ? 'Enter the house' : 'Continue walking'}</button>
            <button className="reset" onClick={() => setTypes(defaults())}>Reset rooms</button>

            <p className="keys">
              {isTouch
                ? 'Drag on the left half of the screen to walk, on the right half to look around.'
                : 'W A S D / arrows to walk · mouse to look · Shift to run · R changes the room you are standing in · E or Esc opens this menu'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
