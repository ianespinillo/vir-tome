import { IBook, ILoan, IUser, LoanStatus } from '@repo/common';
// src/loan/entities/loan.entity.ts
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { GenericEntity } from '../../core/generic.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({
	name: 'loan',
})
export class LoanEntity extends GenericEntity implements ILoan {
	@Column()
	user_id!: number;

	@ManyToOne(
		() => UserEntity,
		(user) => user.loans,
	)
	user!: UserEntity;

	@Column()
	book_id!: number;

	@ManyToOne(
		() => BookEntity,
		(book) => book.loans,
	)
	@JoinColumn({ name: 'book_id' })
	book!: BookEntity;

	@Column()
	quantity!: number;

	@Column({ type: 'date' })
	loan_date!: Date;

	@Column({ type: 'date', nullable: true })
	return_date!: Date;

	@Column({
		default: LoanStatus.ACTIVE,
		type: 'enum',
		enum: LoanStatus,
	})
	status!: LoanStatus;

	// Getter para compatibilidad con GenericEntity multi-tenant
	public getBook(): IBook {
		return this.book;
	}
	public getUser(): IUser {
		return this.user;
	}
	public isOverdue(): boolean {
		return this.return_date > new Date();
	}
}
