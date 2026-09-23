/** Cria uma data de calendário (meia-noite UTC), igual às que vêm do banco. */
export const day = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);
