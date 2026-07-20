"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export type SukkahType = "Canvas" | "Modular" | "Construction";

// Holographic neon palette, per the business's own color call (not a
// realistic material study): beams are always orange, s'chach is always
// green leaves, and the wall color/texture treatment is what changes with
// the selected construction method — canvas drapes (with a breeze), wood/
// modular are paneled with seams and a steel-frame accent (structural
// reference only: canvas sukkah.jpg / construction.jpg / modular.jpg,
// project root).
const BEAM_COLOR = "#ff7a1a";
const SCHACH_COLOR = "#3fb26a";
const FRAME_ACCENT = "#cdd3d8";
const WALL_COLOR: Record<SukkahType, string> = {
  Construction: "#e0a06b",
  Canvas: "#9aa3ab",
  Modular: "#6b4230",
};

const WIDTH = 4;
const DEPTH = 3.2;
const HEIGHT = 2.4;
const HX = WIDTH / 2;
const HZ = DEPTH / 2;
const DOOR_W = 1.3;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function hologramMaterial(color: string, opacity: number, emissiveIntensity: number) {
  return (
    <meshPhysicalMaterial
      color={color}
      emissive={color}
      emissiveIntensity={emissiveIntensity}
      transparent
      opacity={opacity}
      roughness={0.25}
      metalness={0.1}
      transmission={0.15}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

function Post({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, HEIGHT / 2, z]}>
      <cylinderGeometry args={[0.055, 0.055, HEIGHT, 10]} />
      {hologramMaterial(BEAM_COLOR, 0.9, 0.7)}
      <Edges color={BEAM_COLOR} threshold={1} />
    </mesh>
  );
}

function Beam({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <mesh position={mid} rotation={[euler.x, euler.y, euler.z]}>
      <boxGeometry args={[length, 0.08, 0.08]} />
      {hologramMaterial(BEAM_COLOR, 0.9, 0.7)}
      <Edges color={BEAM_COLOR} threshold={1} />
    </mesh>
  );
}

