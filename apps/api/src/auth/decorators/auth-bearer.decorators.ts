import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MultitenantGuard } from '../guard/multitenant.guard';

export const AuthBearer = () =>
	applyDecorators(UseGuards(AuthGuard('jwt'), MultitenantGuard));
