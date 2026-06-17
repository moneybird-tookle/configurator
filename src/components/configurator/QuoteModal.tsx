import { useState } from "react";
import { useConfigurator } from "@/store/configurator";
import {
  MODELS,
  SHELL_COLORS,
  CABINET_FINISHES,
  PLACEMENTS,
  SURROUNDINGS,
  formatEUR,
} from "@/data/models";

const SALES_EMAIL = "verkoop@vanbeem.nl";

export function QuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { modelId, shell, cabinet, placement, surrounding, total, toQuery } = useConfigurator();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  if (!open) return null;
  const model = MODELS.find((m) => m.id === modelId)!;
  const sh = SHELL_COLORS.find((c) => c.id === shell)!;
  const ca = CABINET_FINISHES.find((c) => c.id === cabinet)!;
  const pl = PLACEMENTS.find((p) => p.id === placement)!;
  const su = SURROUNDINGS.find((p) => p.id === surrounding)!;
  const configUrl =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?${toQuery()}` : "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      model: model.name,
      shell: sh.name,
      cabinet: ca.name,
      placement: pl.name,
      surrounding: su.name,
      price: total(),
      configUrl,
      ...form,
      source: "configurator",
    };
    console.log("[quote]", payload);

    // No backend yet → open the visitor's mail client with a fully prefilled
    // request so the lead actually reaches the showroom.
    const body = [
      `Naam: ${form.name}`,
      `E-mail: ${form.email}`,
      `Telefoon: ${form.phone}`,
      "",
      "Configuratie:",
      `• Model: ${model.name}`,
      `• Kuipkleur: ${sh.name}`,
      `• Omkasting: ${ca.name}`,
      `• Plaatsing: ${pl.name}`,
      `• Ondergrond: ${su.name}`,
      `• Indicatie totaal: ${formatEUR(total())}`,
      "",
      `Configuratie bekijken: ${configUrl}`,
      "",
      form.message ? `Bericht:\n${form.message}` : "",
    ].join("\n");
    const mailto = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(
      `Offerteaanvraag ${model.name}`,
    )}&body=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") window.location.href = mailto;

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel text-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 font-display">Offerte</div>
            <h3 className="font-display text-xl font-semibold">Jouw configuratie</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm mb-4 grid grid-cols-2 gap-y-1">
          <Row k="Model" v={model.name} />
          <Row k="Kuipkleur" v={sh.name} />
          <Row k="Omkasting" v={ca.name} />
          <Row k="Plaatsing" v={pl.name} />
          <Row k="Ondergrond" v={su.name} />
          <Row k="Totaal" v={formatEUR(total())} bold />
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="font-display text-lg mb-1">Bedankt!</div>
            <p className="text-sm text-white/70">We nemen snel contact met je op.</p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl py-2.5 px-5 text-sm font-medium"
              style={{ background: "#15b9a7", color: "#062b27" }}
            >
              Sluiten
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input label="Naam" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Input label="Telefoon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div>
              <label className="text-xs text-white/60 mb-1 block">Bericht (optioneel)</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#15b9a7]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl py-3 font-medium text-sm shadow-lg"
              style={{ background: "#15b9a7", color: "#062b27" }}
            >
              Verstuur aanvraag
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <>
      <div className="text-white/55">{k}</div>
      <div className={`text-right ${bold ? "font-semibold" : ""}`}>{v}</div>
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#15b9a7]"
      />
    </div>
  );
}