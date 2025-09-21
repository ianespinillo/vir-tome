import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';
import { TokenEntity } from '../../tokens/entities/tokens.entity';
import { RoleEntity } from './role.entity';

@Entity({
	name: 'user',
})
export class UserEntity extends GenericEntity {
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
}
