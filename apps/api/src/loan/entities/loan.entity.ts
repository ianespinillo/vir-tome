import {
	IBook,
	ILoan,
	IUser,
	LoanBorrowerType,
	LoanStatus,
} from '@repo/common';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { GenericEntity } from '../../core/generic.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'loan' })
export class LoanEntity extends GenericEntity implements ILoan {
	/* =======================
	   Tipo de prestatario
	======================= */
	@Column({
		type: 'enum',
		enum: LoanBorrowerType,
	})
	borrower_type!: LoanBorrowerType;

	/* =======================
	   Usuario registrado
	======================= */
	@Column({ nullable: true })
	user_id?: number;

	@ManyToOne(
		() => UserEntity,
		(user) => user.loans,
		{ nullable: true },
	)
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity;

	/* =======================
	   Prestatario externo
	======================= */
	@Column({ nullable: true })
	borrower_name?: string;

	@Column({ nullable: true })
	borrower_email?: string;

	@Column({ nullable: true })
	borrower_phone?: string;

	@Column({ nullable: true })
	borrower_national_id?: string;

	/* =======================
	   Libro
	======================= */
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

	@Column({ type: 'date', default: new Date() })
	loan_date!: Date;

	@Column({ type: 'date', nullable: true })
	return_date!: Date;

	@Column({
		type: 'enum',
		enum: LoanStatus,
		default: LoanStatus.ACTIVE,
	})
	status!: LoanStatus;

	/* =======================
	   Helpers de dominio
	======================= */
	public getBook(): IBook {
		return this.book;
	}

	public getUser(): IUser | null {
		return this.user ?? null;
	}

	public isOverdue(): boolean {
		if (!this.return_date) return false;
		return this.return_date < new Date();
	}
}
