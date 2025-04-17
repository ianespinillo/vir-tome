import {
	Column,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { CategoryEntity } from './category.entity';
import { PublisherEntity } from './publisher.entity';

@Entity({ name: 'book' })
export class BookEntity extends GenericEntity {
	@Column()
	title!: string;

	@Column()
	publicationYear!: number;

	@Column({ default: 1 })
	availableQuantity!: number;

	@OneToMany(
		() => LoanEntity,
		(loan) => loan.book,
	)
	loans!: LoanEntity[];

	@ManyToMany(
		() => CategoryEntity,
		(category) => category.books,
		{
			cascade: true, // Opcional: permite guardar categorías al guardar el libro
		},
	)
	@JoinTable({
		name: 'book_categories', // Nombre explícito de la tabla de unión
		joinColumn: {
			name: 'bookId',
			referencedColumnName: 'id',
		},
		inverseJoinColumn: {
			name: 'categoryId',
			referencedColumnName: 'id',
		},
	})
	categories!: CategoryEntity[];

	@ManyToOne(
		() => PublisherEntity,
		(publisher) => publisher.books,
		{
			onDelete: 'CASCADE', // Opcional: elimina libros si se elimina la editorial
		},
	)
	@JoinColumn({ name: 'publisherId' })
	publisher!: PublisherEntity;
}
