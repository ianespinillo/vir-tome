import { RoleEntity } from '@/users/entities/role.entity';
import { ROLES } from '@repo/common';
import { DataSource } from 'typeorm';

// src/database/seeds/roles.seed.ts
export class RolesSeed {
	async run(dataSource: DataSource) {
		const rolesRepo = dataSource.getRepository(RoleEntity);

		const roles = [
			{ name: ROLES.ADMIN },
			{ name: ROLES.TEACHER },
			{ name: ROLES.LIBRARIAN },
			{ name: ROLES.STUDENT },
		];

		for (const role of roles) {
			const exists = await rolesRepo.findOne({ where: { name: role.name } });
			if (!exists) {
				await rolesRepo.save(role);
			}
		}
	}
}
