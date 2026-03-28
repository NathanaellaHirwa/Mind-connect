// Session represents a video/booking session with a professional.
export const createSession = ({ userId, professionalId, requestedAt = new Date().toISOString(), note = '' }) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  userId,
  professionalId,
  requestedAt,
  note,
  status: 'pending',
  meetingUrl: null
});
