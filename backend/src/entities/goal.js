export const createGoal = ({ userId, title, description = '', targetDate = null }) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  userId,
  title,
  description,
  targetDate,
  progress: 0,
  completed: false,
  createdAt: new Date().toISOString()
});
