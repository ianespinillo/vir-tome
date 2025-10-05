import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
import { In, Repository } from 'typeorm';
import { MultiTenantService } from '../../core/multi-tenat.service';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleService extends MultiTenantService<RoleEntity> {
	constructor(
		@InjectRepository(RoleEntity)
		private readonly roleRepository: Repository<RoleEntity>,
	) {
		super(roleRepository);
	}
	async createRole(name: ROLES, tenantId: number): Promise<RoleEntity> {
		const exists = await this.findRoleByName(name, tenantId);
		if (exists) {
			throw new BadRequestException('Role already exists');
		}
		try {
			return await this.create(tenantId, { name });
		} catch (error) {
			if (error instanceof Error) {
				throw new BadRequestException(error.message);
			}
			throw error;
		}
	}
	async findRoleByName(
		name: string,
		tenantId: number,
	): Promise<RoleEntity | null> {
		return this.findOne(tenantId, { name });
	}
	async findAllRoles(tenantId: number): Promise<RoleEntity[]> {
		return this.findAll(tenantId);
	}
	async initializeDefaultRoles(tenantId: number): Promise<RoleEntity[]> {
		const defaultRoles = [
			{ name: ROLES.ADMIN },
			{ name: ROLES.LIBRARIAN },
			{ name: ROLES.TEACHER },
			{ name: ROLES.STUDENT },
		];

		const roles: RoleEntity[] = [];
		for (const roleData of defaultRoles) {
			try {
				const role = await this.createRole(roleData.name, tenantId);
				roles.push(role);
			} catch (error) {
				// Si el rol ya existe, buscarlo
				const existing = await this.findOne(tenantId, { name: roleData.name });
				if (existing) roles.push(existing);
			}
		}

		return roles;
	}

	async getDefaultRoles(tenantId: number): Promise<RoleEntity[]> {
		const defaultRoleNames = [
			ROLES.ADMIN,
			ROLES.LIBRARIAN,
			ROLES.TEACHER,
			ROLES.STUDENT,
		];

		return this.findBy(tenantId, {
			name: In(defaultRoleNames),
		});
	}
}
