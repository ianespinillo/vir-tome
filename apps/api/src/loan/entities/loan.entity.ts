import { LoanStatus } from '@repo/common';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { GenericEntity } from '../../core/generic.entity';

@Entity({
	name: 'loan',
})
export class LoanEntity extends GenericEntity {
	@Column()
	borrowerName!: string;

	@ManyToOne(
		() => BookEntity,
		(book) => book.loans,
	)
	book!: BookEntity;

	@Column()
	quantity!: number;

	@Column({ type: 'date' })
	loanDate!: Date;

	@Column({ type: 'date', nullable: true })
	returnDate!: Date;

	@Column({ default: LoanStatus.ACTIVE, type: 'enum', enum: LoanStatus }) // active, returned, overdue
	status!: LoanStatus;

	public get tenant_id(): number {
		return this.book.tenant_id;
	}
}
