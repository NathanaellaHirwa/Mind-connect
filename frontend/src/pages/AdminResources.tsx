import { useEffect, useState } from 'react';
import type { Resource, AdminResourcesProps } from '../types';

type FormData = {
  id?: string;
  title: string;
  type: string;
  language: string;
  url: string;
  tag: string;
  description: string;
};

const API_URL = '/api';

export default function AdminResourcesPage({ token, refreshResources }: AdminResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState<FormData>({
    title: '',
    type: 'article',
    language: 'English',
    url: '',
    tag: '',
    description: ''
  });

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const res = await fetch(`${API_URL}/resources`);
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('type', form.type);
    formData.append('language', form.language);
    formData.append('url', form.url);
    formData.append('tag', form.tag);
    formData.append('description', form.description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const url = editingId
        ? `${API_URL}/admin/resources/${editingId}`
        : `${API_URL}/admin/resources`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      await loadResources();
      if (refreshResources) await refreshResources();
      resetForm();
    } catch (err) {
      console.error('Error saving resource:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setForm({
      id: resource.id,
      title: resource.title,
      type: resource.type || 'article',
      language: resource.language || 'English',
      url: resource.url || '',
      tag: resource.tag || '',
      description: resource.description || ''
    });
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/resources/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('Failed to delete');
      await loadResources();
      if (refreshResources) await refreshResources();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete resource');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      type: 'article',
      language: 'English',
      url: '',
      tag: '',
      description: ''
    });
    setImageFile(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manage Resources</h1>
        <p className="text-sm text-slate-500 mt-1">Add, edit, or remove wellness resources</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 5-Minute Breathing Exercise"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="article">Article</option>
              <option value="exercise">Exercise</option>
              <option value="meditation">Meditation</option>
              <option value="tip">Tip</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
            <input
              type="text"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tag *</label>
            <input
              type="text"
              required
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., anxiety, meditation"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">URL *</label>
            <input
              type="url"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://example.com/resource"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={3}
            placeholder="Resource description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
          {imageFile && <p className="text-xs text-emerald-600 mt-1">✓ {imageFile.name}</p>}
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Resource
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Current Resources</h2>
        {resources.length === 0 ? (
          <p className="text-slate-500">No resources yet. Add one above.</p>
        ) : (
          <div className="grid gap-3">
            {resources.map((res) => (
              <div key={res.id} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{res.title}</h3>
                  <p className="text-sm text-slate-600">{res.type} • {res.language}</p>
                  <p className="text-xs text-slate-500 mt-1">{res.tag}</p>
                  {res.description && <p className="text-xs text-slate-600 mt-1">{res.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(res)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
