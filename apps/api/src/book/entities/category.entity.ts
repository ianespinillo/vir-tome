import { ICategory } from '@repo/common';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { BookEntity } from './book.entity';

@Entity({
	name: 'category',
})
export class CategoryEntity extends MultiTenantEntity implements ICategory {
	@Column()
	name!: string;

	@ManyToMany(
		() => BookEntity,
		(bookEntity) => bookEntity.categories,
	)
	books!: BookEntity[];
}
