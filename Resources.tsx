import { useMemo, useState } from 'react';
import type { Resource } from '../types';

type ResourceCategory = 'article' | 'exercise' | 'meditation' | 'tip' | 'video';

type ResourceCard = {
  id: string;
  title: string;
  category: ResourceCategory;
  durationMinutes: number;
  description: string;
  imageUrl: string;
  tags: string[];
  content?: string;
  url?: string;
};

const CATEGORY_STYLES: Record<ResourceCategory, string> = {
  article: 'bg-blue-100 text-blue-700',
  exercise: 'bg-green-100 text-green-700',
  meditation: 'bg-purple-100 text-purple-700',
  tip: 'bg-amber-100 text-amber-700',
  video: 'bg-rose-100 text-rose-700'
};

const categoryIcons: Record<ResourceCategory | 'all', string> = {
  all: '💚',
  article: '📘',
  exercise: '🌬️',
  meditation: '🧠',
  tip: '💡',
  video: '▶️'
};

const categories: Array<{ key: ResourceCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'article', label: 'Articles' },
  { key: 'exercise', label: 'Exercises' },
  { key: 'meditation', label: 'Meditation' },
  { key: 'tip', label: 'Tips' },
  { key: 'video', label: 'Videos' }
];

const SAMPLE_RESOURCES: ResourceCard[] = [
  {
    id: 's1',
    title: '5-Minute Breathing Exercise',
    category: 'exercise',
    durationMinutes: 5,
    description: 'A simple box breathing technique to calm anxiety and center your mind.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
    tags: ['anxiety', 'breathing', 'calm'],
    content: 'Box breathing: Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4-8 times.'
  },
  {
    id: 's2',
    title: 'Understanding Anxiety in African Youth',
    category: 'article',
    durationMinutes: 8,
    description: 'How anxiety shows up across contexts and culturally-informed coping strategies.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=250&fit=crop',
    tags: ['anxiety', 'africa', 'youth']
  },
  {
    id: 's3',
    title: 'Daily Gratitude Practice',
    category: 'tip',
    durationMinutes: 3,
    description: 'Build resilience and positive thinking through a 3-step gratitude habit.',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    tags: ['gratitude', 'positivity', 'daily habit']
  },
  {
    id: 's4',
    title: 'Goal Setting for Mental Wellness',
    category: 'article',
    durationMinutes: 12,
    description: 'Learn how setting small, clear goals can improve wellbeing and consistency.',
    imageUrl: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&h=250&fit=crop',
    tags: ['goals', 'productivity', 'wellness']
  },
  {
    id: 's5',
    title: 'Body Scan Meditation',
    category: 'meditation',
    durationMinutes: 15,
    description: 'A guided body scan to release tension and improve sleep quality.',
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&h=250&fit=crop',
    tags: ['meditation', 'sleep', 'relaxation']
  },
  {
    id: 's6',
    title: 'Breaking the Stigma: Mental Health in Africa',
    category: 'video',
    durationMinutes: 10,
    description: 'How communities can create safer conversations around mental health.',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop',
    tags: ['stigma', 'culture', 'community']
  }
];

const categoryFrom = (resource: Resource): ResourceCategory => {
  const raw = (resource.type || resource.tag || '').toLowerCase().trim();
  if (raw === 'article' || raw === 'exercise' || raw === 'meditation' || raw === 'tip' || raw === 'video') return raw;
  return 'article';
};

const fallbackDuration: Record<ResourceCategory, number> = {
  article: 8,
  exercise: 6,
  meditation: 12,
  tip: 4,
  video: 10
};

const normalizeResource = (resource: Resource): ResourceCard => {
  const category = categoryFrom(resource);
  const normalizedId = String(resource.id);
  const imageUrl = resource.imageUrl ?? resource.image_url ?? `https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop&auto=format&q=80`;
  return {
    id: normalizedId,
    title: resource.title,
    category,
    durationMinutes: resource.durationMinutes ?? resource.duration_minutes ?? fallbackDuration[category],
    description: resource.description ?? 'A curated resource to support your mental wellness journey.',
    imageUrl,
    tags: resource.tags?.length ? resource.tags : resource.tag ? [resource.tag] : [category],
    content: resource.content,
    url: resource.url
  };
};

export default function ResourcesPage({ resources }: { resources: Resource[] }) {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const data = useMemo<ResourceCard[]>(() => {
    const source = resources?.length ? resources.map(normalizeResource) : SAMPLE_RESOURCES;
    return activeCategory === 'all' ? source : source.filter((r) => r.category === activeCategory);
  }, [resources, activeCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Wellness Resources</h2>
        <p className="text-sm text-slate-500 mt-1">Curated tools and knowledge to support your mental wellness journey.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{categoryIcons[cat.key]}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map((r) => {
          const badge = CATEGORY_STYLES[r.category];
          const isExpanded = expanded === r.id;
          return (
            <article
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setExpanded(isExpanded ? null : r.id)}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className={`absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${badge}`}>
                  <span>{categoryIcons[r.category]}</span>
                  <span>{r.category}</span>
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug">{r.title}</h4>
                  <span className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>➜</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{r.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">⏱️ {r.durationMinutes} min</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {r.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 space-y-2">
                    {r.content && <p className="leading-relaxed">{r.content}</p>}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800"
                      >
                        Open resource
                        <span>→</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {data.length === 0 && <p className="text-sm text-slate-500">No resources found for this category.</p>}
    </div>
  );
}
