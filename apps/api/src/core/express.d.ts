import { ITenant } from '@repo/common';
declare global {
	namespace Express {
		interface Request {
			tenant: ITenant;
			tenantId: number;
			user: IAuthUser;
		}
	}
}
