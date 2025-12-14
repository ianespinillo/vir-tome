import { IsSuperAdmin } from '@/auth/decorators/is-superadmin.decorator';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { UserEntity } from '@/users/entities/user.entity';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import {
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import {
	CreateTenantDto,
	IApiResponse,
	IDashboardResponse,
	ILoansByMonth,
	IMessageResponse,
	IPaginatedResponse,
	TenantMetricsDto,
	UpdateTenantDto,
} from '@repo/common';
import { AdminService } from '../services/admin.service';

// src/admin/admin.controller.ts
@ApiTags('Super Admin Panel')
@Controller('super-admin')
@IsSuperAdmin()
export class SuperAdminController {
	constructor(private readonly adminService: AdminService) {}

	// ============================================
	// DASHBOARD
	// ============================================
	@Get('dashboard')
	@ApiOperation({ summary: 'Get global dashboard metrics' })
	@ApiResponse({
		status: 200,
		description: 'Dashboard data',
		schema: {
			example: {
				total_tenants: 5,
				active_tenants: 4,
				total_users: 120,
				total_books: 450,
				total_loans: 89,
				recent_activity: [{ date: '2024-01-15', new_tenants: 1, new_users: 5 }],
			},
		},
	})
	async getDashboard(): Promise<IApiResponse<IDashboardResponse>> {
		const data = await this.adminService.getDashboardMetrics();
		return {
			message: 'Dashboard data retrieved successfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('loans/monthly')
	@ApiOperation({ summary: 'Get loans by month' })
	async getLoansByMonth(): Promise<IApiResponse<ILoansByMonth[]>> {
		const res = await this.adminService.getLoansByMonth();
		return {
			message: 'Loans by month retrieved successfully',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	// ============================================
	// TENANTS CRUD
	// ============================================
	@Get('tenants')
	@ApiOperation({ summary: 'List all tenants (paginated)' })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'search', required: false, type: String })
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['all', 'active', 'inactive'],
	})
	@ApiResponse({
		status: 200,
		schema: {
			example: {
				data: [
					{
						id: 1,
						subdomain: 'escuela1',
						name: 'Escuela Primaria 1',
						plan: 'premium',
						is_active: true,
						created_at: '2024-01-10',
						users_count: 45,
						books_count: 120,
					},
				],
				meta: {
					total: 5,
					page: 1,
					lastPage: 1,
				},
			},
		},
	})
	async listTenants(
		@Query('page') page = 1,
		@Query('search') search?: string,
		@Query('status') status = 'all',
	): Promise<IApiResponse<IPaginatedResponse<TenantEntity>>> {
		const res = await this.adminService.listTenants(page, search, status);
		return {
			message: 'Tenants retrieved successfully',
			data: {
				items: res.data,
				meta: {
					total: res.meta.total,
					current_page: res.meta.page,
					last_page: Math.round(res.meta.total / 10),
					per_page: 10,
				},
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('tenants/:id')
	@ApiOperation({ summary: 'Get tenant details' })
	@ApiParam({ name: 'id', type: Number })
	async getTenant(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<TenantEntity>> {
		const tenant = await this.adminService.getTenantDetails(id);
		return {
			message: 'Tenant retrieved successfully',
			data: tenant,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Post('tenants')
	@ApiOperation({ summary: 'Create new tenant' })
	@ApiBody({ type: CreateTenantDto })
	@ApiResponse({ status: 201, description: 'Tenant created with admin user' })
	async createTenant(
		@Body() dto: CreateTenantDto,
	): Promise<IApiResponse<TenantEntity>> {
		const entity = await this.adminService.createTenant(dto);
		return {
			message: 'Tenant created successfully',
			data: entity,
			status: HttpStatus.CREATED,
			timestamp: new Date().toISOString(),
		};
	}

	@Patch('tenants/:id')
	@ApiOperation({ summary: 'Update tenant' })
	@ApiParam({ name: 'id', type: Number })
	@ApiBody({ type: UpdateTenantDto })
	async updateTenant(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateTenantDto,
	): Promise<IApiResponse<TenantEntity>> {
		const entity = await this.adminService.updateTenant(id, dto);
		return {
			message: 'Tenant updated successfully',
			data: entity,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Delete('tenants/:id')
	@ApiOperation({ summary: 'Soft delete tenant' })
	@ApiParam({ name: 'id', type: Number })
	async deleteTenant(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<IMessageResponse>> {
		const tenant = await this.adminService.softDeleteTenant(id);
		return {
			message: 'Tenant deleted successfully',
			data: tenant,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	// ============================================
	// TENANT ACTIONS
	// ============================================
	@Put('tenants/:id/activate')
	@ApiOperation({ summary: 'Activate tenant' })
	@ApiParam({ name: 'id', type: Number })
	async activateTenant(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<IMessageResponse>> {
		const res = await this.adminService.setTenantStatus(id, true);
		return {
			message: 'Tenant activated successfully',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Put('tenants/:id/deactivate')
	@ApiOperation({ summary: 'Deactivate tenant' })
	@ApiParam({ name: 'id', type: Number })
	async deactivateTenant(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<IMessageResponse>> {
		const res = await this.adminService.setTenantStatus(id, false);
		return {
			message: 'Tenant deactivated successfully',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	// ============================================
	// TENANT METRICS
	// ============================================
	@Get('tenants/:id/metrics')
	@ApiOperation({ summary: 'Get tenant metrics' })
	@ApiParam({ name: 'id', type: Number })
	@ApiResponse({
		status: 200,
		description: 'Detailed metrics for tenant',
		type: 'TenantMetricsDto', // Usar el DTO definido arriba
	})
	async getTenantMetrics(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<TenantMetricsDto>> {
		const res = await this.adminService.getTenantMetrics(id);
		return {
			message: 'Tenant metrics retrieved successfully',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('tenants/:id/activity')
	@ApiOperation({ summary: 'Get tenant activity logs' })
	@ApiParam({ name: 'id', type: Number })
	@ApiQuery({
		name: 'days',
		required: false,
		type: Number,
		description: 'Days to look back (default 30)',
	})
	async getTenantActivity(
		@Param('id', ParseIntPipe) id: number,
		@Query('days') days = 30,
	): Promise<IApiResponse<any>> {
		const res = await this.adminService.getTenantActivity(id, days);
		return {
			message: 'Tenant activity retrieved successfully',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	// ============================================
	// TENANT USERS
	// ============================================
	@Get('tenants/:id/users')
	@ApiOperation({ summary: 'List users of a tenant' })
	@ApiParam({ name: 'id', type: Number })
	@ApiQuery({ name: 'page', required: false, type: Number })
	async getTenantUsers(
		@Param('id', ParseIntPipe) id: number,
		@Query('page') page = 1,
	): Promise<IApiResponse<IPaginatedResponse<UserEntity>>> {
		const { data, meta } = await this.adminService.getTenantUsers(id, page);
		return {
			message: 'Tenant users retrieved successfully',
			data: {
				items: data,
				meta: {
					total: meta.total,
					current_page: meta.page,
					last_page: Math.round(meta.total / 10),
					per_page: 10,
				},
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
}
