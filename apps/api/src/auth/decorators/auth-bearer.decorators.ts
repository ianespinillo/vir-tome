import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";


export const AuthBearer = () => applyDecorators(UseGuards(AuthGuard('jwt')))