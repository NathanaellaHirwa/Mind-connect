export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/70 bg-white/60 backdrop-blur p-4 text-center text-xs text-slate-500">
      MindConnect • Built for wellness & productivity • {new Date().getFullYear()}
    </footer>
  );
}
