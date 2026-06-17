import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows, Lightformer } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  N8AO,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useState } from "react";
import { useConfigurator } from "@/store/configurator";
import { TubModel } from "./TubModel";
import { GardenScene } from "./GardenScene";
import { SurroundDeck } from "./SurroundDeck";

function isLowEndDevice() {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;
  return (mem !== undefined && mem <= 4) || cores <= 4;
}

export function Scene() {
  const { modelId, shell, cabinet, placement, surrounding } = useConfigurator();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setLowEnd(isLowEndDevice());
  }, []);

  return (
    <Canvas
      shadows
      dpr={lowEnd ? [1, 1.5] : [1, 2]}
      camera={{ position: [3.6, 3.4, 3.6], fov: 38 }}
      gl={{ antialias: true, toneMappingExposure: 1.05 }}
    >
      <color attach="background" args={["#cfe8f5"]} />
      <fog attach="fog" args={["#cfe8f5", 18, 32]} />

      <ambientLight intensity={0.55} />
      {/* Interior fill so the molded basin isn't pitch black */}
      <pointLight position={[0, 1.4, 0]} intensity={1.4} distance={4} decay={1.4} color="#ffffff" />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={lowEnd ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <Suspense fallback={null}>
        <Environment preset="sunset" environmentIntensity={0.8}>
          <Lightformer
            form="rect"
            intensity={2}
            position={[3, 4, 3]}
            scale={[3, 1.5, 1]}
            target={[0, 0.5, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.4}
            position={[-4, 3, 2]}
            scale={[2, 1, 1]}
            target={[0, 0.5, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1}
            position={[0, 5, -3]}
            scale={[3, 1, 1]}
            target={[0, 0.5, 0]}
          />
        </Environment>

        <GardenScene />
        <SurroundDeck modelId={modelId} placement={placement} surrounding={surrounding} />
        <TubModel modelId={modelId} shellId={shell} cabinetId={cabinet} placement={placement} />

        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.55}
          scale={8}
          blur={2.4}
          far={3}
        />
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.3}
        minDistance={3.2}
        maxDistance={9}
        target={[0, 0.5, 0]}
      />

      <EffectComposer enableNormalPass multisampling={lowEnd ? 0 : 4}>
        {!lowEnd ? (
          <N8AO aoRadius={0.35} intensity={0.9} distanceFalloff={0.8} quality="medium" />
        ) : (
          <></>
        )}
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}