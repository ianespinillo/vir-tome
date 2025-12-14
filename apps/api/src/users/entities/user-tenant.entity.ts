import { IUserTenant } from '@repo/common';
// src/users/entities/user-tenant.entity.ts
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

@Entity('user_tenants')
@Index(['user_id', 'tenant_id'], { unique: true })
export class UserTenantEntity implements IUserTenant {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	user_id!: number;

	@ManyToOne(
		() => UserEntity,
		(user) => user.userTenants,
	)
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column()
	tenant_id!: number;

	@ManyToOne(
		() => TenantEntity,
		(tenant) => tenant.userTenants,
		{ onDelete: 'CASCADE' },
	)
	@JoinColumn({ name: 'tenant_id' })
	tenant!: TenantEntity;

	@Column()
	role_id!: number;

	@ManyToOne(() => RoleEntity)
	@JoinColumn({ name: 'role_id' })
	role!: RoleEntity;

	@Column({ default: true })
	is_active!: boolean;

	@CreateDateColumn()
	created_at!: Date;
}
