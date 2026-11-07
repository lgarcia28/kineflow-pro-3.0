export const generatePatientEmail = (dni: string) => {
  return `${dni}@pacientes.kineflow.com`;
};

// Se puede crear una para los staff (si quisieran usar "kine" y logear sin mail)
export const generateStaffEmail = (username: string) => {
  return `${username}@staff.kineflow.com`;
};

export const normalizeDni = (dni?: string) => {
  return (dni || '').replace(/\D/g, '').trim();
};
