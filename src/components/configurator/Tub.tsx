import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MODELS, SHELL_COLORS, CABINET_FINISHES } from "@/data/models";

type Props = {
  modelId: string;
  shellId: string;
  cabinetId: string;
  placement: "vrijstaand" | "ingebouwd";
};

/**
 * Procedural jacuzzi built from simple boxes — guaranteed rendering, no
 * ExtrudeGeometry cap quirks. Geometry:
 *   y = 0          ground / cabinet floor
 *   y = 0..h       cabinet shell (4 walls + floor, hollow top)
 *   y = h          deck rim (4 thin plates around opening)
 *   y = 0.05..h    inner basin walls (4 plates, inset from cabinet)
 *   y = 0.05       basin floor / footwell floor
 *   y = 0.4..h     seat platform (U-shape on 3 sides; +X side keeps footwell open)
 */
export function Tub({ modelId, shellId, cabinetId, placement }: Props) {
  const model = MODELS.find((m) => m.id === modelId)!;
  const shell = SHELL_COLORS.find((c) => c.id === shellId)!;
  const cabinet = CABINET_FINISHES.find((c) => c.id === cabinetId)!;

  const { w, d, h, lounger, waterfall, highback, seats } = model;

  // Deck overhangs cabinet on all sides
  const overhang = 0.06;
  const cabW = w - overhang * 2;
  const cabD = d - overhang * 2;

  // Deck rim thickness (plates between cabinet outer & basin opening)
  const rim = 0.22;
  const innerW = w - rim * 2;
  const innerD = d - rim * 2;

  const seatTop = highback ? 0.46 : 0.4;
  const seatDepth = 0.42; // how far the seat extends inward from the wall
  const floorY = 0.05;

  const showCabinet = placement === "vrijstaand";

  // Sides that get a seat backrest (skip front when lounger present)
  const seatSides: ("front" | "back" | "left" | "right")[] = lounger
    ? ["back", "left", "right"]
    : ["front", "back", "left", "right"];

  return (
    <group>
      {showCabinet && (
        <CabinetShell
          w={cabW}
          d={cabD}
          h={h}
          color={cabinet.hex}
          kind={cabinet.kind}
        />
      )}

      {/* ---- DECK RIM (4 thin plates around the basin opening, slight bevel) ---- */}
      <DeckRim
        outerW={w}
        outerD={d}
        innerW={innerW}
        innerD={innerD}
        y={h}
        color={shell.hex}
      />

      {/* ---- INNER BASIN WALLS + FLOOR ---- */}
      <BasinShell
        innerW={innerW}
        innerD={innerD}
        floorY={floorY}
        topY={h}
        color={shell.hex}
      />

      {/* ---- SEAT PLATFORM (U-shape, leaves footwell open) ---- */}
      <SeatPlatform
        innerW={innerW}
        innerD={innerD}
        seatTop={seatTop}
        seatDepth={seatDepth}
        color={shell.hex}
        sides={lounger ? ["back", "left", "right"] : ["back", "left", "right", "front"]}
      />

      {/* ---- LOUNGER (reclined surface on +X side replacing the seat) ---- */}
      {lounger && (
        <Lounger
          innerW={innerW}
          innerD={innerD}
          seatTop={seatTop}
          color={shell.hex}
        />
      )}

      {/* ---- HEADRESTS ---- */}
      <Headrests
        innerW={innerW}
        innerD={innerD}
        topY={h}
        seats={seats}
        sides={seatSides}
      />

      {/* ---- JET CLUSTERS on backrests ---- */}
      <JetClusters
        innerW={innerW}
        innerD={innerD}
        seatTop={seatTop}
        topY={h}
        totalJets={model.jets}
        sides={seatSides}
      />

      {/* ---- FOOTWELL FLOOR JETS ---- */}
      <FootwellJets innerW={innerW} innerD={innerD} floorY={floorY} />

      {/* ---- ANTI-SLIP DOT PATTERN ---- */}
      <AntiSlipDots
        innerW={innerW}
        innerD={innerD}
        seatDepth={seatDepth}
        y={floorY + 0.006}
        lounger={lounger}
      />

      {/* ---- WATER SURFACE (translucent, gently rippling) ---- */}
      <Water innerW={innerW} innerD={innerD} topY={h} shellHex={shell.hex} />

      {/* ---- WATERFALL on back wall ---- */}
      {waterfall && (
        <Waterfall
          innerD={innerD}
          innerW={innerW}
          topY={h}
        />
      )}

      {/* ---- CONTROL PANEL on the front deck ---- */}
      <ControlPanel d={d} y={h} />
    </group>
  );
}

