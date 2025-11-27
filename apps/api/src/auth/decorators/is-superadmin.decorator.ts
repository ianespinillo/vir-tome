import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SuperAdminGuard } from '../guard/super-admin.guard';

export const IsSuperAdmin = () =>
	applyDecorators(
		UseGuards(AuthGuard('jwt'), SuperAdminGuard),
		ApiBearerAuth(),
		ApiUnauthorizedResponse({ description: 'Not authenticated' }),
		ApiForbiddenResponse({ description: 'Super Admin role required' }),
	);
