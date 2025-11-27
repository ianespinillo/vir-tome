import { GenericEntity } from '@/core/generic.entity';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
// src/users/entities/user.entity.ts
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { TokenEntity } from '../../tokens/entities/tokens.entity';
import { RoleEntity } from './role.entity';
import { UserTenantEntity } from './user-tenant.entity';

@Entity({ name: 'users' })
@Index(['email'], { unique: true }) // Email único GLOBAL
export class UserEntity extends GenericEntity {
	@Column({ unique: true })
	email!: string;

	@Column()
	name!: string;

	@Column()
	surname!: string;

	@Column()
	password!: string;

	@Column({ type: 'timestamp', nullable: true })
	last_login_at?: Date;

	// ============================================
	// RELACIONES
	// ============================================

	// Relación many-to-many con tenants (a través de user_tenants)
	@OneToMany(
		() => UserTenantEntity,
		(ut) => ut.user,
	)
	userTenants!: UserTenantEntity[];

	@OneToMany(
		() => TokenEntity,
		(token) => token.user,
	)
	tokens?: TokenEntity[];

	@OneToMany(
		() => LoanEntity,
		(loan) => loan.user,
	)
	loans?: LoanEntity[];

	// ============================================
	// HELPER METHODS
	// ============================================

	getTenantIds(): number[] {
		return this.userTenants?.map((ut) => ut.tenant_id) || [];
	}

	hasAccessToTenant(tenantId: number): boolean {
		return (
			this.userTenants?.some((ut) => ut.tenant_id === tenantId && ut.is_active) ||
			false
		);
	}

	getRoleInTenant(tenantId: number): RoleEntity | null {
		const userTenant = this.userTenants?.find(
			(ut) => ut.tenant_id === tenantId && ut.is_active,
		);
		return userTenant?.role || null;
	}

	getRoleIdInTenant(tenantId: number): number {
		const userTenant = this.userTenants?.find(
			(ut) => ut.tenant_id === tenantId && ut.is_active,
		);
		if (!userTenant)
			throw new Error('User is not active in the specified tenant');
		return userTenant.role_id;
	}

	getTenants(): TenantEntity[] {
		return this.userTenants?.map((ut) => ut.tenant) || [];
	}
}
