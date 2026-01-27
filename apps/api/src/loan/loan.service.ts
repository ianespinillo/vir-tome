import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanEntity } from './entities/loan.entity';

import { IAuthUser } from '@/core/core.types';
import { QueryHelper } from '@/core/query-helper';
import { UsersService } from '@/users/services/users.service';
import {
	CreateLoanDto,
	ILoanAlert,
	ILoanStatistics,
	IPaginatedResponse,
	LoanBorrowerType,
	LoanQueriesDTO,
	LoanStatus,
	MostLoanedBooks,
	RequestLoanDTO,
} from '@repo/common';
import { addDays, differenceInDays, format } from 'date-fns';
import { Repository, UpdateResult } from 'typeorm';
import { BookService } from '../book/services/book.service';
import { GenericService } from '../core/generic.service';
@Injectable()
export class LoanService extends GenericService {
	constructor(
		@InjectRepository(LoanEntity)
		private readonly loanRepository: Repository<LoanEntity>,
		private readonly bookService: BookService,
		private readonly usersService: UsersService,
	) {
		super(loanRepository);
	}
	async findAllByTenant(tenantId: number): Promise<LoanEntity[]> {
		return this.loanRepository.find({
			where: { book: { tenant_id: tenantId } },
			relations: ['book'],
		});
	}

	async createLoan(tenantId: number, data: CreateLoanDto) {
		const book = await this.bookService.findById(tenantId, data.bookId);
		if (!book) throw new NotFoundException('Book not found');
		if (data.quantity <= 0)
			throw new BadRequestException('Quantity must be greater than zero');
		if (new Date(Date.now()) > data.returnDate)
			throw new BadRequestException('Return date cannot be in the past');
		if (book.availableQuantity < data.quantity)
			throw new BadRequestException('Not enough books available');

		let loanData: Partial<LoanEntity>;

		switch (data.borrower_type) {
			case LoanBorrowerType.REGISTERED_USER: {
				if (!data.user_id)
					throw new BadRequestException('Invalid payload provided');
				const user = await this.usersService.findById(data.user_id);
				if (!user)
					throw new NotFoundException(`User with id ${data.user_id} not found`);

				loanData = {
					loan_date: new Date(),
					book_id: data.bookId,
					quantity: data.quantity,
					borrower_type: data.borrower_type,
					user_id: user.id,
					return_date: data.returnDate,
					status: LoanStatus.ACTIVE,
				};
				break;
			}
			case LoanBorrowerType.EXTERNAL_BORROWER: {
				if (
					!data.borrower_email ||
					!data.borrower_name ||
					!data.borrower_national_id ||
					!data.borrower_phone
				)
					throw new BadRequestException('Invalid payload provided');

				loanData = {
					borrower_email: data.borrower_email,
					borrower_name: data.borrower_name,
					borrower_national_id: data.borrower_national_id,
					borrower_phone: data.borrower_phone,
					book_id: data.bookId,
					quantity: data.quantity,
					borrower_type: data.borrower_type,
					return_date: data.returnDate,
					status: LoanStatus.ACTIVE,
					loan_date: new Date(),
				};
				break;
			}
			default:
				throw new BadRequestException('Invalid borrower type');
		}

		const loan = this.loanRepository.create(loanData);

		await this.bookService.removeStock(tenantId, data.bookId, data.quantity);

		return this.loanRepository.save(loan);
	}
	async returnBook(tenantId: number, loanId: number): Promise<UpdateResult> {
		const loan = await this.loanRepository.findOne({
			where: { id: loanId },
			relations: ['book'],
		});
		if (!loan) throw new NotFoundException('Loan not found');
		const book = await this.bookService.findById(tenantId, loan.book.id);
		if (!book) throw new NotFoundException('Book not found');
		if (loan.status === LoanStatus.RETURNED)
			throw new BadRequestException('Book already returned');
		await this.bookService.updateStock(tenantId, book.id, loan.quantity);
		loan.status = LoanStatus.RETURNED;
		loan.return_date = new Date(Date.now());
		return await this.update(loanId, loan);
	}
	//contar prestamos por tenant
	async countLoans(tenantId?: number) {
		const count = await this.loanRepository.count({
			where: tenantId ? { book: { tenant_id: tenantId } } : {},
		});

		return { count };
	}

