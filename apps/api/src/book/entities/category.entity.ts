import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';
import { BookEntity } from './book.entity';

@Entity({
	name: 'category',
})
export class CategoryEntity extends GenericEntity {
	@Column()
	name!: string;

	@ManyToMany(
		() => BookEntity,
		(bookEntity) => bookEntity.categories,
	)
	books!: BookEntity[];
}
