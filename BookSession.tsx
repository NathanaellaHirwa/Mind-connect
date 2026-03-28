import type { Booking, Professional } from '../types';
import { type Dispatch, type SetStateAction } from 'react';
import { EmptyState } from '../components/EmptyState';

interface Props {
  professionals: Professional[];
  bookings: Booking[];
  bookingForm: { professionalId: string; note: string };
  setBookingForm: Dispatch<SetStateAction<{ professionalId: string; note: string }>>;
  createBooking: (note?: string, professionalId?: string) => void;
}

export default function BookSession({ professionals, bookings, bookingForm, setBookingForm, createBooking }: Props) {
  return (
    <div className="space-y-5">
      <div className="card p-6 space-y-3 bg-white/90">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Book a session</h2>
          <span className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-full border border-brand-100">Wellness first</span>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            createBooking();
          }}
        >
          <select
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={bookingForm.professionalId}
            onChange={(e) => setBookingForm((f) => ({ ...f, professionalId: e.target.value }))}
            required
          >
            <option value="">Choose a professional</option>
            {professionals.map((pro) => (
              <option key={pro.id} value={pro.id}>{pro.name} — {pro.specialty}</option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Share context for your request"
            value={bookingForm.note}
            onChange={(e) => setBookingForm((f) => ({ ...f, note: e.target.value }))}
          />
          <button className="btn" type="submit">Request session</button>
        </form>
      </div>

      <div className="card p-6 space-y-3 bg-white/90">
        <h3 className="text-md font-semibold text-slate-900">Your bookings</h3>
        {bookings.length === 0 && <EmptyState title="No bookings yet" message="Request a session to see it listed here." />}
        <div className="space-y-2">
          {bookings.map((b) => {
            const pro = professionals.find((p) => p.id === b.professionalId);
            return (
              <div key={b.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="font-semibold text-slate-900">{pro?.name || 'Professional'} — {b.status}</p>
                <p className="text-xs text-slate-500">Requested {new Date(b.requestedAt).toLocaleString()}</p>
                {b.note && <p className="text-xs text-slate-600 mt-1">{b.note}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
