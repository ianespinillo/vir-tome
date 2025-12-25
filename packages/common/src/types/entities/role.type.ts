import { ROLES } from '../../enum/roles.enum';
import { IGeneric } from './generic.type';

export interface IRole extends IGeneric {
	name: ROLES;
	description?: string;
	isSuperAdmin(): boolean;
	isAdmin(): boolean;
	canManageBooks(): boolean;
	canManageLoans(): boolean;
	canViewAllLoans(): boolean;
}
