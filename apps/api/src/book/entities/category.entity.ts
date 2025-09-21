import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { BookEntity } from './book.entity';

@Entity({
	name: 'category',
})
export class CategoryEntity extends MultiTenantEntity {
	@Column()
	name!: string;

	@ManyToMany(
		() => BookEntity,
		(bookEntity) => bookEntity.categories,
	)
	books!: BookEntity[];
}
