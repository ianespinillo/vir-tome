import { ICategory } from '@repo/common';
import { Column, Entity, ManyToMany } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';
import { BookEntity } from './book.entity';

@Entity({
	name: 'category',
})
export class CategoryEntity extends GenericEntity implements ICategory {
	@Column()
	name!: string;

	@ManyToMany(
		() => BookEntity,
		(bookEntity) => bookEntity.categories,
	)
	books!: BookEntity[];
}
