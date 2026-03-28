// Simple wellness check entry (e.g., daily self-report)
export const createWellnessCheck = ({ userId, mood, stressLevel, sleepHours, energyLevel = 3, note = '', grateful = '' }) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  userId,
  mood, // e.g., 'good', 'neutral', 'low'
  stressLevel, // 1-10
  sleepHours, // number
  energyLevel,
  note,
  grateful,
  createdAt: new Date().toISOString()
});
