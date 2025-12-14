import { ROLES } from '../../enum/roles.enum';
import { IGeneric } from './generic.type';

export interface IRole extends IGeneric {
	name: ROLES;
	tenant_id: number;
	description?: string;
	isSuperAdmin(): boolean;
	isAdmin(): boolean;
	canManageBooks(): boolean;
	canManageLoans(): boolean;
	canViewAllLoans(): boolean;
}
