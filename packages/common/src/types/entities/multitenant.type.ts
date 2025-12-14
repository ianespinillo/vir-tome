import { IGeneric } from './generic.type';

export interface IMultitenant extends IGeneric {
	tenant_id: number;
	tenant: any;
}