	async paginatedLoans(
		queries: LoanQueriesDTO,
		tenantId: number,
	): Promise<IPaginatedResponse<LoanEntity>> {
		const qb = this.loanRepository
			.createQueryBuilder('loan')
			.leftJoinAndSelect('loan.book', 'book')
			.leftJoinAndSelect('loan.user', 'user')
			.where('book.tenant_id = :tenantId', { tenantId });
		const appliedJoins = new Set<string>(['book', 'user']);
		// 1. Aplicamos filtros automáticos (IDs, Fechas base, isActive)
		QueryHelper.applyBaseFilters(qb, queries, 'loan');

		// 2. Lógica de negocio específica (Esta NO va en el helper porque es única de Loans)
		if (queries.isOverdue) {
			qb.andWhere('loan.return_date < :now AND loan.status = :active', {
				now: new Date(),
				active: LoanStatus.ACTIVE,
			});
		}

		if (queries.search) {
			qb.andWhere('(book.title ILIKE :s OR loan.borrower_name ILIKE :s)', {
				s: `%${queries.search}%`,
			});
		}
		// 3. Relaciones dinámicas (Usando la lógica que corregimos antes)
		(queries.relations ?? []).forEach((rel) => {
			if (!rel) return;

			// Relación simple: 'book'
			if (!rel.includes('.')) {
				const alias = String(rel);

				if (!appliedJoins.has(alias)) {
					qb.leftJoinAndSelect(`loan.${alias}`, alias);
					appliedJoins.add(alias);
				}
				return;
			}

			// Relación anidada: 'book.publisher'
			const [parent, child] = rel.split('.');

			// join del padre
			if (!appliedJoins.has(parent)) {
				qb.leftJoinAndSelect(`loan.${parent}`, parent);
				appliedJoins.add(parent);
			}

			const childAlias = `${parent}_${child}`;

			// join del hijo
			if (!appliedJoins.has(childAlias)) {
				qb.leftJoinAndSelect(`${parent}.${child}`, childAlias);
				appliedJoins.add(childAlias);
			}
		});

		// 4. Paginación y Respuesta unificada
		QueryHelper.applyBasePagination(qb, queries, 'loan');
		return QueryHelper.getPaginatedResponse(qb, queries);
	}
	async getStatistics(
		tenantId: number,
		userId?: number,
	): Promise<ILoanStatistics> {
		const qb = this.loanRepository.createQueryBuilder('loan');

		if (userId) {
			qb.andWhere('loan.user_id = :userId', { userId });
		}

		const now = new Date();
		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(now.getDate() + 7);

		const [active, dueSoon, overdue, returned] = await Promise.all([
			// Préstamos activos
			qb
				.clone()
				.andWhere('loan.status = :status', { status: LoanStatus.ACTIVE })
				.andWhere(userId ? 'loan.user_id = :userId' : '1=1', { userId })
				.getCount(),

			// Por vencer (próximos 7 días)
			qb
				.clone()
				.andWhere('loan.status = :status', { status: LoanStatus.ACTIVE })
				.andWhere('loan.return_date BETWEEN :now AND :future', {
					now,
					future: sevenDaysFromNow,
				})
				.andWhere(userId ? 'loan.user_id = :userId' : '1=1', { userId })
				.getCount(),

			// Vencidos
			qb
				.clone()
				.andWhere('loan.status = :status', { status: LoanStatus.ACTIVE })
				.andWhere('loan.return_date < :now', { now })
				.andWhere(userId ? 'loan.user_id = :userId' : '1=1', { userId })
				.getCount(),

			// Devueltos
			qb
				.clone()
				.andWhere('loan.status = :status', { status: LoanStatus.RETURNED })
				.andWhere(userId ? 'loan.user_id = :userId' : '1=1', { userId })
				.getCount(),
		]);

		return { active, dueSoon, overdue, returned };
	}
	async mostLoanedBooks(
		limit: number,
		tenantId?: number,
	): Promise<MostLoanedBooks[]> {
		const query = this.loanRepository
			.createQueryBuilder('loan')
			.select([
				'book.id AS id',
				'book.title AS title',
				'book.tenant_id AS tenant_id',
				'COUNT(*)::int AS count', // tipado correcto en PG
			])
			.innerJoin('loan.book', 'book')
			.groupBy('book.id')
			.addGroupBy('book.tenant_id')
			.orderBy('count', 'DESC')
			.limit(limit);

		if (tenantId) {
			query.andWhere('book.tenant_id = :tenantId', { tenantId });
		}

		return query.getRawMany();
	}

