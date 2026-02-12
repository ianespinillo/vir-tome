import { IRole, ROLES } from '@repo/common';
// src/users/entities/role.entity.ts
import { Column, Entity, Index } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';

@Entity('roles')
export class RoleEntity extends GenericEntity implements IRole {
	@Column({
		type: 'enum',
		enum: ROLES,
	})
	name!: ROLES;

	@Column({ nullable: true })
	description!: string;

	// Helper methods
	isSuperAdmin(): boolean {
		return this.name === ROLES.SUPER_ADMIN;
	}

	isAdmin(): boolean {
		return this.name === ROLES.ADMIN;
	}

	canManageBooks(): boolean {
		return [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER].includes(this.name);
	}

	canManageLoans(): boolean {
		return [ROLES.ADMIN, ROLES.LIBRARIAN].includes(this.name);
	}

	canViewAllLoans(): boolean {
		return [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER].includes(this.name);
	}
}
