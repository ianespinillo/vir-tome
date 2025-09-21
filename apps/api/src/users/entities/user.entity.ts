import { Column, Entity, JoinTable, ManyToOne, OneToMany } from 'typeorm';
import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { TokenEntity } from '../../tokens/entities/tokens.entity';
import { RoleEntity } from './role.entity';

@Entity({
	name: 'user',
})
export class UserEntity extends MultiTenantEntity {
	@Column({ type: 'varchar', length: 255, nullable: false })
	name!: string;
	@Column({ type: 'varchar', length: 255, nullable: true })
	surname!: string;
	@Column({ type: 'varchar', length: 255, nullable: false })
	email!: string;
	@Column({ type: 'varchar', length: 255, nullable: false })
	password!: string;
	@OneToMany(
		() => TokenEntity,
		(token) => token.user,
	)
	tokens?: TokenEntity[];
	@JoinTable({
		name: 'user_roles', // nombre de la tabla intermedia
		joinColumn: {
			name: 'user_id',
			referencedColumnName: 'id',
		},
		inverseJoinColumn: {
			name: 'role_id',
			referencedColumnName: 'id',
		},
	})
	roles: RoleEntity[];
}
