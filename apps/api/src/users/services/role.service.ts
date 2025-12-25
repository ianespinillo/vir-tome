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
	async createRole(name: string): Promise<RoleEntity> {
		const exists = await this.findRoleByName(name);
		if (exists) {
			throw new BadRequestException('Role already exists');
		}
		try {
			return await this.roleRepository.save({
				name: name as ROLES,
			});
		} catch (error) {
			if (error instanceof Error) {
				throw new BadRequestException(error.message);
			}
			throw error;
		}
	}
	async findRoleByName(name: string): Promise<RoleEntity | null> {
		if (!Object.values(ROLES).includes(name as ROLES)) {
			throw new BadRequestException('Invalid role name');
		}
		return this.roleRepository.findOne({
			where: {
				name: name as ROLES,
			},
		});
	}
	async findAllRoles(): Promise<RoleEntity[]> {
		return this.roleRepository.find();
	}
	async initializeDefaultRoles(): Promise<RoleEntity[]> {
		const defaultRoles = [
			{ name: ROLES.ADMIN },
			{ name: ROLES.LIBRARIAN },
			{ name: ROLES.TEACHER },
			{ name: ROLES.STUDENT },
		];

		const roles: RoleEntity[] = [];
		for (const roleData of defaultRoles) {
			try {
				const role = await this.createRole(roleData.name);
				roles.push(role);
			} catch (error) {
				if (error instanceof BadRequestException) {
					const existing = await this.findRoleByName(roleData.name);
					if (existing) roles.push(existing);
				}
			}
		}

		return roles;
	}
	async findById(roleId: number): Promise<RoleEntity | null> {
		return this.roleRepository.findOne({
			where: {
				id: roleId,
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
				name: In(defaultRoleNames),
			},
		});
	}
}
