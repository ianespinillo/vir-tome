import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { LoanStatus } from '@repo/common';


@Entity({
  name: 'loan',
})
export class LoanEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  borrowerName!: string;

  @ManyToOne(() => BookEntity, (book) => book.loans)
  book!: BookEntity;

  @Column()
  quantity!: number;

  @Column({ type: 'date' })
  loanDate!: Date;

  @Column({ type: 'date', nullable: true })
  returnDate!: Date;

  @Column({ default: LoanStatus.ACTIVE, type: 'enum', enum: LoanStatus }) // active, returned, overdue
  status!: LoanStatus;
}
