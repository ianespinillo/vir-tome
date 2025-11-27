import { IsSuperAdmin } from '@/auth/decorators/is-superadmin.decorator';
import {
	Body,
	Controller,
	Delete,
	Get,
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
import { CreateTenantDto, UpdateTenantDto } from '@repo/common';
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
	async getDashboard() {
		return this.adminService.getDashboardMetrics();
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
	) {
		return this.adminService.listTenants(page, search, status);
	}

	@Get('tenants/:id')
	@ApiOperation({ summary: 'Get tenant details' })
	@ApiParam({ name: 'id', type: Number })
	async getTenant(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.getTenantDetails(id);
	}

	@Post('tenants')
	@ApiOperation({ summary: 'Create new tenant' })
	@ApiBody({ type: CreateTenantDto })
	@ApiResponse({ status: 201, description: 'Tenant created with admin user' })
	async createTenant(@Body() dto: CreateTenantDto) {
		return this.adminService.createTenant(dto);
	}

	@Patch('tenants/:id')
	@ApiOperation({ summary: 'Update tenant' })
	@ApiParam({ name: 'id', type: Number })
	@ApiBody({ type: UpdateTenantDto })
	async updateTenant(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateTenantDto,
	) {
		return this.adminService.updateTenant(id, dto);
	}

	@Delete('tenants/:id')
	@ApiOperation({ summary: 'Soft delete tenant' })
	@ApiParam({ name: 'id', type: Number })
	async deleteTenant(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.softDeleteTenant(id);
	}

	// ============================================
	// TENANT ACTIONS
	// ============================================
	@Put('tenants/:id/activate')
	@ApiOperation({ summary: 'Activate tenant' })
	@ApiParam({ name: 'id', type: Number })
	async activateTenant(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.setTenantStatus(id, true);
	}

	@Put('tenants/:id/deactivate')
	@ApiOperation({ summary: 'Deactivate tenant' })
	@ApiParam({ name: 'id', type: Number })
	async deactivateTenant(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.setTenantStatus(id, false);
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
	async getTenantMetrics(@Param('id', ParseIntPipe) id: number) {
		return this.adminService.getTenantMetrics(id);
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
	) {
		return this.adminService.getTenantActivity(id, days);
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
	) {
		return this.adminService.getTenantUsers(id, page);
	}
}
