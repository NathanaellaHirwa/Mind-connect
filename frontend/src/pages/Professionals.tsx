import { useMemo, useState } from 'react';
import Modal from '../components/Modal';
import type { Professional } from '../types';

interface Props {
  professionals: Professional[];
  onBook: (note?: string, professionalId?: string) => Promise<void> | void;
}

type SpecKey =
  | 'anxiety'
  | 'depression'
  | 'stress_management'
  | 'grief_counseling'
  | 'relationship'
  | 'career_counseling'
  | 'addiction'
  | 'general_wellness';

type SpecFilter = SpecKey | 'all';

type SessionType = 'chat' | 'video' | 'audio';

type EnrichedProfessional = {
  id: string;
  name: string;
  title: string;
  specialization: SpecKey;
  bio: string;
  yearsExperience: number;
  languages: string[];
  ratePerSession: number;
  available: boolean;
  rating: number;
  country: string;
  photoUrl: string;
  specialty: string;
  availability: string;
};

const SPEC_LABELS: Record<SpecKey, string> = {
  anxiety: 'Anxiety',
  depression: 'Depression',
  stress_management: 'Stress Management',
  grief_counseling: 'Grief Counseling',
  relationship: 'Relationships',
  career_counseling: 'Career Counseling',
  addiction: 'Addiction',
  general_wellness: 'General Wellness'
};

const SAMPLE_PROFESSIONALS: EnrichedProfessional[] = [
  {
    id: 'p1',
    name: 'Dr. Amara Diallo',
    title: 'Clinical Psychologist',
    specialization: 'anxiety',
    bio: 'Specialist in anxiety and panic disorders with over 8 years of experience working across West Africa.',
    yearsExperience: 8,
    languages: ['English', 'French'],
    ratePerSession: 30,
    available: true,
    rating: 4.9,
    country: 'Senegal',
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
    specialty: 'anxiety',
    availability: 'available'
  },
  {
    id: 'p2',
    name: 'Dr. Kwame Asante',
    title: 'Counseling Therapist',
    specialization: 'depression',
    bio: 'Passionate about helping young Africans navigate depression and build resilience through evidence-based therapies.',
    yearsExperience: 6,
    languages: ['English', 'Twi'],
    ratePerSession: 25,
    available: true,
    rating: 4.7,
    country: 'Ghana',
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
    specialty: 'depression',
    availability: 'available'
  },
  {
    id: 'p3',
    name: 'Ngozi Okafor',
    title: 'Mental Wellness Coach',
    specialization: 'stress_management',
    bio: 'Empowering professionals to manage burnout and build sustainable mental wellness habits.',
    yearsExperience: 5,
    languages: ['English', 'Igbo'],
    ratePerSession: 20,
    available: true,
    rating: 4.8,
    country: 'Nigeria',
    photoUrl: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop',
    specialty: 'stress_management',
    availability: 'available'
  },
  {
    id: 'p4',
    name: 'Dr. Fatima Hassan',
    title: 'Psychiatrist',
    specialization: 'general_wellness',
    bio: 'Providing holistic mental health care for adolescents and young adults across East Africa.',
    yearsExperience: 10,
    languages: ['English', 'Swahili', 'Arabic'],
    ratePerSession: 40,
    available: false,
    rating: 4.9,
    country: 'Kenya',
    photoUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
    specialty: 'general_wellness',
    availability: 'unavailable'
  },
  {
    id: 'p5',
    name: 'Jean-Paul Mugisha',
    title: 'Trauma Counselor',
    specialization: 'grief_counseling',
    bio: 'Specializing in trauma-informed care and grief support for communities in Central Africa.',
    yearsExperience: 7,
    languages: ['French', 'Kinyarwanda', 'English'],
    ratePerSession: 22,
    available: true,
    rating: 4.6,
    country: 'Rwanda',
    photoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop',
    specialty: 'grief_counseling',
    availability: 'available'
  },
  {
    id: 'p6',
    name: 'Dr. Lindiwe Dlamini',
    title: 'Career & Life Coach',
    specialization: 'career_counseling',
    bio: 'Helping young Africans align their professional ambitions with their mental well-being.',
    yearsExperience: 9,
    languages: ['English', 'Zulu'],
    ratePerSession: 35,
    available: true,
    rating: 4.8,
    country: 'South Africa',
    photoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop',
    specialty: 'career_counseling',
    availability: 'available'
  }
];

const initialBookingForm: { date: string; time: string; type: SessionType; note: string } = {
  date: '',
  time: '10:00',
  type: 'chat',
  note: ''
};

const specialtyAliases: Record<string, SpecKey> = {
  anxiety: 'anxiety',
  depression: 'depression',
  stress: 'stress_management',
  stress_management: 'stress_management',
  grief: 'grief_counseling',
  grief_counseling: 'grief_counseling',
  relationship: 'relationship',
  relationships: 'relationship',
  career: 'career_counseling',
  career_counseling: 'career_counseling',
  addiction: 'addiction',
  wellness: 'general_wellness',
  general_wellness: 'general_wellness'
};

const toSpecialization = (value?: string): SpecKey => {
  const normalized = (value ?? '').toLowerCase().trim().replace(/\s+/g, '_');
  if (normalized in SPEC_LABELS) return normalized as SpecKey;
  return specialtyAliases[normalized] ?? 'general_wellness';
};

