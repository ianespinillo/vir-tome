import {
	Column,
	Entity,
	Index,
	ManyToMany,
	ManyToOne,
	OneToMany,
} from 'typeorm';

import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { UserEntity } from './user.entity';

@Entity({
	name: 'role',
})
@Index(['name', 'tenant_id'], { unique: true })
export class RoleEntity extends MultiTenantEntity {
	@Column({ type: 'varchar', length: 255, nullable: false })
	name!: string;
	@OneToMany(
		() => UserEntity,
		(user) => user.role,
	)
	users!: UserEntity[];
}
