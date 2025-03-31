import { Entity, Column, OneToMany, ManyToMany, JoinTable, JoinColumn, ManyToOne } from 'typeorm';
import { CategoryEntity } from './category.entity';
import { PublisherEntity } from './publisher.entity';
import { GenericEntity } from '../../core/generic.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';

@Entity({
  name: 'book'
})
export class BookEntity extends GenericEntity {
  @Column()
  title!: string;

  @Column()
    publicationYear!: number;

@Column({ default: 1 })
availableQuantity!: number;

@OneToMany(() => LoanEntity, (loan) => loan.book)
loans!: LoanEntity[];

@ManyToMany(() => CategoryEntity, (categoryEntity) => categoryEntity.books)
@JoinTable()
@JoinColumn()
categories!: CategoryEntity[];


@ManyToOne(() => PublisherEntity, (AuthorEntity) => AuthorEntity.books)
@JoinTable()
@JoinColumn()
publisher!: PublisherEntity

@Column({ type: 'numeric' })
copies!: number;

}
