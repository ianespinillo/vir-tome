import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { UsersController } from './controllers/users.controller';
import { RoleEntity } from './entities/role.entity';
import { UserTenantEntity } from './entities/user-tenant.entity';
import { UserEntity } from './entities/user.entity';
import { RoleService } from './services/role.service';
import { UsersService } from './services/users.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, RoleEntity, UserTenantEntity]),
		EmailModule,
	],
	exports: [UsersService, RoleService],
	providers: [UsersService, RoleService],
	controllers: [UsersController],
})
export class UsersModule {}
