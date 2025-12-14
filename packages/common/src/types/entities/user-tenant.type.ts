import { IRole } from './role.type';
import { ITenant } from './tenant.type';
import { IUser } from './user.type';

export interface IUserTenant {
	id: number;
	user_id: number;
	tenant_id: number;
	role_id: number;
	is_active: boolean;
	role: IRole;
	user: IUser;
	tenant: ITenant;
}