// A draped panel — real curtain-fold geometry (not a flat sheet), with a
// gentle continuous breeze sway when `breeze` is true (Canvas walls only).
function DrapedPanel({
  width,
  height,
  color,
  opacity,
  breeze,
}: {
  width: number;
  height: number;
  color: string;
  opacity: number;
  breeze: boolean;
}) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(width, height, 28, 1), [width, height]);
  const baseZ = useMemo(() => {
    const pos = geometry.attributes.position;
    const arr = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      arr[i] = Math.sin((x / width) * Math.PI * 8) * 0.16 + Math.sin((x / width) * Math.PI * 2.3) * 0.08;
    }
    return arr;
  }, [geometry, width]);

  useEffect(() => {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, baseZ[i]);
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [geometry, baseZ]);

  useFrame((state) => {
    if (!breeze) return;
    const pos = geometry.attributes.position;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const sway = Math.sin(t * 1.15 + x * 1.6) * 0.035 + Math.sin(t * 0.6 + x * 0.7) * 0.02;
      pos.setZ(i, baseZ[i] + sway);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return <mesh geometry={geometry}>{hologramMaterial(color, opacity, 0.3)}</mesh>;
}

// Wood/modular plank seams — a handful of vertical seam lines plus a
// steel-frame border, matching the visible plank divisions and aluminum
// framing in construction.jpg / modular.jpg.
function PanelDetail({ width, height, seamCount }: { width: number; height: number; seamCount: number }) {
  return (
    <group position={[0, 0, 0.012]}>
      {Array.from({ length: seamCount }).map((_, i) => {
        const x = -width / 2 + ((i + 1) / (seamCount + 1)) * width;
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <planeGeometry args={[0.012, height * 0.98]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.16} />
          </mesh>
        );
      })}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={FRAME_ACCENT} transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}

function WallPanel({
  center,
  size,
  rotationY = 0,
  sukkahType,
  color,
  opacity,
}: {
  center: [number, number, number];
  size: [number, number];
  rotationY?: number;
  sukkahType: SukkahType;
  color: string;
  opacity: number;
}) {
  const isDraped = sukkahType === "Canvas";

  return (
    <group position={center} rotation={[0, rotationY, 0]}>
      {isDraped ? (
        <DrapedPanel width={size[0]} height={size[1]} color={color} opacity={opacity} breeze />
      ) : (
        <>
          <mesh>
            <planeGeometry args={size} />
            {hologramMaterial(color, opacity, 0.35)}
          </mesh>
          {opacity > 0.15 && (
            <PanelDetail width={size[0]} height={size[1]} seamCount={sukkahType === "Modular" ? 2 : 4} />
          )}
        </>
      )}
      <Edges geometry={new THREE.PlaneGeometry(...size)} color={color} threshold={1} />
    </group>
  );
}

// The door: on the front wall, a portion of it (not the whole wall).
// Construction/Modular hinge at the left edge of the doorway and swing
// outward, away from the interior. Canvas parts down the middle and each
// half rolls up toward the top beam, like a blind.
function Door({
  sukkahType,
  color,
  opacity,
  doorOpen,
}: {
  sukkahType: SukkahType;
  color: string;
  opacity: number;
  doorOpen: number;
}) {
  if (sukkahType === "Canvas") {
    const flapWidth = DOOR_W / 2;
    const part = doorOpen * DOOR_W * 0.3;
    const scaleY = 1 - doorOpen * 0.82;
    const centerY = HEIGHT - (HEIGHT * scaleY) / 2;
    return (
      <group position={[0, 0, HZ]}>
        <group position={[-flapWidth / 2 - part, centerY, 0]} scale={[1, scaleY, 1]}>
          <DrapedPanel width={flapWidth} height={HEIGHT} color={color} opacity={opacity} breeze />
        </group>
        <group position={[flapWidth / 2 + part, centerY, 0]} scale={[1, scaleY, 1]}>
          <DrapedPanel width={flapWidth} height={HEIGHT} color={color} opacity={opacity} breeze />
        </group>
      </group>
    );
  }

  // Hinge at the left edge of the doorway (world x = -DOOR_W/2), panel
  // extends +DOOR_W in local space toward the doorway's right edge, so
  // rotating negatively around Y swings the leading edge toward +Z —
  // outward, away from the box interior (which sits at z < HZ).
  return (
    <group position={[-DOOR_W / 2, 0, HZ]} rotation={[0, -doorOpen * (Math.PI * 0.52), 0]}>
      <WallPanel
        center={[DOOR_W / 2, HEIGHT / 2, 0]}
        size={[DOOR_W, HEIGHT]}
        sukkahType={sukkahType}
        color={color}
        opacity={opacity}
      />
    </group>
  );
}

// The s'chach roof — real palm-frond clusters (reference: palmfronds.jpg),
// fanned blades radiating from a base point. A pool of distinct frond
// shapes (varied blade count/spread/length) keeps them from looking
// identical; a jittered grid (not pure random scatter) gives full,
// gap-free coverage across the roof.
// Each blade is a blunt-tipped quad (base-left, base-right, tip-right,
// tip-left) rather than a needle-sharp triangle — reads as a rounded leaf
// blade, not a spike.
function frondGeometry(bladeCount: number, spread: number, length: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  let vertIndex = 0;
  for (let i = 0; i < bladeCount; i++) {
    const t = bladeCount === 1 ? 0 : i / (bladeCount - 1) - 0.5;
    const angle = t * spread;
    const len = length * (0.8 + 0.35 * Math.cos(t * Math.PI));
    const dirX = Math.sin(angle);
    const dirY = Math.cos(angle);
    const perpX = -dirY * 0.036;
    const perpY = dirX * 0.036;
    const tipPerpX = -dirY * 0.014;
    const tipPerpY = dirX * 0.014;
    const tipX = dirX * len;
    const tipY = dirY * len;
    positions.push(
      -perpX, -perpY, 0,
      perpX, perpY, 0,
      tipX + tipPerpX, tipY + tipPerpY, 0,
      tipX - tipPerpX, tipY - tipPerpY, 0
    );
    indices.push(vertIndex, vertIndex + 1, vertIndex + 2, vertIndex, vertIndex + 2, vertIndex + 3);
    vertIndex += 4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const FROND_POOL_CONFIGS: [bladeCount: number, spreadFactor: number, length: number][] = [
  [7, 0.7, 0.42],
  [9, 0.8, 0.55],
  [11, 0.9, 0.48],
  [8, 0.65, 0.6],
  [10, 0.85, 0.4],
  [6, 0.6, 0.52],
];

function Schach({ opacity }: { opacity: number }) {
  const frondPool = useMemo(
    () => FROND_POOL_CONFIGS.map(([bladeCount, spread, length]) => frondGeometry(bladeCount, Math.PI * spread, length)),
    []
  );

  // Jittered grid across the roof — every cell gets a frond, so the top is
  // fully covered with no gaps, while jitter + a varied pool keeps it from
  // reading as a repeated tile.
  const cols = 15;
  const rows = 12;
  const ROOF_OVERHANG = 1.1;
  const instances = useMemo(() => {
    const arr: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: number;
      hue: number;
      poolIndex: number;
    }[] = [];
    let i = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        i++;
        const cellW = (WIDTH + ROOF_OVERHANG) / cols;
        const cellD = (DEPTH + ROOF_OVERHANG) / rows;
        const jitterX = (seededRandom(i * 3 + 1) - 0.5) * cellW * 0.9;
        const jitterZ = (seededRandom(i * 3 + 2) - 0.5) * cellD * 0.9;
        const x = -((WIDTH + ROOF_OVERHANG) / 2) + (c + 0.5) * cellW + jitterX;
        const z = -((DEPTH + ROOF_OVERHANG) / 2) + (r + 0.5) * cellD + jitterZ;
        arr.push({
          position: [x, HEIGHT + 0.03 + seededRandom(i * 3 + 3) * 0.08, z],
          rotation: [
            // "a bit flatter" — narrower tilt range than before, still with
            // some texture so it doesn't read as a rigid tiled grid.
            -Math.PI / 2 + (seededRandom(i * 7 + 1) - 0.5) * 0.18,
            seededRandom(i * 7 + 2) * Math.PI * 2,
            0,
          ],
          // Bigger + more overlap than a tight tile grid, so there's no
          // visible gap between neighboring fronds at any angle.
          scale: 2.1 + seededRandom(i * 7 + 3) * 1.1,
          hue: seededRandom(i * 7 + 4),
          poolIndex: Math.floor(seededRandom(i * 7 + 5) * FROND_POOL_CONFIGS.length),
        });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {instances.map((inst, i) => {
        const color = new THREE.Color(SCHACH_COLOR);
        color.offsetHSL((inst.hue - 0.5) * 0.06, (inst.hue - 0.5) * 0.1, (inst.hue - 0.5) * 0.14);
        return (
          <mesh
            key={i}
            position={inst.position}
            rotation={inst.rotation}
            scale={inst.scale}
            geometry={frondPool[inst.poolIndex]}
          >
            {hologramMaterial(`#${color.getHexString()}`, opacity, 0.5)}
          </mesh>
        );
      })}
    </group>
  );
}

export function SukkahModel({
  stage,
  sukkahType,
  followPointer = true,
}: {
  /** 0 = frame only, 1 = walls, 2 = complete with s'chach. Fractional values crossfade. */
  stage: number;
  sukkahType: SukkahType;
  followPointer?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const wallColor = WALL_COLOR[sukkahType];
  const wallOpacity = THREE.MathUtils.clamp(stage - 0, 0, 1) * (sukkahType === "Canvas" ? 0.62 : 0.58);
  const schachOpacity = THREE.MathUtils.clamp(stage - 1, 0, 1) * 0.7;
  const doorOpen = THREE.MathUtils.clamp(stage - 0.5, 0, 1);

  useFrame((state) => {
    if (!group.current) return;
    const targetY = 0.5 + THREE.MathUtils.clamp(state.pointer.x, -1, 1) * 0.35;
    const targetX = followPointer ? THREE.MathUtils.clamp(-state.pointer.y, -1, 1) * 0.08 : 0;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.06);
  });

  const corners = {
    bl: [-HX, -HZ] as const,
    br: [HX, -HZ] as const,
    fl: [-HX, HZ] as const,
    fr: [HX, HZ] as const,
  };

  const segWidth = (WIDTH - DOOR_W) / 2;

  return (
    <group ref={group}>
      <Post x={corners.bl[0]} z={corners.bl[1]} />
      <Post x={corners.br[0]} z={corners.br[1]} />
      <Post x={corners.fl[0]} z={corners.fl[1]} />
      <Post x={corners.fr[0]} z={corners.fr[1]} />
      <Beam from={[corners.bl[0], HEIGHT, corners.bl[1]]} to={[corners.br[0], HEIGHT, corners.br[1]]} />
      <Beam from={[corners.br[0], HEIGHT, corners.br[1]]} to={[corners.fr[0], HEIGHT, corners.fr[1]]} />
      <Beam from={[corners.fr[0], HEIGHT, corners.fr[1]]} to={[corners.fl[0], HEIGHT, corners.fl[1]]} />
      <Beam from={[corners.fl[0], HEIGHT, corners.fl[1]]} to={[corners.bl[0], HEIGHT, corners.bl[1]]} />
      {Array.from({ length: 5 }).map((_, i) => {
        const x = -HX + (i / 4) * WIDTH;
        return <Beam key={i} from={[x, HEIGHT, -HZ]} to={[x, HEIGHT, HZ]} />;
      })}

      {wallOpacity > 0.01 && (
        <>
          <WallPanel
            center={[0, HEIGHT / 2, -HZ]}
            size={[WIDTH, HEIGHT]}
            sukkahType={sukkahType}
            color={wallColor}
            opacity={wallOpacity}
          />
          <WallPanel
            center={[-HX, HEIGHT / 2, 0]}
            size={[DEPTH, HEIGHT]}
            rotationY={Math.PI / 2}
            sukkahType={sukkahType}
            color={wallColor}
            opacity={wallOpacity}
          />
          <WallPanel
            center={[HX, HEIGHT / 2, 0]}
            size={[DEPTH, HEIGHT]}
            rotationY={Math.PI / 2}
            sukkahType={sukkahType}
            color={wallColor}
            opacity={wallOpacity}
          />
          {/* front wall, split around the doorway */}
          <WallPanel
            center={[-(DOOR_W / 2 + segWidth / 2), HEIGHT / 2, HZ]}
            size={[segWidth, HEIGHT]}
            sukkahType={sukkahType}
            color={wallColor}
            opacity={wallOpacity}
          />
          <WallPanel
            center={[DOOR_W / 2 + segWidth / 2, HEIGHT / 2, HZ]}
            size={[segWidth, HEIGHT]}
            sukkahType={sukkahType}
            color={wallColor}
            opacity={wallOpacity}
          />
          <Door sukkahType={sukkahType} color={wallColor} opacity={wallOpacity} doorOpen={doorOpen} />
        </>
      )}

      {schachOpacity > 0.01 && <Schach opacity={schachOpacity} />}

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WIDTH + 1, DEPTH + 1]} />
        <meshBasicMaterial color={BEAM_COLOR} transparent opacity={0.06} />
      </mesh>
    </group>
  );
}
