import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { BookEntity } from './book.entity';
import { GenericEntity } from '../../core/generic.entity';

@Entity({
  name: 'category',
})
export class CategoryEntity extends GenericEntity {
  @Column()
  name!: string;

  @ManyToMany(() => BookEntity, (bookEntity) => bookEntity.categories)
  books!: BookEntity[];
}
