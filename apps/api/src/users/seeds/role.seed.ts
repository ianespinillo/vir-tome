import { ROLES } from '@repo/common';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

config();

const AppDataSource = new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	entities: [RoleEntity],
	synchronize: true,
});

async function seedRoles() {
	const connection = await AppDataSource.initialize();
	const roleRepository = connection.getRepository(RoleEntity);
	for (const rol of Object.keys(ROLES)) {
		const role = new RoleEntity();
		role.name = rol;
		await roleRepository.save(role);
	}
}

seedRoles()
	.then(() => console.log('Roles creados correctamente'))
	.catch((err) => console.error(err));
