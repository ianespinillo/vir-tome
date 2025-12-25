import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from '@nestjs/common';
import { AddUserToTenantDto } from '@repo/common';
import { RoleService } from '../services/role.service';

@Injectable()
export class InyectRoleidPipe implements PipeTransform {
	constructor(private readonly roleService: RoleService) {}
	async transform(value: AddUserToTenantDto, metadata: ArgumentMetadata) {
		if (value.roleId === undefined) {
			const role = await this.roleService.findRoleByName(value.role);
			if (!role) throw new BadRequestException('Invalid role provided');
			value.roleId = role.id;
		}
		return value;
	}
}