	async lastsLoans(tenantId?: number): Promise<LoanEntity[]> {
		return this.loanRepository.find({
			where: tenantId ? { book: { tenant_id: tenantId } } : {},
			relations: ['book', 'user'],
			order: { loan_date: 'desc' },
			take: 3,
		});
	}
	async getLastReturnedLoans(tenantId?: number) {
		return this.loanRepository.find({
			where: tenantId
				? { book: { tenant_id: tenantId }, status: LoanStatus.RETURNED }
				: { status: LoanStatus.RETURNED },
			relations: ['book'],
			order: { loan_date: 'desc' },
			take: 3,
		});
	}
	async getLoansByMonth(tenantId?: number) {
		const qb = this.loanRepository
			.createQueryBuilder('loan')
			.select("TO_CHAR(loan.loan_date, 'YYYY-MM')", 'month')
			.addSelect('COUNT(*)', 'count')
			.innerJoin('loan.book', 'book')
			.groupBy('month')
			.orderBy('month', 'ASC');

		if (tenantId)
			qb.andWhere('book.tenant_id = :tenantId', { tenantId: tenantId });
		return qb.getRawMany();
	}

	async requestLoan(dto: RequestLoanDTO, user: IAuthUser): Promise<LoanEntity> {
		const book = await this.bookService.findById(user.tenantId, dto.bookId);
		if (!book) throw new NotFoundException('Book not found');
		if (dto.quantity <= 0)
			throw new BadRequestException('Quantity must be greater than zero');
		if (new Date(Date.now()) > dto.returnDate)
			throw new BadRequestException('Return date cannot be in the past');
		if (book.availableQuantity < dto.quantity)
			throw new BadRequestException('Not enough books available');
		return this.loanRepository.save({
			...dto,
			user_id: user.id,
			borrower_type: LoanBorrowerType.REGISTERED_USER,
			status: LoanStatus.REQUESTED,
		});
	}
	async updateLoanStatus(
		status: LoanStatus,
		loanId: number,
	): Promise<LoanEntity> {
		const loan = (await this.findById(loanId)) as LoanEntity;
		if (!loan) throw new NotFoundException('Loan not founded');
		loan.status = status;
		await this.update(loanId, loan);
		return loan;
	}
	async getAlerts(tenantId: number, userId?: number): Promise<ILoanAlert[]> {
		const qb = this.loanRepository
			.createQueryBuilder('loan')
			.leftJoinAndSelect('loan.book', 'book')
			.where('book.tenant_id = :tenantId', { tenantId })
			.andWhere('loan.status = :status', { status: LoanStatus.ACTIVE });

		if (userId) {
			qb.andWhere('loan.user_id = :userId', { userId });
		}

		const loans = await qb.getMany();
		const now = new Date(Date.now());
		const alerts: ILoanAlert[] = [];

		// Alertas de préstamos vencidos
		const overdueLoans = loans.filter((loan) => loan.return_date < now);
		overdueLoans.forEach((loan) => {
			const daysOverdue = differenceInDays(now, loan.return_date);
			alerts.push({
				type: 'overdue',
				severity: 'error',
				message: `${loan.book.title} tiene ${daysOverdue} día${daysOverdue > 1 ? 's' : ''} de atraso`,
				loan,
				daysOverdue,
			});
		});

		// Alertas de préstamos por vencer
		// pasar a date-fns
		const sevenDaysFromNow = addDays(now, 7);

		const dueSoonLoans = loans.filter(
			(loan) => loan.return_date >= now && loan.return_date <= sevenDaysFromNow,
		);
		dueSoonLoans.forEach((loan) => {
			const daysUntilDue = differenceInDays(loan.return_date, now);
			const timeText =
				daysUntilDue === 0
					? 'hoy'
					: daysUntilDue === 1
						? 'mañana'
						: `en ${daysUntilDue} días`;
			alerts.push({
				type: 'due_soon',
				severity: 'warning',
				message: `${loan.book.title} vence ${timeText}`,
				loan,
				daysUntilDue,
			});
		});

		// Alerta informativa de cantidad de préstamos activos
		const activeCount = loans.length;
		if (activeCount >= 8) {
			alerts.push({
				type: 'info',
				severity: 'info',
				message: `Tienes ${activeCount} de 10 préstamos activos`,
			});
		}

		// Ordenar por severidad
		return alerts.sort((a, b) => {
			const severityOrder = { error: 0, warning: 1, info: 2 };
			return severityOrder[a.severity] - severityOrder[b.severity];
		});
	}
}
