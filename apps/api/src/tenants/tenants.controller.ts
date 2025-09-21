// src/tenants/tenants.controller.ts
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
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CreateTenantDto, UpdateTenantDto } from '@repo/common';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
	constructor(private readonly tenantsService: TenantsService) {}

	@Post()
	@ApiOperation({ summary: 'Crear un tenant' })
	@ApiResponse({ status: 201, description: 'Tenant creado correctamente' })
	async create(@Body() createTenantDto: CreateTenantDto) {
		const tenant = await this.tenantsService.create(createTenantDto);
		return {
			message: 'Tenant created successfully',
			data: tenant,
			status: HttpStatus.CREATED,
		};
	}

	@Get()
	@ApiOperation({ summary: 'Listar todos los tenants' })
	@ApiResponse({ status: 200, description: 'Lista de tenants' })
	async findAll() {
		const tenants = await this.tenantsService.findAll();
		return {
			message: 'Tenants retrieved successfully',
			data: tenants,
			status: HttpStatus.OK,
		};
	}

	@Get('active')
	@ApiOperation({ summary: 'Listar tenants activos' })
	async findActive() {
		const tenants = await this.tenantsService.findActive();
		return {
			message: 'Active tenants retrieved successfully',
			data: tenants,
			status: HttpStatus.OK,
		};
	}

	@Get('stats')
	@ApiOperation({ summary: 'Obtener estadísticas de tenants' })
	async getStats() {
		const stats = await this.tenantsService.getStats();
		return {
			message: 'Tenant statistics retrieved successfully',
			data: stats,
			status: HttpStatus.OK,
		};
	}

	@Get('subdomain/:subdomain')
	@ApiOperation({ summary: 'Buscar tenant por subdominio' })
	@ApiParam({ name: 'subdomain', type: String })
	async findBySubdomain(@Param('subdomain') subdomain: string) {
		const tenant = await this.tenantsService.findBySubdomain(subdomain);
		return {
			message: 'Tenant retrieved successfully',
			data: tenant,
			status: HttpStatus.OK,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Buscar tenant por ID' })
	@ApiParam({ name: 'id', type: Number })
	async findOne(@Param('id', ParseIntPipe) id: number) {
		const tenant = await this.tenantsService.findById(id);
		return {
			message: 'Tenant retrieved successfully',
			data: tenant,
			status: HttpStatus.OK,
		};
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Actualizar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateTenantDto: UpdateTenantDto,
	) {
		const tenant = await this.tenantsService.update(id, updateTenantDto);
		return {
			message: 'Tenant updated successfully',
			data: tenant,
			status: HttpStatus.OK,
		};
	}

	@Patch(':id/activate')
	@ApiOperation({ summary: 'Activar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async activate(@Param('id', ParseIntPipe) id: number) {
		const tenant = await this.tenantsService.activate(id);
		return {
			message: 'Tenant activated successfully',
			data: tenant,
			status: HttpStatus.OK,
		};
	}

	@Patch(':id/deactivate')
	@ApiOperation({ summary: 'Desactivar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async deactivate(@Param('id', ParseIntPipe) id: number) {
		const tenant = await this.tenantsService.deactivate(id);
		return {
			message: 'Tenant deactivated successfully',
			data: tenant,
			status: HttpStatus.OK,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Eliminar un tenant' })
	@ApiParam({ name: 'id', type: Number })
	async remove(@Param('id', ParseIntPipe) id: number) {
		await this.tenantsService.remove(id);
		return {
			message: 'Tenant deleted successfully',
			status: HttpStatus.OK,
		};
	}
}
