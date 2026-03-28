import { useIsMobile } from '../hooks/useIsMobile';

export default function Topbar() {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/70 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.45)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-800">MindConnect</span>
        </div>
        {!isMobile && (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>💬</span>
            <span>“Every step forward, no matter how small, is progress.”</span>
          </div>
        )}
      </div>
    </header>
  );
}
