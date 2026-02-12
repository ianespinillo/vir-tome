import { AuthBearer } from '../../auth/decorators/auth-bearer.decorators';
import { Roles as RolesDecorator } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { IAuthUser } from '../../core/core.types';

import {
	Body,
	Controller,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
	ParseIntPipe,
	Post,
	Query,
} from '@nestjs/common';
import {
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import {
	AddUserToTenantDto,
	IApiResponse,
	IPaginatedResponse,
	IUser,
	IUserTenant,
	ROLES,
	UsersQueriesDto,
} from '@repo/common';
import { InyectRoleidPipe } from '../pipes/inyect-roleid.pipe';
import { UsersService } from '../services/users.service';

@ApiTags('users') // Grupo de endpoints para Swagger
@Controller('users')
export class UsersController {
	constructor(private readonly service: UsersService) {}

	@RolesDecorator(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.LIBRARIAN)
	@Get('')
	@ApiOperation({ summary: 'Obtener usuarios por rol' })
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Número de página',
	})
	@ApiQuery({
		name: 'role',
		required: true,
		type: String,
		description: 'Rol del usuario',
	})
	@ApiQuery({
		name: 'q',
		required: false,
		type: String,
		description: 'Filtro de búsqueda',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Lista de usuarios obtenida exitosamente',
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'No se proporcionó sesión',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Solicitud incorrecta',
	})
	async getUsersByRole(
		@User() user: IAuthUser,
		@Query() queries: UsersQueriesDto,
	): Promise<IApiResponse<IPaginatedResponse<IUser>>> {
		const data: IPaginatedResponse<IUser> = await this.service.getUsers(
			user,
			queries,
		);
		return {
			message: 'Users list retrived succesfully',
			data,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Get(':id')
	@AuthBearer()
	@ApiOperation({ summary: 'Obtener un usuario por ID' })
	@ApiParam({
		name: 'id',
		required: true,
		type: Number,
		description: 'ID del usuario',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Usuario obtenido exitosamente',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Usuario no encontrado',
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'No se proporcionó sesión',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Solicitud incorrecta',
	})
	async getUserById(
		@User() user: IAuthUser,
		@Param('id', new ParseIntPipe()) id: number,
	): Promise<IApiResponse<IUser>> {
		let data: IUser | null;
		if (user.roleName === ROLES.SUPER_ADMIN) {
			data = await this.service.findById(id);
			if (!data) throw new NotFoundException('User not found');
			const { password, ...rest } = data;
			return {
				message: 'User retrieved succesfully',
				timestamp: new Date().toISOString(),
				status: HttpStatus.OK,
				data: rest,
			};
		}
		data = await this.service.findByIdInTenant(id, user.tenantId);
		if (!data) throw new NotFoundException('User not found');
		const { password: pass2, ...rest2 } = data;
		return {
			message: 'User retrieved succesfully',
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
			data: rest2,
		};
	}
	@Get(':id/tenants')
	@AuthBearer()
	@ApiOperation({ summary: 'Obtener los tenants de un usuario' })
	@ApiParam({
		name: 'id',
		required: true,
		type: Number,
		description: 'ID del usuario',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Tenants obtenidos exitosamente',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Usuario no encontrado',
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'No se proporcionó sesión',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Solicitud incorrecta',
	})
	async getUserTenants(
		@Param('id', new ParseIntPipe()) id: number,
	): Promise<IApiResponse<IUserTenant[]>> {
		const data = await this.service.getUserTenants(id);
		return {
			message: 'User tenants retrieved successfully',
			data,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Post(':id/attach-tenant')
	@ApiOperation({ summary: 'Adjuntar un tenant a un usuario' })
	@ApiParam({ name: 'id', type: Number })
	async attachTenant(
		@Param('id', ParseIntPipe) id: number,
		@Body(InyectRoleidPipe) attachTenantDto: AddUserToTenantDto,
	): Promise<IApiResponse<IUser>> {
		const { user } = await this.service.addUserToTenant(
			id,
			attachTenantDto.tenantId,
			attachTenantDto.roleId ?? 0,
		);
		return {
			message: 'User attached to tenant successfully',
			data: user,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}
}
