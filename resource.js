export const createResource = ({ title, type, language = 'English', url, tag }) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  title,
  type,
  language,
  url,
  tag
});
