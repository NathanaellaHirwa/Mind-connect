import { useEffect, useState } from 'react';
import type { Professional, AdminProfessionalsProps } from '../types';
import { API_URL } from '../config';

type FormData = {
  id?: string;
  name: string;
  specialty: string;
  country: string;
  languages: string;
  availability: string;
  bio: string;
  yearsExperience: number;
};

export default function AdminProfessionalsPage({ token, refreshProfessionals }: AdminProfessionalsProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    specialty: '',
    country: '',
    languages: '',
    availability: 'available',
    bio: '',
    yearsExperience: 0
  });

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const res = await fetch(`${API_URL}/professionals`);
      const data = await res.json();
      setProfessionals(data);
    } catch (err) {
      console.error('Failed to load professionals:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('specialty', form.specialty);
    formData.append('country', form.country);
    formData.append('languages', form.languages);
    formData.append('availability', form.availability);
    formData.append('bio', form.bio);
    formData.append('yearsExperience', String(form.yearsExperience));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const url = editingId
        ? `${API_URL}/admin/professionals/${editingId}`
        : `${API_URL}/admin/professionals`;
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

      await loadProfessionals();
      resetForm();
    } catch (err) {
      console.error('Error saving professional:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingId(professional.id);
    setForm({
      id: professional.id,
      name: professional.name,
      specialty: professional.specialty || '',
      country: professional.country || '',
      languages: Array.isArray(professional.languages) ? professional.languages.join(', ') : '',
      availability: professional.availability || 'available',
      bio: professional.bio || '',
      yearsExperience: professional.yearsExperience || 0
    });
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this professional?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/professionals/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error('Failed to delete');
      await loadProfessionals();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete professional');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      specialty: '',
      country: '',
      languages: '',
      availability: 'available',
      bio: '',
      yearsExperience: 0
    });
    setImageFile(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manage Professionals</h1>
        <p className="text-sm text-slate-500 mt-1">Add, edit, or remove mental health professionals</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Dr. Example Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty *</label>
            <input
              type="text"
              required
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Clinical Psychologist"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
            <input
              type="text"
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Senegal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Languages</label>
            <input
              type="text"
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., English, French"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
            <select
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>available</option>
              <option>unavailable</option>
              <option>busy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Years Experience</label>
            <input
              type="number"
              value={form.yearsExperience}
              onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={3}
            placeholder="Professional bio..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
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
            {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Professional
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
        <h2 className="text-xl font-semibold text-slate-900">Current Professionals</h2>
        {professionals.length === 0 ? (
          <p className="text-slate-500">No professionals yet. Add one above.</p>
        ) : (
          <div className="grid gap-3">
            {professionals.map((pro) => (
              <div key={pro.id} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{pro.name}</h3>
                  <p className="text-sm text-slate-600">{pro.specialty} • {pro.country}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Languages: {Array.isArray(pro.languages) ? pro.languages.join(', ') : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(pro)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pro.id)}
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
