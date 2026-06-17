import { Suspense, useEffect, useMemo } from "react";
import { useGLTF, Bounds, Center, Html } from "@react-three/drei";
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
 * If the selected model has a glbUrl, render the GLB (with shell/cabinet/water
 * meshes recoloured by material/mesh name). Otherwise fall back to the
 * procedural <Tub />.
 */
export function TubModel(props: Props) {
  const model = MODELS.find((m) => m.id === props.modelId)!;
  if (!model.glbUrl) return <Tub {...props} />;
  return (
    <Suspense fallback={<LoadingBadge />}>
      <GLBTub url={model.glbUrl} {...props} />
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

function GLBTub({ url, shellId, cabinetId, placement }: Props & { url: string }) {
  const gltf = useGLTF(url) as unknown as { scene: THREE.Group };
  const shell = SHELL_COLORS.find((c) => c.id === shellId)!;
  const cabinet = CABINET_FINISHES.find((c) => c.id === cabinetId)!;

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const name = ((mesh.material as THREE.Material | undefined)?.name || mesh.name || "").toLowerCase();
      const apply = (color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => {
        const m = new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.15,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 1.4,
          ...opts,
        });
        mesh.material = m;
      };
      if (name.includes("shell") || name.includes("acryl") || name.includes("kuip")) {
        apply(shell.hex);
      } else if (name.includes("cabinet") || name.includes("omkasting") || name.includes("panel")) {
        apply(cabinet.hex, { clearcoat: 0, roughness: cabinet.kind === "wood" ? 0.75 : 0.55, metalness: cabinet.kind === "wood" ? 0.05 : 0.2 });
        mesh.visible = placement === "vrijstaand";
      } else if (name.includes("water")) {
        const water = new THREE.MeshPhysicalMaterial({
          color: "#cdeaf2",
          transmission: 1,
          roughness: 0.05,
          ior: 1.33,
          thickness: 0.2,
          envMapIntensity: 1.4,
        });
        mesh.material = water;
      }
    });
  }, [scene, shell.hex, cabinet.hex, cabinet.kind, placement]);

  return (
    <Bounds fit clip observe margin={1.05}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  );
}