import { IPublisher } from '@repo/common';
import { Column, Entity, OneToMany } from 'typeorm';
import { GenericEntity } from '../../core/generic.entity';
import { BookEntity } from './book.entity';

@Entity({
	name: 'publisher',
})
export class PublisherEntity extends GenericEntity implements IPublisher {
	@Column()
	name!: string;

	@OneToMany(
		() => BookEntity,
		(bookEntity) => bookEntity.publisher,
	)
	books!: BookEntity[];
}
