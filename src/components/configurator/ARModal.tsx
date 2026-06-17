export function ARModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel text-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-display text-xl font-semibold">Bekijk in AR</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-white/75 leading-relaxed">
          Open deze configurator op je telefoon om de Jacuzzi via AR (Apple Quick Look /
          Android WebXR) op ware grootte in je tuin te plaatsen.
        </p>
        {/* TODO: AR — wire up USDZ (iOS Quick Look) and WebXR (Android) flow */}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl py-2.5 text-sm font-medium"
          style={{ background: "#15b9a7", color: "#062b27" }}
        >
          Begrepen
        </button>
      </div>
    </div>
  );
}