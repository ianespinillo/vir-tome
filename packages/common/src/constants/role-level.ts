import { ROLES } from '../enum/roles.enum';

export const ROLE_LEVEL: Record<ROLES, number> = {
	[ROLES.SUPER_ADMIN]: 100,
	[ROLES.ADMIN]: 80,
	[ROLES.TEACHER]: 10,
	[ROLES.LIBRARIAN]: 10,
	[ROLES.STUDENT]: 10,
};
