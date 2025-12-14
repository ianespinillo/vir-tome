import { IGeneric } from './generic.type';
import { ILoan } from './loan.type';
import { IRole } from './role.type';
import { ITenant } from './tenant.type';
import { IUserTenant } from './user-tenant.type';

export interface IUser extends IGeneric {
	email: string;
	name: string;
	surname: string;
	password?: string;
	last_login_at?: Date;
	userTenants?: IUserTenant[];
	loans?: ILoan[];
	getTenantIds(): number[];
	hasAccessToTenant(tenantId: number): boolean;
	getRoleInTenant(tenantId: number): IRole | null;
	getRoleIdInTenant(tenantId: number): number;
	getTenants(): ITenant[];
}
