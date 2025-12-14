import { IsSuperAdmin } from '@/auth/decorators/is-superadmin.decorator';
import { Roles as RolesDecorator } from '@/auth/decorators/roles.decorator';
import { User } from '@/auth/decorators/user.decorator';
import { RolesGuard } from '@/auth/guard/role.guard';
import { IAuthUser } from '@/core/core.types';
// src/tenants/tenants.controller.ts
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	ParseBoolPipe,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
	type CreateTenantDto,
	type IApiResponse,
	type IMessageResponse,
	type IPaginatedResponse,
	type ITenantStats,
	type IUser,
	ROLES,
	Roles,
	type UpdateTenantDto,
} from '@repo/common';
import { TenantEntity } from './entities/tenant.entity';
import { ValidRolePipe } from './pipe/valid-role.pipe';
import { TenantsService } from './tenants.service';
@ApiTags('tenants')
@RolesDecorator(ROLES.ADMIN, ROLES.SUPER_ADMIN)
@Controller('tenants')
export class TenantsController {
	constructor(private readonly tenantsService: TenantsService) {}

	@Post()
	@ApiOperation({ summary: 'Crear un tenant' })
	@ApiResponse({ status: 201, description: 'Tenant creado correctamente' })
	async create(
		@Body() createTenantDto: CreateTenantDto,
	): Promise<IApiResponse<TenantEntity>> {
		const tenant = await this.tenantsService.create(createTenantDto);
		return {
			message: 'Tenant created successfully',
			data: tenant,
			timestamp: new Date().toISOString(),
			status: HttpStatus.CREATED,
		};
	}
	@ApiOperation({ summary: 'Listar todos los tenants' })
	@ApiResponse({ status: 200, description: 'Lista de tenants' })
	@Get()
	async findAll(
		@Query('page', new ParseIntPipe({ optional: true })) page = 1,
		@Query('full', new ParseBoolPipe({ optional: true })) full = false,
		@Query('search') search?: string,
	): Promise<IApiResponse<TenantEntity[] | IPaginatedResponse<TenantEntity>>> {
		if (full) {
			const tenants = await this.tenantsService.findAll();
			return {
				message: 'Tenants retrieved successfully',
				data: tenants,
				timestamp: new Date().toISOString(),
				status: HttpStatus.OK,
			};
		}
		const tenants = await this.tenantsService.findPaginatedTenants(page, search);
		return {
			message: 'Tenants retrieved successfully',
			data: tenants,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('active')
	@ApiOperation({ summary: 'Listar tenants activos' })
	async findActive(): Promise<IApiResponse<TenantEntity[]>> {
		const tenants = await this.tenantsService.findActive();
		return {
			message: 'Active tenants retrieved successfully',
			data: tenants,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Get('stats')
	@ApiOperation({ summary: 'Obtener estadísticas de tenants' })
	async getStats(): Promise<IApiResponse<ITenantStats>> {
		const stats = await this.tenantsService.getStats();
		return {
			message: 'Tenant statistics retrieved successfully',
			data: stats,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Get('lasts')
	@ApiOperation({ summary: 'Get lasts tenants registered' })
	async getLastTenants(): Promise<IApiResponse<TenantEntity[]>> {
		const data = await this.tenantsService.getLastsTenants();
		return {
			message: 'Lasts tenants retrieved succesfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('subdomain/:subdomain')
	@ApiOperation({ summary: 'Buscar tenant por subdominio' })
	@ApiParam({ name: 'subdomain', type: String })
	async findBySubdomain(
		@Param('subdomain') subdomain: string,
	): Promise<IApiResponse<TenantEntity>> {
		const tenant = await this.tenantsService.findBySubdomain(subdomain);
		return {
			message: 'Tenant retrieved successfully',
			data: tenant,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar tenant por ID' })
	@ApiParam({ name: 'id', type: Number })
	async findOne(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<TenantEntity>> {
		const tenant = await this.tenantsService.findById(id);
		return {
			message: 'Tenant retrieved successfully',
			data: tenant,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Actualizar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateTenantDto: UpdateTenantDto,
	): Promise<IApiResponse<TenantEntity>> {
		console.log(updateTenantDto);
		const tenant = await this.tenantsService.update(id, updateTenantDto);
		return {
			message: 'Tenant updated successfully',
			data: tenant,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Patch(':id/activate')
	@ApiOperation({ summary: 'Activar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async activate(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<TenantEntity>> {
		const tenant = await this.tenantsService.activate(id);
		return {
			message: 'Tenant activated successfully',
			data: tenant,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Patch(':id/deactivate')
	@ApiOperation({ summary: 'Desactivar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async deactivate(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<TenantEntity>> {
		const tenant = await this.tenantsService.deactivate(id);
		return {
			message: 'Tenant deactivated successfully',
			timestamp: new Date().toISOString(),
			data: tenant,
			status: HttpStatus.OK,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Eliminar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async remove(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<IMessageResponse>> {
		await this.tenantsService.remove(id);
		return {
			message: 'Tenant deleted successfully',
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
			data: null,
		};
	}
}