/* ============================================================ */
/*                       SUB-COMPONENTS                         */
/* ============================================================ */

function CabinetShell({
  w,
  d,
  h,
  color,
  kind,
}: {
  w: number;
  d: number;
  h: number;
  color: string;
  kind: "matte" | "wood";
}) {
  // Procedural wood-grain texture for wooden cabinets, subtle brushed
  // texture for matte. Both feed normal + roughness maps so light catches
  // the surface like real material instead of flat plastic.
  const tex = useMemo(() => buildCabinetTexture(color, kind), [color, kind]);

  // Plinth (recessed base shadow) + top trim cap give it real furniture feel
  const plinthH = 0.06;
  const trimH = 0.025;
  const slatT = 0.022;        // how much each slat protrudes
  const slatW = kind === "wood" ? 0.11 : 0.16;

  return (
    <group>
      {/* Recessed base plinth — dark, sits behind the slats */}
      <mesh receiveShadow position={[0, plinthH / 2, 0]}>
        <boxGeometry args={[w - 0.04, plinthH, d - 0.04]} />
        <meshStandardMaterial color="#0a0c0e" roughness={0.95} />
      </mesh>

      {/* Backing wall behind slats so gaps read as shadow, not see-through */}
      <CabinetBacking w={w} d={d} h={h} />

      {/* Four slatted sides */}
      <SlattedSide
        side="front"
        length={w}
        h={h - plinthH - trimH}
        yBase={plinthH}
        offset={d / 2 - slatT / 2}
        axis="z"
        slatW={slatW}
        slatT={slatT}
        tex={tex}
        kind={kind}
      />
      <SlattedSide
        side="back"
        length={w}
        h={h - plinthH - trimH}
        yBase={plinthH}
        offset={-(d / 2 - slatT / 2)}
        axis="z"
        slatW={slatW}
        slatT={slatT}
        tex={tex}
        kind={kind}
      />
      <SlattedSide
        side="left"
        length={d}
        h={h - plinthH - trimH}
        yBase={plinthH}
        offset={-(w / 2 - slatT / 2)}
        axis="x"
        slatW={slatW}
        slatT={slatT}
        tex={tex}
        kind={kind}
      />
      <SlattedSide
        side="right"
        length={d}
        h={h - plinthH - trimH}
        yBase={plinthH}
        offset={w / 2 - slatT / 2}
        axis="x"
        slatW={slatW}
        slatT={slatT}
        tex={tex}
        kind={kind}
      />

      {/* Top trim — 4 thin strips along the outer edge only, so the basin
          opening stays fully clear. (A solid cap would dome over the tub.) */}
      <TopTrim w={w} d={d} y={h - trimH / 2} t={trimH} />
    </group>
  );
}

function TopTrim({ w, d, y, t }: { w: number; d: number; y: number; t: number }) {
  const strip = 0.05;
  const mat = (
    <meshStandardMaterial color="#15181b" roughness={0.5} metalness={0.25} />
  );
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow position={[0, 0, d / 2 - strip / 2]}>
        <boxGeometry args={[w, t, strip]} />
        {mat}
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -d / 2 + strip / 2]}>
        <boxGeometry args={[w, t, strip]} />
        {mat}
      </mesh>
      <mesh castShadow receiveShadow position={[-w / 2 + strip / 2, 0, 0]}>
        <boxGeometry args={[strip, t, d - strip * 2]} />
        {mat}
      </mesh>
      <mesh castShadow receiveShadow position={[w / 2 - strip / 2, 0, 0]}>
        <boxGeometry args={[strip, t, d - strip * 2]} />
        {mat}
      </mesh>
    </group>
  );
}

