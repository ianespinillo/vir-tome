import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { TokenEntity } from '../../tokens/entities/tokens.entity';
import { RoleEntity } from './role.entity';

@Entity({
	name: 'user',
})
@Index(['email', 'tenant_id'], { unique: true })
export class UserEntity extends MultiTenantEntity {
	@Column({ type: 'varchar', length: 255, nullable: false })
	name!: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	surname!: string;

	@Column({ type: 'varchar', length: 255, nullable: false })
	email!: string;

	@Column({ type: 'varchar', length: 255, nullable: false })
	password!: string;

	// RELACIÓN CON ROL (Many-to-One) - Un usuario tiene un rol
	@ManyToOne(
		() => RoleEntity,
		(role) => role.users,
		{
			nullable: false,
			eager: true, // Opcional: carga el rol automáticamente
		},
	)
	role!: RoleEntity; // Cambiado de 'roles' (array) a 'role' (objeto)

	@OneToMany(
		() => TokenEntity,
		(token) => token.user,
	)
	tokens?: TokenEntity[];
}
