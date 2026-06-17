import { useMemo } from "react";
import * as THREE from "three";

export function GardenScene() {
  const grassColor = "#3d6b3a";

  const shrubs = useMemo(() => {
    const arr: { pos: [number, number, number]; s: number; c: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 6 + Math.random() * 2;
      arr.push({
        pos: [Math.cos(a) * r, 0.3, Math.sin(a) * r],
        s: 0.5 + Math.random() * 0.4,
        c: ["#2d5a32", "#3a6e3d", "#274d2a"][i % 3],
      });
    }
    return arr;
  }, []);

  const flowers = useMemo(() => {
    const arr: { pos: [number, number, number]; c: string }[] = [];
    const colors = ["#e84c6d", "#f0c14b", "#b06ed6", "#ee7a3b", "#f4f1e8"];
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3.5 + Math.random() * 2.5;
      arr.push({
        pos: [Math.cos(a) * r, 0.1, Math.sin(a) * r],
        c: colors[i % colors.length],
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color={grassColor} roughness={1} />
      </mesh>

      {/* Wooden deck */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.1, 4.5]} />
        <meshStandardMaterial color="#7a5230" roughness={0.85} />
      </mesh>
      {/* Deck plank seams */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-2.25 + 0.5 + i * 0.5, 0.0011, 0]}>
          <boxGeometry args={[0.015, 0.002, 4.5]} />
          <meshStandardMaterial color="#3a2614" roughness={1} />
        </mesh>
      ))}

      {/* Stepping stones */}
      {[-3.5, -4.5, -5.5, -6.5].map((x, i) => (
        <mesh key={i} position={[x, 0.01, i * 0.6 - 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.35, 16]} />
          <meshStandardMaterial color="#9a9389" roughness={0.95} />
        </mesh>
      ))}

      {/* Shrubs */}
      {shrubs.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow>
          <sphereGeometry args={[s.s, 12, 12]} />
          <meshStandardMaterial color={s.c} roughness={1} />
        </mesh>
      ))}

      {/* Flowers */}
      {flowers.map((f, i) => (
        <mesh key={i} position={f.pos}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color={f.c} />
        </mesh>
      ))}

      {/* Tree */}
      <group position={[-5, 0, 4]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 2.4, 8]} />
          <meshStandardMaterial color="#5b3a1f" roughness={1} />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[1.4, 16, 16]} />
          <meshStandardMaterial color="#2f5f33" roughness={1} />
        </mesh>
      </group>

      {/* Hedge backdrop */}
      <mesh position={[0, 1, -9]} receiveShadow castShadow>
        <boxGeometry args={[18, 2, 0.8]} />
        <meshStandardMaterial color={"#2a4d2d"} roughness={1} />
      </mesh>

      {/* Sky-ish gradient via large hemisphere */}
      <mesh>
        <sphereGeometry args={[40, 32, 32]} />
        <meshBasicMaterial color={"#cfe8f5"} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}