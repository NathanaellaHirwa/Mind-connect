import type { Resource } from '../types';

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <a
      className="block rounded-2xl border border-slate-100 px-4 py-4 bg-white/80 shadow-sm hover:border-brand-300 hover:-translate-y-0.5 transition"
      href={resource.url}
      target="_blank"
      rel="noreferrer"
    >
      <p className="font-semibold text-slate-900">{resource.title}</p>
      <p className="text-xs text-slate-500">{resource.type} • {resource.language} • {resource.tag}</p>
    </a>
  );
}
