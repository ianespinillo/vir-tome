import { Column, Entity } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';

@Entity({
	name: 'role',
})
export class RoleEntity extends GenericEntity {
	@Column({ type: 'varchar', length: 255, nullable: false })
	name!: string;
}
