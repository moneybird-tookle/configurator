import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scene } from "@/components/configurator/Scene";
import { Panel } from "@/components/configurator/Panel";
import { QuoteModal } from "@/components/configurator/QuoteModal";
import { ARModal } from "@/components/configurator/ARModal";
import { useConfigurator } from "@/store/configurator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Van Beem Buitenleven — Jacuzzi Configurator" },
      { name: "description", content: "Stel jouw Jacuzzi samen in 3D: kies model, kuipkleur, omkasting en plaatsing. Direct prijsindicatie en offerte." },
      { property: "og:title", content: "Van Beem — Jacuzzi 3D Configurator" },
      { property: "og:description", content: "Configureer en bekijk jouw Jacuzzi in 3D." },
    ],
  }),
  component: Index,
});

function Index() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const loadFromUrl = useConfigurator((s) => s.loadFromUrl);

  useEffect(() => {
    loadFromUrl();
  }, [loadFromUrl]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b1419]">
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* Top-left brand pill */}
      <div className="pointer-events-none absolute top-4 left-4 z-10">
        <div className="glass-panel pointer-events-auto rounded-full px-4 py-2 text-white font-display text-sm tracking-[0.18em]">
          VAN BEEM
        </div>
      </div>

      {/* Top-right trust pill */}
      <div className="pointer-events-none absolute top-4 right-4 z-10">
        <div className="glass-panel pointer-events-auto rounded-full px-3 md:px-4 py-2 text-white text-xs whitespace-nowrap">
          <span className="text-amber-300">★</span> 9,5
          <span className="hidden sm:inline"> · Showroom Zwanenburg</span>
        </div>
      </div>

      {/* Panel — right side desktop, bottom sheet mobile */}
      <div className="pointer-events-none absolute z-10 inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:top-0 md:bottom-0 flex md:items-center md:justify-end p-3 md:p-5">
        <Panel onQuote={() => setQuoteOpen(true)} onAR={() => setArOpen(true)} />
      </div>

      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
      <ARModal open={arOpen} onClose={() => setArOpen(false)} />
    </div>
  );
}
