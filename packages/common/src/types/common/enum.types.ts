import { ROLES } from '../../enum/roles.enum';

export type RolesType = (typeof ROLES)[keyof typeof ROLES];

export interface RoleNodes {
	label: string;
	value: ROLES;
}
