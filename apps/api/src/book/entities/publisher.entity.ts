import { Column, Entity, OneToMany } from 'typeorm';
import { MultiTenantEntity } from '../../core/multi-tenant.entity';
import { BookEntity } from './book.entity';

@Entity({
	name: 'publisher',
})
export class PublisherEntity extends MultiTenantEntity {
	@Column()
	name!: string;

	@OneToMany(
		() => BookEntity,
		(bookEntity) => bookEntity.publisher,
	)
	books!: BookEntity[];
}
