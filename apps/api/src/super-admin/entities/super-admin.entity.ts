import { ROLES } from '@repo/common';
import { Column, Entity } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';

@Entity({ name: 'super-admin' })
export class SuperAdminEntity extends GenericEntity {
	@Column({ name: 'email', type: 'varchar', unique: true })
	email!: string;

	@Column({ name: 'password', type: 'varchar' })
	password!: string;

	@Column({ name: 'name', type: 'varchar', nullable: true })
	name?: string;

	@Column({ name: 'role', type: 'varchar', default: ROLES.SUPER_ADMIN })
	role!: string;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean;

	@Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
	lastLoginAt?: Date;
}
