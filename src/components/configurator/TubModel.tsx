import { Suspense, useEffect, useMemo } from "react";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { MODELS, SHELL_COLORS, CABINET_FINISHES } from "@/data/models";
import { Tub } from "./Tub";

type Props = {
  modelId: string;
  shellId: string;
  cabinetId: string;
  placement: "vrijstaand" | "ingebouwd";
};

/**
 * If the selected model has a glbUrl, render the GLB (recoloured by
 * material/mesh name, scaled to the model's real-world footprint).
 * Otherwise fall back to the procedural <Tub />.
 *
 * GLB authoring spec (see also data/models.ts):
 *   - shell / acryl / kuip mesh names → recoloured with the chosen shell colour
 *   - cabinet / omkasting / panel     → recoloured with the cabinet finish,
 *                                       hidden when placement === "ingebouwd"
 *   - water                           → replaced with a transmissive material
 * Anything unnamed falls back to a geometric heuristic (largest mesh = shell).
 */
export function TubModel(props: Props) {
  const model = MODELS.find((m) => m.id === props.modelId)!;
  if (!model.glbUrl) return <Tub {...props} />;
  return (
    <Suspense fallback={<LoadingBadge />}>
      <GLBTub url={model.glbUrl} targetW={model.w} targetD={model.d} {...props} />
    </Suspense>
  );
}

function LoadingBadge() {
  return (
    <Html center>
      <div className="glass-panel rounded-full px-4 py-2 text-white text-xs">
        Model laden…
      </div>
    </Html>
  );
}

function GLBTub({
  url,
  shellId,
  cabinetId,
  placement,
  targetW,
  targetD,
}: Props & { url: string; targetW: number; targetD: number }) {
  // Second arg enables the Draco decoder (gstatic CDN); Meshopt is handled
  // automatically, so compressed GLBs from Sketchfab/artists load transparently.
  const gltf = useGLTF(url, true) as unknown as { scene: THREE.Group };
  const shell = SHELL_COLORS.find((c) => c.id === shellId)!;
  const cabinet = CABINET_FINISHES.find((c) => c.id === cabinetId)!;

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // ---- Recolour by material/mesh name, with a geometric fallback ----
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    let matchedShell = false;

    const applyShell = (mesh: THREE.Mesh) => {
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: shell.hex,
        roughness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.4,
      });
    };

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);

      const name = (
        (mesh.material as THREE.Material | undefined)?.name ||
        mesh.name ||
        ""
      ).toLowerCase();

      if (name.includes("shell") || name.includes("acryl") || name.includes("kuip")) {
        applyShell(mesh);
        matchedShell = true;
      } else if (
        name.includes("cabinet") ||
        name.includes("omkasting") ||
        name.includes("panel")
      ) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: cabinet.hex,
          clearcoat: 0,
          roughness: cabinet.kind === "wood" ? 0.75 : 0.55,
          metalness: cabinet.kind === "wood" ? 0.05 : 0.2,
          envMapIntensity: 1.0,
        });
        mesh.visible = placement === "vrijstaand";
      } else if (name.includes("water")) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: "#cdeaf2",
          transmission: 1,
          roughness: 0.05,
          ior: 1.33,
          thickness: 0.2,
          envMapIntensity: 1.4,
        });
      }
    });

    // Fallback: if the GLB doesn't name a shell mesh, recolour the largest
    // mesh so shell-colour selection still works.
    if (!matchedShell && meshes.length) {
      let biggest = meshes[0];
      let bestVol = -1;
      const size = new THREE.Vector3();
      for (const m of meshes) {
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        m.geometry.boundingBox!.getSize(size);
        const vol = size.x * size.y * size.z;
        if (vol > bestVol) {
          bestVol = vol;
          biggest = m;
        }
      }
      applyShell(biggest);
    }
  }, [scene, shell.hex, cabinet.hex, cabinet.kind, placement]);

  // ---- Fixed real-world scale (replaces <Bounds fit>) so larger models
  //      actually look larger, and arbitrary export units are normalised. ----
  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const horiz = Math.max(size.x, size.z) || 1;
    const target = Math.max(targetW, targetD);
    const s = target / horiz;
    const pos: [number, number, number] = [
      -center.x * s,
      -box.min.y * s, // sit on the ground (y = 0)
      -center.z * s,
    ];
    return { scale: s, position: pos };
  }, [scene, targetW, targetD]);

  return (
    <group scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  );
}

// Warm up the loader for any models that ship a GLB.
MODELS.forEach((m) => {
  if (m.glbUrl) useGLTF.preload(m.glbUrl, true);
});
