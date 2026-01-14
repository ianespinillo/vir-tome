import { Roles } from '../types/auth/requests.types';

export const ROLE_LABEL: Record<Roles, string> = {
	ADMIN: 'Administrador',
	SUPER_ADMIN: 'Super Administrador',
	STUDENT: 'Estudiante',
	LIBRARIAN: 'Bibliotecario',
	TEACHER: 'Profesor',
};
