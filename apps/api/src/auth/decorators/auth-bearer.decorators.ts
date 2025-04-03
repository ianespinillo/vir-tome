import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const AuthBearer = () => applyDecorators(UseGuards(AuthGuard('jwt')));
