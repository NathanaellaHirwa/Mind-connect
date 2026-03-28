// Basic Task entity definition (in-memory).
export const createTask = ({ userId, title, description = '', dueDate = null }) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  userId,
  title,
  description,
  dueDate,
  completed: false,
  progress: 0,
  createdAt: new Date().toISOString()
});
