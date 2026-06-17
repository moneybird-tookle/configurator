import { create } from "zustand";
import {
  MODELS,
  SHELL_COLORS,
  CABINET_FINISHES,
  SURROUNDINGS,
  type Placement,
  type Surrounding,
} from "@/data/models";

export type ConfigState = {
  modelId: string;
  shell: string;
  cabinet: string;
  placement: Placement;
  surrounding: Surrounding;
  set: (p: Partial<Omit<ConfigState, "set" | "total" | "loadFromUrl" | "toQuery">>) => void;
  total: () => number;
  toQuery: () => string;
  loadFromUrl: () => void;
};

export const useConfigurator = create<ConfigState>((set, get) => ({
  modelId: MODELS[0].id,
  shell: SHELL_COLORS[0].id,
  cabinet: CABINET_FINISHES[0].id,
  placement: "vrijstaand",
  surrounding: "geen",
  set: (p) => set(p),
  total: () => {
    const s = get();
    const m = MODELS.find((x) => x.id === s.modelId)!;
    const sh = SHELL_COLORS.find((x) => x.id === s.shell)!;
    const c = CABINET_FINISHES.find((x) => x.id === s.cabinet)!;
    const su = SURROUNDINGS.find((x) => x.id === s.surrounding)!;
    return m.price + sh.add + c.add + su.add;
  },
  toQuery: () => {
    const s = get();
    const p = new URLSearchParams({
      m: s.modelId,
      s: s.shell,
      c: s.cabinet,
      p: s.placement,
      b: s.surrounding,
    });
    return p.toString();
  },
  loadFromUrl: () => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const patch: Partial<ConfigState> = {};
    const m = q.get("m");
    if (m && MODELS.some((x) => x.id === m)) patch.modelId = m;
    const sh = q.get("s");
    if (sh && SHELL_COLORS.some((x) => x.id === sh)) patch.shell = sh;
    const c = q.get("c");
    if (c && CABINET_FINISHES.some((x) => x.id === c)) patch.cabinet = c;
    const p = q.get("p");
    if (p === "vrijstaand" || p === "ingebouwd") patch.placement = p;
    const b = q.get("b");
    if (b && SURROUNDINGS.some((x) => x.id === b)) patch.surrounding = b as Surrounding;
    if (Object.keys(patch).length) set(patch);
  },
}));
