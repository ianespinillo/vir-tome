import { Column, Entity, Index, OneToMany } from 'typeorm';

import { ROLES } from '@repo/common';
import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { UserEntity } from './user.entity';

@Entity({
	name: 'role',
})
@Index(['name', 'tenant_id'], { unique: true })
export class RoleEntity extends MultiTenantEntity {
	@Column({ type: 'enum', enum: ROLES })
	name!: string;
	@OneToMany(
		() => UserEntity,
		(user) => user.role,
	)
	users!: UserEntity[];
}
