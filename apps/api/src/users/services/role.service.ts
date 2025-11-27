import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
import { In, Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(RoleEntity)
		private readonly roleRepository: Repository<RoleEntity>,
	) {}
	async createRole(name: string, tenantId: number): Promise<RoleEntity> {
		const exists = await this.findRoleByName(name, tenantId);
		if (exists) {
			throw new BadRequestException('Role already exists');
		}
		try {
			return await this.roleRepository.save({
				name: name as ROLES,
				tenant_id: tenantId,
			});
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
		if (!Object.values(ROLES).includes(name as ROLES)) {
			throw new BadRequestException('Invalid role name');
		}
		return this.roleRepository.findOne({
			where: {
				name: name as ROLES,
				tenant_id: tenantId,
			},
		});
	}
	async findAllRoles(tenantId: number): Promise<RoleEntity[]> {
		return this.roleRepository.find({
			where: {
				tenant_id: tenantId,
			},
		});
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
				if (error instanceof BadRequestException) {
					const existing = await this.findRoleByName(roleData.name, tenantId);
					if (existing) roles.push(existing);
				}
			}
		}

		return roles;
	}
	async findById(roleId: number, tenantId: number): Promise<RoleEntity | null> {
		return this.roleRepository.findOne({
			where: {
				id: roleId,
				tenant_id: tenantId,
			},
		});
	}
	async getDefaultRoles(tenantId: number): Promise<RoleEntity[]> {
		const defaultRoleNames = [
			ROLES.ADMIN,
			ROLES.LIBRARIAN,
			ROLES.TEACHER,
			ROLES.STUDENT,
		];

		return this.roleRepository.find({
			where: {
				tenant_id: tenantId,
				name: In(defaultRoleNames),
			},
		});
	}
}
