export const createProfessional = ({ name, specialty, country, languages = [], availability }) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  name,
  specialty,
  country,
  languages,
  availability
});
