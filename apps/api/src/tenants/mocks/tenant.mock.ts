import { TenantSettings } from '@repo/common';
import { TenantEntity } from '../entities/tenant.entity';

export const createTenantMock = (
	overrides: Partial<TenantEntity> = {},
): TenantEntity => {
	const tenant = new TenantEntity();

	tenant.id = 1;
	tenant.created_at = new Date();
	tenant.updated_at = new Date();
	tenant.deleted_at = undefined;

	tenant.subdomain = 'test-tenant';
	tenant.name = 'Test Tenant';
	tenant.contact_email = 'tenant@example.com';
	tenant.is_active = true;
	tenant.is_demo = false;

	tenant.settings = {
		limits: {
			max_books: 100,
			max_users: 50,
			max_loans: 200,
		},
	} as TenantSettings;

	tenant.plan = 'basic';
	tenant.subscription_expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24); // mañana

	// aplicar overrides para customizar en cada test
	Object.assign(tenant, overrides);

	return tenant;
};

// Ejemplo de uso en test
const tenant = createTenantMock({ is_active: false });
expect(tenant.isActiveAndValid()).toBe(false);
