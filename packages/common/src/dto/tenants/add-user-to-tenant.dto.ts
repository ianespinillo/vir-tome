import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { ROLES } from '../../enum/roles.enum';

export class AddUserToTenantDto {
	@IsNumber()
	tenantId!: number;

	@IsIn(Object.values(ROLES))
	role!: ROLES;

	@IsOptional()
	@IsNumber()
	roleId?: number;
}