const avatarFromName = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`;

const parseAvailability = (pro: Professional) => {
  if (typeof pro.available === 'boolean') return pro.available;
  const value = (pro.availability ?? '').toLowerCase();
  if (!value) return true;
  return !['unavailable', 'busy', 'full', 'offline'].some((term) => value.includes(term));
};

const normalizeProfessional = (pro: Professional): EnrichedProfessional => {
  const specialization = toSpecialization(pro.specialization ?? pro.specialty);
  return {
    id: pro.id,
    name: pro.name,
    title: pro.title ?? pro.specialty ?? 'Mental Health Professional',
    specialization,
    bio: pro.bio ?? `Experienced mental health professional supporting people in ${pro.country || 'Africa'}.`,
    yearsExperience: pro.yearsExperience ?? pro.years_experience ?? 5,
    languages: pro.languages?.length ? pro.languages : ['English'],
    ratePerSession: pro.ratePerSession ?? pro.rate_per_session ?? 25,
    available: parseAvailability(pro),
    rating: pro.rating ?? 4.8,
    country: pro.country || 'Africa',
    photoUrl: pro.photoUrl ?? pro.photo_url ?? avatarFromName(pro.name),
    specialty: pro.specialty,
    availability: pro.availability
  };
};

export default function ProfessionalsPage({ professionals, onBook }: Props) {
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState<SpecFilter>('all');
  const [selected, setSelected] = useState<EnrichedProfessional | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);

  const list = useMemo(() => {
    if (!professionals || professionals.length === 0) {
      console.warn('⚠️ No professionals data from backend');
      return [];
    }
    return professionals.map(normalizeProfessional);
  }, [professionals]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return list.filter((pro) => {
      const matchSearch =
        normalizedSearch.length === 0 ||
        pro.name.toLowerCase().includes(normalizedSearch) ||
        pro.country.toLowerCase().includes(normalizedSearch) ||
        pro.languages.join(' ').toLowerCase().includes(normalizedSearch);
      const matchSpecialization = specFilter === 'all' || pro.specialization === specFilter;
      return matchSearch && matchSpecialization;
    });
  }, [list, search, specFilter]);

  const handleOpenBooking = (pro: EnrichedProfessional) => {
    setSelected(pro);
    setBooked(false);
    setBookingError(null);
    setBookingForm(initialBookingForm);
  };

  const handleBook = async () => {
    if (!selected || !bookingForm.date) return;
    setBooking(true);
    setBookingError(null);
    const composedNote = [bookingForm.note.trim(), `Preferred: ${bookingForm.date} at ${bookingForm.time} (${bookingForm.type})`]
      .filter(Boolean)
      .join('\n');
    try {
      await Promise.resolve(onBook(composedNote, selected.id));
      setBooked(true);
      setTimeout(() => {
        setBooked(false);
        setSelected(null);
      }, 2500);
    } catch {
      setBookingError('Could not book this session. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Mental Health Professionals</h2>
        <p className="text-sm text-slate-500 mt-1">Connect with certified professionals across Africa.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          placeholder="Search by name, country, or language..."
        />
        <select
          value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value as SpecFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
        >
          <option value="all">All Specializations</option>
          {Object.entries(SPEC_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((pro) => (
          <article key={pro.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-start gap-3">
              <img
                src={pro.photoUrl}
                alt={pro.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  e.currentTarget.src = avatarFromName(pro.name);
                }}
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-900 text-sm">{pro.name}</h4>
                <p className="text-xs text-slate-500">{pro.title}</p>
                <p className="text-xs text-slate-500 mt-1">★ {pro.rating.toFixed(1)} · {pro.country}</p>
              </div>
            </div>

            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {SPEC_LABELS[pro.specialization]}
            </span>
            <p className="text-xs text-slate-600">{pro.bio}</p>

            <div className="text-xs text-slate-500 space-y-1">
              <p>{pro.yearsExperience} years experience</p>
              <p>Languages: {pro.languages.join(', ')}</p>
              <p>{pro.available ? 'Available now' : 'Currently unavailable'}</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-semibold text-slate-900">
                ${pro.ratePerSession}
                <span className="text-xs font-normal text-slate-500"> /session</span>
              </p>
              <button
                onClick={() => handleOpenBooking(pro)}
                disabled={!pro.available}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  pro.available
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                }`}
              >
                {pro.available ? 'Book Session' : 'Unavailable'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center bg-white/90">
          <p className="text-sm text-slate-600">No professionals match your filters right now.</p>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        title={booked ? 'Session Booked!' : 'Book a Session'}
        onClose={() => {
          if (!booking) setSelected(null);
        }}
      >
        {selected && (
          booked ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">✅</p>
              <h3 className="text-xl font-semibold text-slate-900">Session Booked</h3>
              <p className="text-sm text-slate-500 mt-1">Your session with {selected.name} has been requested.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">with {selected.name}</p>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
                <input
                  type="date"
                  value={bookingForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Time</label>
                  <input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Type</label>
                  <select
                    value={bookingForm.type}
                    onChange={(e) => setBookingForm((f) => ({ ...f, type: e.target.value as SessionType }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="chat">Chat</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Optional note</label>
                <textarea
                  rows={3}
                  value={bookingForm.note}
                  onChange={(e) => setBookingForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Share what you'd like support with..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm flex items-center justify-between">
                <span className="text-slate-600">Rate</span>
                <span className="font-semibold text-slate-900">${selected.ratePerSession}/session</span>
              </div>
              {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
                  disabled={booking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBook}
                  disabled={booking || !bookingForm.date}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