function CabinetBacking({ w, d, h }: { w: number; d: number; h: number }) {
  const t = 0.015;
  const inset = 0.03; // sits inside the slats so gaps reveal it
  const mat = (
    <meshStandardMaterial color="#0b0d10" roughness={0.95} metalness={0.05} />
  );
  return (
    <group>
      <mesh position={[0, h / 2, d / 2 - t / 2 - inset]}>
        <boxGeometry args={[w - 0.04, h, t]} />
        {mat}
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + t / 2 + inset]}>
        <boxGeometry args={[w - 0.04, h, t]} />
        {mat}
      </mesh>
      <mesh position={[-w / 2 + t / 2 + inset, h / 2, 0]}>
        <boxGeometry args={[t, h, d - 0.04]} />
        {mat}
      </mesh>
      <mesh position={[w / 2 - t / 2 - inset, h / 2, 0]}>
        <boxGeometry args={[t, h, d - 0.04]} />
        {mat}
      </mesh>
    </group>
  );
}

function SlattedSide({
  length,
  h,
  yBase,
  offset,
  axis,
  slatW,
  slatT,
  tex,
  kind,
}: {
  side: "front" | "back" | "left" | "right";
  length: number;
  h: number;
  yBase: number;
  offset: number;
  axis: "x" | "z";
  slatW: number;
  slatT: number;
  tex: ReturnType<typeof buildCabinetTexture>;
  kind: "matte" | "wood";
}) {
  const gap = 0.004;
  const count = Math.max(6, Math.floor(length / (slatW + gap)));
  const actualW = (length - gap * (count - 1)) / count;

  // Per-slat tonal variation for natural wood look
  const slats = useMemo(() => {
    const arr: { t: number; tone: number }[] = [];
    for (let i = 0; i < count; i++) {
      const t = -length / 2 + actualW / 2 + i * (actualW + gap);
      // deterministic pseudo-random per-slat tone
      const tone = 0.85 + 0.3 * ((Math.sin(i * 12.9898) * 43758.5453) % 1);
      arr.push({ t, tone: Math.max(0.7, Math.min(1.15, tone)) });
    }
    return arr;
  }, [count, actualW, length]);

  const baseGeom: [number, number, number] =
    axis === "z"
      ? [actualW, h, slatT]
      : [slatT, h, actualW];

  return (
    <group>
      {slats.map((s, i) => {
        const pos: [number, number, number] =
          axis === "z"
            ? [s.t, yBase + h / 2, offset]
            : [offset, yBase + h / 2, s.t];
        return (
          <mesh key={i} castShadow receiveShadow position={pos}>
            <boxGeometry args={baseGeom} />
            <meshStandardMaterial
              map={tex.map}
              normalMap={tex.normal}
              normalScale={new THREE.Vector2(kind === "wood" ? 0.6 : 0.25, kind === "wood" ? 0.6 : 0.25)}
              roughnessMap={tex.rough}
              roughness={kind === "wood" ? 0.78 : 0.5}
              metalness={kind === "wood" ? 0.02 : 0.22}
              color={new THREE.Color().setScalar(s.tone)}
              envMapIntensity={0.7}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Build albedo + normal + roughness canvases for cabinet material.
 * Wood: warm grain stripes + dark knots. Matte: subtle brushed noise.
 */
function buildCabinetTexture(color: string, kind: "matte" | "wood") {
  const W = 256;
  const H = 512;

  const base = new THREE.Color(color);
  const make = (paint: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    paint(ctx);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };

  const albedo = make((ctx) => {
    const bg = `rgb(${Math.round(base.r * 255)},${Math.round(base.g * 255)},${Math.round(base.b * 255)})`;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (kind === "wood") {
      // Vertical grain lines
      for (let i = 0; i < 220; i++) {
        const x = Math.random() * W;
        const a = 0.04 + Math.random() * 0.12;
        const dark = Math.random() < 0.5;
        ctx.strokeStyle = dark
          ? `rgba(0,0,0,${a})`
          : `rgba(255,235,200,${a * 0.5})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        // gentle wave so grain looks organic
        for (let y = 0; y < H; y += 8) {
          ctx.lineTo(x + Math.sin(y * 0.02 + i) * 1.5, y);
        }
        ctx.stroke();
      }
      // Knots
      for (let i = 0; i < 4; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = 4 + Math.random() * 9;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(20,10,0,0.55)");
        g.addColorStop(1, "rgba(20,10,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Brushed matte: faint vertical noise + horizontal sheen lines
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
        ctx.fillRect(x, y, 1, 1 + Math.random() * 2);
      }
      for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.03})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        const y = Math.random() * H;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }
    }
  });

  const rough = make((ctx) => {
    ctx.fillStyle = kind === "wood" ? "#b8b8b8" : "#8a8a8a";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      ctx.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${
        Math.random() < 0.5 ? 0 : 255
      },${Math.random() < 0.5 ? 0 : 255},${0.04 + Math.random() * 0.08})`;
      ctx.fillRect(x, y, 1, kind === "wood" ? 6 + Math.random() * 14 : 1);
    }
  });

  // Cheap normal map from height-ish noise
  const normal = make((ctx) => {
    ctx.fillStyle = "rgb(128,128,255)";
    ctx.fillRect(0, 0, W, H);
    if (kind === "wood") {
      for (let i = 0; i < 180; i++) {
        const x = Math.random() * W;
        ctx.strokeStyle = `rgba(${100 + Math.random() * 40},${
          100 + Math.random() * 40
        },255,${0.25 + Math.random() * 0.35})`;
        ctx.lineWidth = 0.6 + Math.random() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y < H; y += 6) {
          ctx.lineTo(x + Math.sin(y * 0.03 + i) * 1.2, y);
        }
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.fillStyle = `rgba(${110 + Math.random() * 35},${
          110 + Math.random() * 35
        },255,0.3)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  return { map: albedo, rough, normal };
}

function DeckRim({
  outerW,
  outerD,
  innerW,
  innerD,
  y,
  color,
}: {
  outerW: number;
  outerD: number;
  innerW: number;
  innerD: number;
  y: number;
  color: string;
}) {
  const t = 0.05; // deck thickness
  const rimW = (outerW - innerW) / 2;
  const rimD = (outerD - innerD) / 2;
  const matProps = {
    color,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.6,
  };
  return (
    <group position={[0, y + t / 2, 0]}>
      {/* Front strip */}
      <mesh castShadow receiveShadow position={[0, 0, innerD / 2 + rimD / 2]}>
        <boxGeometry args={[outerW, t, rimD]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Back */}
      <mesh castShadow receiveShadow position={[0, 0, -innerD / 2 - rimD / 2]}>
        <boxGeometry args={[outerW, t, rimD]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Left */}
      <mesh castShadow receiveShadow position={[-innerW / 2 - rimW / 2, 0, 0]}>
        <boxGeometry args={[rimW, t, innerD]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Right */}
      <mesh castShadow receiveShadow position={[innerW / 2 + rimW / 2, 0, 0]}>
        <boxGeometry args={[rimW, t, innerD]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
    </group>
  );
}

function BasinShell({
  innerW,
  innerD,
  floorY,
  topY,
  color,
}: {
  innerW: number;
  innerD: number;
  floorY: number;
  topY: number;
  color: string;
}) {
  const t = 0.05;
  const wallH = topY - floorY;
  const matProps = {
    color,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.4,
  };
  return (
    <group>
      {/* Floor — full opening width so nothing of the cabinet shows through */}
      <mesh receiveShadow position={[0, floorY + 0.005, 0]}>
        <boxGeometry args={[innerW, 0.01, innerD]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Front */}
      <mesh castShadow receiveShadow position={[0, (floorY + wallH) / 2 + 0.001, innerD / 2 - t / 2]}>
        <boxGeometry args={[innerW, topY, t]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Back */}
      <mesh castShadow receiveShadow position={[0, topY / 2, -innerD / 2 + t / 2]}>
        <boxGeometry args={[innerW, topY, t]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Left */}
      <mesh castShadow receiveShadow position={[-innerW / 2 + t / 2, topY / 2, 0]}>
        <boxGeometry args={[t, topY, innerD - t * 2]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Right */}
      <mesh castShadow receiveShadow position={[innerW / 2 - t / 2, topY / 2, 0]}>
        <boxGeometry args={[t, topY, innerD - t * 2]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
    </group>
  );
}

type Side = "front" | "back" | "left" | "right";

function SeatPlatform({
  innerW,
  innerD,
  seatTop,
  seatDepth,
  color,
  sides,
}: {
  innerW: number;
  innerD: number;
  seatTop: number;
  seatDepth: number;
  color: string;
  sides: Side[];
}) {
  const wallT = 0.05;
  const seatTh = 0.06; // thickness of seat slab
  const matProps = {
    color,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.3,
  };

  // Available inside footprint (between basin walls)
  const fwW = innerW - wallT * 2;
  const fwD = innerD - wallT * 2;

  const pieces: { pos: [number, number, number]; size: [number, number, number] }[] = [];

  if (sides.includes("back")) {
    pieces.push({
      pos: [0, seatTop - seatTh / 2, -fwD / 2 + seatDepth / 2],
      size: [fwW, seatTh, seatDepth],
    });
  }
  if (sides.includes("front")) {
    pieces.push({
      pos: [0, seatTop - seatTh / 2, fwD / 2 - seatDepth / 2],
      size: [fwW, seatTh, seatDepth],
    });
  }
  if (sides.includes("left")) {
    // Skip area already occupied by back/front seats
    const overlapBack = sides.includes("back") ? seatDepth : 0;
    const overlapFront = sides.includes("front") ? seatDepth : 0;
    const len = fwD - overlapBack - overlapFront;
    const z = (overlapBack - overlapFront) / 2;
    pieces.push({
      pos: [-fwW / 2 + seatDepth / 2, seatTop - seatTh / 2, z],
      size: [seatDepth, seatTh, len],
    });
  }
  if (sides.includes("right")) {
    const overlapBack = sides.includes("back") ? seatDepth : 0;
    const overlapFront = sides.includes("front") ? seatDepth : 0;
    const len = fwD - overlapBack - overlapFront;
    const z = (overlapBack - overlapFront) / 2;
    pieces.push({
      pos: [fwW / 2 - seatDepth / 2, seatTop - seatTh / 2, z],
      size: [seatDepth, seatTh, len],
    });
  }

  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} castShadow receiveShadow position={p.pos}>
          <boxGeometry args={p.size} />
          <meshPhysicalMaterial {...matProps} />
        </mesh>
      ))}
    </group>
  );
}

function Lounger({
  innerW,
  innerD,
  seatTop,
  color,
}: {
  innerW: number;
  innerD: number;
  seatTop: number;
  color: string;
}) {
  const matProps = {
    color,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.3,
  };
  return (
    <group>
      {/* Reclined back/seat surface */}
      <mesh
        castShadow
        receiveShadow
        position={[0, seatTop - 0.05, innerD / 2 - 0.35]}
        rotation={[-0.22, 0, 0]}
      >
        <boxGeometry args={[innerW - 0.2, 0.08, 0.7]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
      {/* Foot rest mound */}
      <mesh castShadow position={[0, 0.14, innerD / 2 - 0.85]}>
        <boxGeometry args={[0.6, 0.18, 0.2]} />
        <meshPhysicalMaterial {...matProps} />
      </mesh>
    </group>
  );
}

function Headrests({
  innerW,
  innerD,
  topY,
  seats,
  sides,
}: {
  innerW: number;
  innerD: number;
  topY: number;
  seats: number;
  sides: Side[];
}) {
  const perSide = Math.max(1, Math.round(seats / sides.length));
  const items: { pos: [number, number, number]; rotY: number }[] = [];
  for (const side of sides) {
    for (let i = 0; i < perSide; i++) {
      const t = (i + 0.5) / perSide - 0.5;
      if (side === "back") {
        items.push({
          pos: [t * (innerW - 0.5), topY - 0.03, -innerD / 2 + 0.12],
          rotY: 0,
        });
      } else if (side === "front") {
        items.push({
          pos: [t * (innerW - 0.5), topY - 0.03, innerD / 2 - 0.12],
          rotY: Math.PI,
        });
      } else if (side === "left") {
        items.push({
          pos: [-innerW / 2 + 0.12, topY - 0.03, t * (innerD - 0.5)],
          rotY: Math.PI / 2,
        });
      } else {
        items.push({
          pos: [innerW / 2 - 0.12, topY - 0.03, t * (innerD - 0.5)],
          rotY: -Math.PI / 2,
        });
      }
    }
  }
  return (
    <group>
      {items.map((r, i) => (
        <mesh key={i} castShadow position={r.pos} rotation={[0, r.rotY, 0]}>
          <boxGeometry args={[0.28, 0.06, 0.13]} />
          <meshStandardMaterial color="#0e1114" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function JetClusters({
  innerW,
  innerD,
  seatTop,
  topY,
  totalJets,
  sides,
}: {
  innerW: number;
  innerD: number;
  seatTop: number;
  topY: number;
  totalJets: number;
  sides: Side[];
}) {
  const perSide = Math.max(4, Math.floor(totalJets / sides.length));
  const items: { pos: [number, number, number]; rotY: number; size: number }[] = [];

  const yLevels = [seatTop + 0.08, seatTop + 0.22, seatTop + 0.36, topY - 0.18];

  for (const side of sides) {
    for (let i = 0; i < perSide; i++) {
      const t = (i + 0.5) / perSide - 0.5;
      const y = yLevels[i % yLevels.length];
      const size = i % 4 === 0 ? 0.05 : 0.028;
      if (side === "back") {
        items.push({
          pos: [t * (innerW - 0.4), y, -innerD / 2 + 0.06],
          rotY: 0,
          size,
        });
      } else if (side === "front") {
        items.push({
          pos: [t * (innerW - 0.4), y, innerD / 2 - 0.06],
          rotY: Math.PI,
          size,
        });
      } else if (side === "left") {
        items.push({
          pos: [-innerW / 2 + 0.06, y, t * (innerD - 0.4)],
          rotY: Math.PI / 2,
          size,
        });
      } else {
        items.push({
          pos: [innerW / 2 - 0.06, y, t * (innerD - 0.4)],
          rotY: -Math.PI / 2,
          size,
        });
      }
    }
  }

  return (
    <group>
      {items.map((j, i) => (
        <ChromeJet
          key={i}
          position={j.pos}
          rotation={[Math.PI / 2, 0, j.rotY]}
          size={j.size}
        />
      ))}
    </group>
  );
}

function FootwellJets({
  innerW,
  innerD,
  floorY,
}: {
  innerW: number;
  innerD: number;
  floorY: number;
}) {
  const items = useMemo(() => {
    const arr: [number, number, number][] = [];
    const r = Math.min(innerW, innerD) * 0.16;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      arr.push([Math.cos(a) * r, floorY + 0.012, Math.sin(a) * r]);
    }
    return arr;
  }, [innerW, innerD, floorY]);
  return (
    <group>
      {items.map((p, i) => (
        <ChromeJet key={i} position={p} size={0.028} />
      ))}
    </group>
  );
}

function ChromeJet({
  position,
  rotation = [0, 0, 0],
  size = 0.04,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[size, size, 0.012, 18]} />
        <meshStandardMaterial
          color="#dde2e6"
          metalness={1}
          roughness={0.13}
          envMapIntensity={1.8}
        />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[size * 0.45, size * 0.45, 0.014, 14]} />
        <meshStandardMaterial color="#0e2b3d" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function AntiSlipDots({
  innerW,
  innerD,
  seatDepth,
  y,
  lounger,
}: {
  innerW: number;
  innerD: number;
  seatDepth: number;
  y: number;
  lounger: boolean;
}) {
  const dots = useMemo(() => {
    const arr: [number, number, number][] = [];
    const fwHalfX = innerW / 2 - seatDepth - 0.08;
    const fwHalfZBack = -innerD / 2 + seatDepth + 0.08;
    const fwHalfZFront = lounger ? innerD / 2 - 0.4 : innerD / 2 - seatDepth - 0.08;
    const xRange = fwHalfX * 2;
    const zRange = fwHalfZFront - fwHalfZBack;
    const cols = 7;
    const rows = 7;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = -fwHalfX + (i / (cols - 1)) * xRange;
        const z = fwHalfZBack + (j / (rows - 1)) * zRange;
        arr.push([x, y, z]);
      }
    }
    return arr;
  }, [innerW, innerD, seatDepth, y, lounger]);
  return (
    <group>
      {dots.map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.012, 0.012, 0.005, 8]} />
          <meshStandardMaterial color="#b8bcc0" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Translucent water plane sitting just below the rim. Uses a procedural
 * ripple normal map whose UV offset scrolls every frame, so the surface
 * shimmers and catches the environment without an expensive simulation.
 */
function Water({
  innerW,
  innerD,
  topY,
  shellHex,
}: {
  innerW: number;
  innerD: number;
  topY: number;
  shellHex: string;
}) {
  const wallT = 0.05;
  const waterY = topY - 0.12; // a hand's width below the rim

  const normalMap = useMemo(() => buildWaterNormal(), []);

  // Tint the water slightly toward the shell colour so dark shells read as
  // deeper water, light shells as a bright spa.
  const tint = useMemo(() => {
    const base = new THREE.Color("#3fb8d8");
    return base.lerp(new THREE.Color(shellHex), 0.18);
  }, [shellHex]);

  useFrame((_, delta) => {
    if (!normalMap) return;
    normalMap.offset.x = (normalMap.offset.x + delta * 0.015) % 1;
    normalMap.offset.y = (normalMap.offset.y + delta * 0.02) % 1;
  });

  return (
    <mesh position={[0, waterY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[innerW - wallT * 2, innerD - wallT * 2, 1, 1]} />
      <meshPhysicalMaterial
        color={tint}
        transparent
        opacity={0.82}
        roughness={0.08}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.04}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.22, 0.22)}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

/** Soft tiling ripple normal map built from layered sine dots. */
function buildWaterNormal() {
  if (typeof document === "undefined") return null;
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(128,128,255)";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 2 + Math.random() * 6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dir = Math.random() < 0.5;
    g.addColorStop(0, dir ? "rgba(150,150,255,0.5)" : "rgba(105,105,255,0.5)");
    g.addColorStop(1, "rgba(128,128,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

function Waterfall({
  innerD,
  innerW,
  topY,
}: {
  innerD: number;
  innerW: number;
  topY: number;
}) {
  return (
    <group position={[innerW * 0.22, topY - 0.06, -innerD / 2 + 0.06]}>
      {/* chrome spout */}
      <mesh>
        <boxGeometry args={[0.32, 0.08, 0.05]} />
        <meshStandardMaterial
          color="#cfd5da"
          metalness={1}
          roughness={0.12}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* glowing water sheet */}
      <mesh position={[0, -0.22, 0.03]}>
        <boxGeometry args={[0.3, 0.4, 0.025]} />
        <meshPhysicalMaterial
          color="#8be0f5"
          transmission={0.9}
          roughness={0.04}
          ior={1.33}
          thickness={0.05}
          emissive="#2a8fc2"
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

function ControlPanel({ d, y }: { d: number; y: number }) {
  return (
    <group position={[0, y + 0.06, d / 2 - 0.16]}>
      <mesh>
        <boxGeometry args={[0.3, 0.012, 0.15]} />
        <meshStandardMaterial color="#0d1316" roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.2, 0.003, 0.07]} />
        <meshStandardMaterial
          color="#34c6ec"
          emissive="#34c6ec"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}