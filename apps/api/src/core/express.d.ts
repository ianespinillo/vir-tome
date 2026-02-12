declare global {
	namespace Express {
		interface Request {
			tenant: TenantEntity;
			tenantId: number;
			user: IAuthUser;
		}
	}
}
