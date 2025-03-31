import { Entity, Column, OneToMany } from 'typeorm';
import { BookEntity } from './book.entity';
import { GenericEntity } from '../../core/generic.entity';

@Entity({
  name: 'publisher',
})
export class PublisherEntity extends GenericEntity {
  @Column()
  name!: string;

  @OneToMany(() => BookEntity, (bookEntity) => bookEntity.publisher)
  books!: BookEntity[];
}
