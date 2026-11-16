'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  Box, Rect, ROOMS, Room, WALL_H, balcony, footprint, glassBoxes, railBoxes, roomDims, wallBoxes,
} from '@/lib/house';
import { Prim, ROOM_TYPES, RoomType } from '@/lib/roomTypes';

function BoxMesh({ b, color, shadow = true, opacity }: { b: Box; color: string; shadow?: boolean; opacity?: number }) {
  return (
    <mesh
      position={[(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2]}
      castShadow={shadow}
      receiveShadow
    >
      <boxGeometry args={[b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0]} />
      <meshStandardMaterial
        color={color}
        roughness={opacity ? 0.1 : 0.9}
        transparent={!!opacity}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

function makeFloorTexture(type: RoomType, rx: number, rz: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = type.floor;
  g.fillRect(0, 0, 256, 256);
  if (type.pattern === 'planks') {
    for (let i = 0; i < 4; i++) {
      const y = i * 64;
      g.fillStyle = `rgba(0,0,0,${0.02 + ((i * 37) % 5) * 0.025})`;
      g.fillRect(0, y, 256, 64);
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.fillRect(0, y, 256, 2);
      g.fillRect(((i * 97) % 200) + 20, y, 2, 64);
    }
  } else if (type.pattern === 'tiles') {
    g.fillStyle = 'rgba(0,0,0,0.2)';
    for (const o of [0, 128]) {
      g.fillRect(o, 0, 3, 256);
      g.fillRect(0, o, 256, 3);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, rz);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Floor({ rect, type }: { rect: Rect; type: RoomType }) {
  const w = rect.x1 - rect.x0;
  const d = rect.z1 - rect.z0;
  const tex = useMemo(() => makeFloorTexture(type, w, d), [type, w, d]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[(rect.x0 + rect.x1) / 2, 0.01, (rect.z0 + rect.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={type.pattern === 'tiles' ? 0.35 : 0.75} />
    </mesh>
  );
}

function Furniture({ prims }: { prims: Prim[] }) {
  return (
    <>
      {prims.map((p, i) => (
        <mesh key={i} position={p.pos} castShadow={!p.opacity && !p.glow} receiveShadow>
          {p.s === 'box' && <boxGeometry args={p.size} />}
          {p.s === 'cyl' && <cylinderGeometry args={[p.size[0], p.size[0], p.size[1], 24]} />}
          {p.s === 'sph' && <sphereGeometry args={[p.size[0], 20, 14]} />}
          <meshStandardMaterial
            color={p.color}
            roughness={p.metal ? 0.25 : 0.8}
            metalness={p.metal ? 0.7 : 0}
            transparent={!!p.opacity}
            opacity={p.opacity ?? 1}
            emissive={p.glow ? p.color : '#000000'}
            emissiveIntensity={p.glow ? 0.9 : 0}
          />
        </mesh>
      ))}
    </>
  );
}

function RoomView({ room, typeId }: { room: Room; typeId: string }) {
  const type = ROOM_TYPES[typeId] ?? ROOM_TYPES.empty;
  const [w, d] = roomDims(room);
  const prims = useMemo(() => type.build(w, d), [type, w, d]);
  const cx = (room.rect.x0 + room.rect.x1) / 2;
  const cz = (room.rect.z0 + room.rect.z1) / 2;
  return (
    <group>
      {room.floors.map((f, i) => (
        <Floor key={i} rect={f} type={type} />
      ))}
      <group position={[cx, 0.01, cz]} rotation={[0, room.rot, 0]} scale={[room.mirror ? -1 : 1, 1, 1]}>
        <Furniture prims={prims} />
      </group>
      {/* ceiling lamp */}
      <mesh position={[cx, WALL_H - 0.04, cz]}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
        <meshStandardMaterial color="#fff6dd" emissive="#fff1c9" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[cx, WALL_H - 0.4, cz]} intensity={5} distance={9} decay={1.6} color="#fff0d6" />
    </group>
  );
}

export default function House({ types }: { types: Record<string, string> }) {
  const sun = useMemo(() => {
    const l = new THREE.DirectionalLight('#fff4e0', 2.6);
    l.position.set(-7, 10, -3);
    l.target.position.set(4, 0, 3.2);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera;
    c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 40;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.03;
    return l;
  }, []);

  return (
    <group>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#dfefff', '#8a9a70', 0.6]} />
      <primitive object={sun} />
      <primitive object={sun.target} />

      {/* garden + path to the front door */}
      <mesh position={[4, -0.02, 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#7fa867" roughness={1} />
      </mesh>
      <BoxMesh b={{ x0: 4.57, x1: 5.97, z0: -8, z1: -0.12, y0: -0.05, y1: 0 }} color="#c9c2b4" shadow={false} />
      <BoxMesh b={{ x0: 4.92, x1: 5.62, z0: -0.75, z1: -0.25, y0: 0, y1: 0.02 }} color="#6b4f3a" shadow={false} />

      {/* slab + roof */}
      {[...footprint, balcony].map((r, i) => (
        <BoxMesh key={`s${i}`} b={{ ...r, y0: -0.2, y1: 0 }} color="#b9b2a5" />
      ))}
      {footprint.map((r, i) => (
        <BoxMesh key={`r${i}`} b={{ ...r, y0: WALL_H, y1: WALL_H + 0.18 }} color="#fbfaf7" />
      ))}
      <mesh position={[(balcony.x0 + balcony.x1) / 2, 0.01, (balcony.z0 + balcony.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[balcony.x1 - balcony.x0, balcony.z1 - balcony.z0]} />
        <meshStandardMaterial color="#c8c3b8" />
      </mesh>

      {wallBoxes.map((b, i) => (
        <BoxMesh key={`w${i}`} b={b} color="#f1ede6" />
      ))}
      {railBoxes.map((b, i) => (
        <BoxMesh key={`rl${i}`} b={b} color="#e2ddd3" />
      ))}
      {glassBoxes.map((b, i) => (
        <BoxMesh key={`g${i}`} b={b} color="#bfe3f5" shadow={false} opacity={0.22} />
      ))}

      {/* extra light for the corridor */}
      <pointLight position={[5.93, WALL_H - 0.4, 4.1]} intensity={3} distance={5} decay={1.6} color="#fff0d6" />

      {ROOMS.map((r) => (
        <RoomView key={r.id} room={r} typeId={types[r.id] ?? r.defaultType} />
      ))}
    </group>
  );
}
