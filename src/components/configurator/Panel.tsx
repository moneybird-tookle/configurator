import { useEffect, useRef, useState } from "react";
import { useConfigurator } from "@/store/configurator";
import { ChevronDown } from "lucide-react";
import {
  MODELS,
  SHELL_COLORS,
  CABINET_FINISHES,
  PLACEMENTS,
  SURROUNDINGS,
  formatEUR,
} from "@/data/models";

function useCountUp(value: number, duration = 600) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (reduced) {
      setV(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const startV = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(startV + (value - startV) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  return v;
}

type Props = { onQuote: () => void; onAR: () => void };

export function Panel({ onQuote, onAR }: Props) {
  const { modelId, shell, cabinet, placement, surrounding, set, total } = useConfigurator();
  const model = MODELS.find((m) => m.id === modelId)!;
  const animated = useCountUp(total());
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto glass-panel rounded-2xl w-full md:w-[360px] text-white shadow-2xl max-h-[85vh] md:max-h-[88vh] flex flex-col">
      {/* Sticky header: prijs + offerte bovenaan */}
      <div className="sticky top-0 z-10 rounded-t-2xl px-5 pt-4 pb-3 bg-[#0b1419]/85 backdrop-blur-md border-b border-white/10">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-display">Totaal</div>
            <div className="font-display text-2xl md:text-3xl font-semibold tabular-nums truncate">
              {formatEUR(animated)}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onQuote}
              className="rounded-xl py-2.5 px-3 md:px-4 font-medium text-xs md:text-sm shadow-lg whitespace-nowrap"
              style={{ background: "#15b9a7", color: "#062b27" }}
            >
              Offerte
            </button>
            <button
              onClick={onAR}
              className="rounded-xl py-2.5 px-3 font-medium text-xs md:text-sm border border-white/15 hover:bg-white/5 whitespace-nowrap"
            >
              AR
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FeatureChip>{model.seats} zits</FeatureChip>
          <FeatureChip>{model.jets} jets</FeatureChip>
          {model.lounger && <FeatureChip>Lounger</FeatureChip>}
          {model.waterfall && <FeatureChip>Waterval</FeatureChip>}
          {model.highback && <FeatureChip>High-back</FeatureChip>}
        </div>
        {/* Mobile-only prominente toggle om opties te openen */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="md:hidden mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold border-2 border-[#15b9a7]/70 bg-[#15b9a7]/10 text-white hover:bg-[#15b9a7]/20 transition"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${open ? "" : "rotate-180"}`}
          />
          {open ? "Sluit opties" : "Pas jouw Jacuzzi aan"}
        </button>
      </div>

      <div className={`overflow-y-auto px-5 py-4 flex-1 ${open ? "block" : "hidden"} md:block`}>
      <Section title="Model">
        <div className="grid grid-cols-1 gap-2">
          {MODELS.map((m) => {
            const active = m.id === modelId;
            return (
              <button
                key={m.id}
                onClick={() => set({ modelId: m.id })}
                className={`text-left rounded-xl px-3 py-2.5 border transition ${
                  active
                    ? "border-[#15b9a7] bg-white/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <div className="font-display font-medium">{m.name}</div>
                  <div className="text-sm text-white/80">{formatEUR(m.price)}</div>
                </div>
                <div className="text-xs text-white/55 mt-0.5">
                  {m.seats} zits · {m.jets} jets
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Kuipkleur">
        <div className="flex flex-wrap gap-2">
          {SHELL_COLORS.map((c) => (
            <Chip
              key={c.id}
              active={c.id === shell}
              onClick={() => set({ shell: c.id })}
              swatch={c.hex}
              label={c.name}
              suffix={c.add ? `+${formatEUR(c.add)}` : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="Omkasting">
        <div className="flex flex-wrap gap-2">
          {CABINET_FINISHES.map((c) => (
            <Chip
              key={c.id}
              active={c.id === cabinet}
              onClick={() => set({ cabinet: c.id })}
              swatch={c.hex}
              label={c.name}
            />
          ))}
        </div>
      </Section>

      <Section title="Plaatsing">
        <div className="grid grid-cols-2 gap-2">
          {PLACEMENTS.map((p) => (
            <button
              key={p.id}
              onClick={() => set({ placement: p.id })}
              className={`rounded-lg px-3 py-2 text-sm border transition ${
                placement === p.id
                  ? "border-[#15b9a7] bg-white/10"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Ondergrond">
        <div className="grid grid-cols-3 gap-2">
          {SURROUNDINGS.map((p) => (
            <button
              key={p.id}
              onClick={() => set({ surrounding: p.id })}
              className={`rounded-lg px-2 py-2 text-xs border transition flex flex-col items-center gap-0.5 ${
                surrounding === p.id
                  ? "border-[#15b9a7] bg-white/10"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              <span>{p.name}</span>
              {p.add > 0 && (
                <span className="text-[10px] text-white/55">+{formatEUR(p.add)}</span>
              )}
            </button>
          ))}
        </div>
      </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/55 mb-2 font-display">
        {title}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  swatch,
  label,
  suffix,
}: {
  active: boolean;
  onClick: () => void;
  swatch: string;
  label: string;
  suffix?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-xs border transition ${
        active
          ? "border-[#15b9a7] bg-white/10"
          : "border-white/10 hover:bg-white/5"
      }`}
    >
      <span
        className="w-5 h-5 rounded-full border border-white/20"
        style={{ background: swatch }}
      />
      <span>{label}</span>
      {suffix && <span className="text-white/55">{suffix}</span>}
    </button>
  );
}

function FeatureChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-white/8 border border-white/10 text-white/75">
      {children}
    </span>
  );
}