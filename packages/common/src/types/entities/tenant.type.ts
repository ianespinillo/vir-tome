import { TenantSettings } from '../tenants/tenant.types';
import { IBook } from './book.type';
import { IGeneric } from './generic.type';
import { IUserTenant } from './user-tenant.type';

export interface ITenant extends IGeneric {
	subdomain: string;
	name: string;
	contact_email: string;
	is_active: boolean;
	is_demo: boolean;
	settings?: TenantSettings;
	plan?: string;
	subscription_expires_at?: Date;
	userTenants?: IUserTenant[];
	books?: IBook[];
}
