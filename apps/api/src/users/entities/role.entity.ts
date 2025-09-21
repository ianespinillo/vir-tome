import { Column, Entity, ManyToMany } from 'typeorm';

import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { UserEntity } from './user.entity';

@Entity({
	name: 'role',
})
export class RoleEntity extends MultiTenantEntity {
	@Column({ type: 'varchar', length: 255, nullable: false })
	name!: string;
	@ManyToMany(
		() => UserEntity,
		(user) => user.roles,
	)
	users!: UserEntity[];
}
