import { BookEntity } from '@/book/entities/book.entity';
import { LoanEntity } from '@/loan/entities/loan.entity';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { RoleEntity } from '@/users/entities/role.entity';
import { UserEntity } from '@/users/entities/user.entity';
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	CreateTenantDto,
	IDashboardResponse,
	ILoansByMonth,
	LoanStatus,
	ROLES,
	TenantMetricsDto,
	UpdateTenantDto,
} from '@repo/common';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

// src/admin/admin.service.ts
@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(TenantEntity)
		private readonly tenantsRepo: Repository<TenantEntity>,
		@InjectRepository(UserEntity)
		private readonly usersRepo: Repository<UserEntity>,
		@InjectRepository(BookEntity)
		private readonly booksRepo: Repository<BookEntity>,
		@InjectRepository(LoanEntity)
		private readonly loansRepo: Repository<LoanEntity>,
		@InjectRepository(RoleEntity)
		private readonly rolesRepo: Repository<RoleEntity>,
	) {}

	// ============================================
	// DASHBOARD
	// ============================================
	async getDashboardMetrics(): Promise<IDashboardResponse> {
		const [
			total_tenants,
			active_tenants,
			total_users,
			total_books,
			active_loans,
		] = await Promise.all([
			this.tenantsRepo.count(),
			this.tenantsRepo.count({ where: { is_active: true } }),
			this.usersRepo.count(),
			this.booksRepo.count(),
			this.loansRepo.count({ where: { status: LoanStatus.ACTIVE } }),
		]);

		const recent_tenants = await this.tenantsRepo.find({
			order: { created_at: 'DESC' },
			take: 5,
			select: ['id', 'name', 'subdomain', 'created_at', 'plan', 'is_active'],
		});

		return {
			total_tenants,
			active_tenants,
			total_users,
			total_books,
			active_loans,
			recent_tenants: recent_tenants.map((t) => ({
				id: t.id,
				name: t.name,
				subdomain: t.subdomain,
				created_at: t.created_at,
				plan: t.plan || 'free',
				status: t.is_active,
			})),
		};
	}

	// ============================================
	// TENANTS CRUD
	// ============================================
	async createTenant(dto: CreateTenantDto): Promise<TenantEntity> {
		// 1. Validar subdomain único
		const existing = await this.tenantsRepo.findOne({
			where: { subdomain: dto.subdomain },
		});
		if (existing) {
			throw new ConflictException('Subdomain already exists');
		}

		// 2. Crear tenant
		const tenant = await this.tenantsRepo.save({
			subdomain: dto.subdomain,
			name: dto.name,
			contact_email: dto.contact_email,
			plan: dto.plan || 'free',
			is_active: true,
			settings: this.getDefaultSettings(dto.plan),
		});

		return tenant;
	}

	async listTenants(page: number, search?: string, status = 'all') {
		const query = this.tenantsRepo
			.createQueryBuilder('tenant')
			.leftJoinAndSelect('tenant.userTenants', 'userTenants')
			.leftJoinAndSelect('userTenants.user', 'users')
			.leftJoinAndSelect('tenant.books', 'books');

		if (search) {
			query.where('tenant.name ILIKE :search OR tenant.subdomain ILIKE :search', {
				search: `%${search}%`,
			});
		}

		if (status === 'active') {
			query.andWhere('tenant.is_active = true');
		} else if (status === 'inactive') {
			query.andWhere('tenant.is_active = false');
		}

		const [data, total] = await query
			.skip((page - 1) * 10)
			.take(10)
			.getManyAndCount();

		return {
			data: data,
			meta: {
				total,
				page,
				lastPage: Math.ceil(total / 10),
			},
		};
	}

	async getTenantDetails(id: number) {
		const tenant = await this.tenantsRepo.findOne({
			where: { id },
			relations: ['users', 'books'],
		});

		if (!tenant) {
			throw new NotFoundException('Tenant not found');
		}

		return tenant;
	}

	async updateTenant(id: number, dto: UpdateTenantDto) {
		const tenant = await this.tenantsRepo.findOne({ where: { id } });
		if (!tenant) {
			throw new NotFoundException('Tenant not found');
		}

		await this.tenantsRepo.update(id, dto);
		return this.tenantsRepo.findOne({ where: { id } });
	}

	async softDeleteTenant(id: number) {
		const tenant = await this.tenantsRepo.findOne({ where: { id } });
		if (!tenant) {
			throw new NotFoundException('Tenant not found');
		}

		if (tenant.is_demo) {
			throw new BadRequestException('Cannot delete demo tenant');
		}

		await this.tenantsRepo.softDelete(id);
		return { message: 'Tenant deleted successfully' };
	}

	async setTenantStatus(id: number, is_active: boolean) {
		await this.tenantsRepo.update(id, { is_active });
		return { message: `Tenant ${is_active ? 'activated' : 'deactivated'}` };
	}

	// ============================================
	// METRICS
	// ============================================
	async getTenantMetrics(tenantId: number): Promise<TenantMetricsDto> {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const [
			totalUsers,
			activeUsers,
			usersByRole,
			totalBooks,
			availableBooks,
			totalLoans,
			activeLoans,
			overdueLoans,
		] = await Promise.all([
			this.usersRepo.count({ where: { userTenants: { tenant_id: tenantId } } }),
			this.usersRepo.count({
				where: {
					userTenants: { tenant_id: tenantId },
					// Agregar campo last_login_at si existe
				},
			}),
			this.getUsersByRole(tenantId),
			this.booksRepo.count({ where: { tenant_id: tenantId } }),
			this.booksRepo.sum('availableQuantity', { tenant_id: tenantId }),
			this.loansRepo.count({
				where: { user: { userTenants: { tenant_id: tenantId } } },
			}),
			this.loansRepo.count({
				where: {
					user: { userTenants: { tenant_id: tenantId } },
					status: LoanStatus.ACTIVE,
				},
			}),
			this.loansRepo.count({
				where: {
					user: { userTenants: { tenant_id: tenantId } },
					status: LoanStatus.OVERDUE,
				},
			}),
		]);

		return {
			users: {
				total: totalUsers,
				active: activeUsers,
				by_role: usersByRole,
			},
			books: {
				total: totalBooks,
				available: availableBooks || 0,
				borrowed: totalLoans - (activeLoans + overdueLoans),
			},
			loans: {
				total: totalLoans,
				active: activeLoans,
				overdue: overdueLoans,
				returned: totalLoans - activeLoans - overdueLoans,
			},
			activity: {
				last_login: null, // Implementar si tienes tracking
				recent_activity: [], // Implementar si tienes logs
			},
		};
	}

	private async getUsersByRole(tenantId: number) {
		const users = await this.usersRepo.find({
			where: { userTenants: { tenant_id: tenantId } },
		});

		const byRole = {
			admin: 0,
			librarian: 0,
			teacher: 0,
			student: 0,
		};

		for (const user of users) {
			const role = user.getRoleInTenant(tenantId);
			if (role) {
				switch (role.name) {
					case ROLES.ADMIN:
						byRole.admin += 1;
						break;
					case ROLES.LIBRARIAN:
						byRole.librarian += 1;
						break;
					case ROLES.TEACHER:
						byRole.teacher += 1;
						break;
					case ROLES.STUDENT:
						byRole.student += 1;
						break;
				}
			}
		}

		return byRole;
	}

	async getTenantActivity(tenantId: number, days: number) {
		// Implementar según tus necesidades
		// Por ahora retornar estructura básica
		return {
			period_days: days,
			activities: [],
		};
	}

	async getTenantUsers(tenantId: number, page: number) {
		const [data, total] = await this.usersRepo.findAndCount({
			where: { userTenants: { tenant_id: tenantId } },

			skip: (page - 1) * 10,
			take: 10,
			order: { created_at: 'DESC' },
		});

		return {
			data,
			meta: {
				total,
				page,
				lastPage: Math.ceil(total / 10),
			},
		};
	}

	// ============================================
	// HELPERS
	// ============================================
	private getDefaultSettings(plan?: string) {
		const limits = {
			free: { max_users: 50, max_books: 200, max_loans: 100 },
			basic: { max_users: 100, max_books: 500, max_loans: 300 },
			premium: { max_users: 500, max_books: 2000, max_loans: 1000 },
			enterprise: { max_users: -1, max_books: -1, max_loans: -1 }, // Unlimited
		};

		return {
			limits: limits[plan as keyof typeof limits] || limits.free,
			features:
				plan === 'premium' || plan === 'enterprise'
					? ['basic_library', 'advanced_reports', 'loan_management', 'notifications']
					: ['basic_library'],
		};
	}

	async getLoansByMonth(): Promise<ILoansByMonth[]> {
		const data = await this.loansRepo
			.createQueryBuilder('loan')
			.select("DATE_TRUNC('month', loan.loan_date)", 'month')
			.addSelect('COUNT(*)', 'count')
			.groupBy('month')
			.orderBy('month', 'ASC')
			.getRawMany();
		return data.map((item) => ({
			name: this.monthHelper(item.month),
			total: Number.parseInt(item.count),
		}));
	}
	private monthHelper(monthStamp: string): string {
		const month = new Date(monthStamp).getMonth();
		const monthNames = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];
		return monthNames[month];
	}
	private generateRandomPassword(): string {
		return Math.random().toString(36).slice(-8);
	}
}
