export type ModelDef = {
  id: string;
  name: string;
  w: number;
  d: number;
  h: number;
  seats: number;
  jets: number;
  price: number;
  lounger: boolean;
  waterfall: boolean;
  highback: boolean;
  glbUrl?: string;
};

export const MODELS: ModelDef[] = [
  { id: "j-215",  name: "Jacuzzi J-215",  w: 1.75, d: 2.03, h: 0.84, seats: 3, jets: 21, price: 12600, lounger: true,  waterfall: false, highback: false },
  { id: "j-355",  name: "Jacuzzi J-355",  w: 2.14, d: 2.31, h: 0.97, seats: 6, jets: 44, price: 22707, lounger: true,  waterfall: false, highback: false },
  { id: "j-375",  name: "Jacuzzi J-375",  w: 2.31, d: 2.31, h: 0.97, seats: 6, jets: 52, price: 23147, lounger: false, waterfall: false, highback: false },
  { id: "j-508l", name: "Jacuzzi J-508L", w: 2.39, d: 2.39, h: 0.94, seats: 7, jets: 60, price: 34932, lounger: true,  waterfall: true,  highback: false },
  { id: "j-509",  name: "Jacuzzi J-509",  w: 2.59, d: 2.59, h: 0.99, seats: 9, jets: 65, price: 39932, lounger: true,  waterfall: true,  highback: true  },
];

export type ShellColor = { id: string; name: string; hex: string; add: number };
export const SHELL_COLORS: ShellColor[] = [
  { id: "porcelain",    name: "Porcelain",    hex: "#f3eee5", add: 0 },
  { id: "platinum",     name: "Platinum",     hex: "#c7cbcf", add: 0 },
  { id: "silver-pearl", name: "Silver Pearl", hex: "#9aa1a8", add: 250 },
  { id: "midnight",     name: "Midnight",     hex: "#23272e", add: 450 },
];

export type CabinetFinish = {
  id: string;
  name: string;
  hex: string;
  kind: "matte" | "wood";
  add: number;
};
export const CABINET_FINISHES: CabinetFinish[] = [
  { id: "brushed-grey",    name: "Brushed Grey",    hex: "#6b7075", kind: "matte", add: 0 },
  { id: "modern-hardwood", name: "Modern Hardwood", hex: "#8a5a32", kind: "wood",  add: 0 },
  { id: "smoked-ebony",    name: "Smoked Ebony",    hex: "#332218", kind: "wood",  add: 0 },
];

export type Placement = "vrijstaand" | "ingebouwd";
export const PLACEMENTS: { id: Placement; name: string; add: number }[] = [
  { id: "vrijstaand", name: "Vrijstaand", add: 0 },
  { id: "ingebouwd",  name: "Ingebouwd",  add: 0 },
];

// Surrounding deck ("ondergrond") — mirrors the Jacuzzi AR configurator's
// installation step: an optional wooden lounging platform around the spa.
export type Surrounding =
  | "geen"
  | "zijkant"
  | "hoek-links"
  | "hoek-rechts"
  | "rondom";
export const SURROUNDINGS: { id: Surrounding; name: string; add: number }[] = [
  { id: "geen",        name: "Geen",        add: 0 },
  { id: "zijkant",     name: "Zijkant",     add: 1450 },
  { id: "hoek-links",  name: "Hoek links",  add: 2300 },
  { id: "hoek-rechts", name: "Hoek rechts", add: 2300 },
  { id: "rondom",      name: "Rondom",      add: 3900 },
];

export function formatEUR(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}