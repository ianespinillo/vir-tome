import { TenantSettings } from '@repo/common';
// src/tenants/entities/tenant.entity.ts
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';

@Entity({ name: 'tenant' })
@Index(['subdomain'], { unique: true })
@Index(['contact_email'])
export class TenantEntity extends GenericEntity {
	@Column({ type: 'varchar', length: 50, unique: true })
	subdomain!: string;

	@Column({ type: 'varchar', length: 255 })
	name!: string;

	@Column({ type: 'varchar', length: 255 })
	contact_email!: string;

	@Column({ default: true })
	is_active!: boolean;

	@Column({ default: false })
	is_demo!: boolean;

	@Column({ type: 'jsonb', nullable: true })
	settings?: TenantSettings;

	@Column({ type: 'varchar', length: 100, nullable: true })
	plan?: string; // 'basic', 'premium', 'enterprise'

	@Column({ type: 'timestamp with time zone', nullable: true })
	subscription_expires_at?: Date;

	// Relaciones que se agregarán en próximas fases
	// @OneToMany(() => UserEntity, user => user.tenant)
	// users?: UserEntity[];

	// @OneToMany(() => BookEntity, book => book.tenant)
	// books?: BookEntity[];

	// Método helper para validar si tenant está activo
	isActiveAndValid(): boolean {
		if (!this.is_active) return false;

		// Verificar si la suscripción está vigente (si aplica)
		if (
			this.subscription_expires_at &&
			this.subscription_expires_at < new Date()
		) {
			return false;
		}

		return true;
	}

	// Método helper para verificar límites
	canAddResource(
		resourceType: 'books' | 'users' | 'loans',
		currentCount: number,
	): boolean {
		const limits = this.settings?.limits;
		if (!limits) return true; // Sin límites configurados

		const maxAllowed = limits[`max_${resourceType}`];
		if (!maxAllowed) return true; // Sin límite para este recurso

		return currentCount < maxAllowed;
	}
}
