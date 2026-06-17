import { useMemo } from "react";
import { MODELS, type Placement, type Surrounding } from "@/data/models";

type Props = {
  modelId: string;
  placement: Placement;
  surrounding: Surrounding;
};

type Box = { pos: [number, number, number]; size: [number, number, number] };

const FLUSH = 0.4; // narrow framing deck when built-in
const LOUNGE = 1.3; // wide lounging deck on a chosen side

const WOOD = "#6f5234";
const WOOD_DARK = "#3c2a16";

/**
 * Optional wooden platform around the spa — mirrors the Jacuzzi AR
 * configurator's "installation / surrounding" step.
 *
 *  - Built-in placement always gets a flush framing deck flush with the rim.
 *  - The surrounding option widens one or more sides into a lounging deck:
 *      zijkant      → back
 *      hoek-links   → back + left
 *      hoek-rechts  → back + right
 *      rondom       → all four sides
 *
 * The deck is assembled as a hole-free frame: the back/front strips span the
 * full outer width (so corners are filled), and the left/right strips only
 * span the tub depth to avoid overlap.
 */
export function SurroundDeck({ modelId, placement, surrounding }: Props) {
  const model = MODELS.find((m) => m.id === modelId)!;
  const { w, d, h } = model;

  const boxes = useMemo<Box[]>(() => {
    const ext = { back: 0, front: 0, left: 0, right: 0 };
    if (placement === "ingebouwd") {
      ext.back = ext.front = ext.left = ext.right = FLUSH;
    }
    const widen = (s: keyof typeof ext) => (ext[s] = Math.max(ext[s], LOUNGE));
    if (surrounding === "zijkant") widen("back");
    else if (surrounding === "hoek-links") { widen("back"); widen("left"); }
    else if (surrounding === "hoek-rechts") { widen("back"); widen("right"); }
    else if (surrounding === "rondom") { widen("back"); widen("front"); widen("left"); widen("right"); }

    const hw = w / 2;
    const hd = d / 2;
    const outerW = w + ext.left + ext.right;
    const xCenter = (ext.right - ext.left) / 2; // shift when sides differ
    const list: Box[] = [];

    // Back / front span the full outer width so corners are covered.
    if (ext.back > 0)
      list.push({
        pos: [xCenter, h / 2, -(hd + ext.back / 2)],
        size: [outerW, h, ext.back],
      });
    if (ext.front > 0)
      list.push({
        pos: [xCenter, h / 2, hd + ext.front / 2],
        size: [outerW, h, ext.front],
      });
    // Left / right only span the tub depth (corners already filled above).
    if (ext.left > 0)
      list.push({
        pos: [-(hw + ext.left / 2), h / 2, 0],
        size: [ext.left, h, d],
      });
    if (ext.right > 0)
      list.push({
        pos: [hw + ext.right / 2, h / 2, 0],
        size: [ext.right, h, d],
      });
    return list;
  }, [w, d, h, placement, surrounding]);

  if (boxes.length === 0) return null;

  return (
    <group>
      {boxes.map((b, i) => (
        <group key={i}>
          <mesh position={b.pos} castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={WOOD} roughness={0.82} metalness={0.04} />
          </mesh>
          <PlankSeams cx={b.pos[0]} cz={b.pos[2]} sx={b.size[0]} sz={b.size[2]} top={h} />
        </group>
      ))}
    </group>
  );
}

/** Thin dark seams on the deck top so it reads as individual planks. */
function PlankSeams({
  cx,
  cz,
  sx,
  sz,
  top,
}: {
  cx: number;
  cz: number;
  sx: number;
  sz: number;
  top: number;
}) {
  const seams = useMemo(() => {
    const gap = 0.32;
    const n = Math.max(1, Math.floor(sx / gap) - 1);
    const arr: number[] = [];
    for (let i = 1; i <= n; i++) arr.push(-sx / 2 + (i * sx) / (n + 1));
    return arr;
  }, [sx]);

  return (
    <group position={[cx, top + 0.002, cz]}>
      {seams.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, sz]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
