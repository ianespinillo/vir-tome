import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from '../book/entities/book.entity';
import { EmailModule } from '../email/email.module';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { SuperAdminController } from './controllers/super-admin.controller';
import { SuperAdminEntity } from './entities/super-admin.entity';
import { AdminService } from './services/admin.service';
import { SuperAdminService } from './services/super-admin.service';

@Module({
	imports: [
		EmailModule,
		TypeOrmModule.forFeature([
			SuperAdminEntity,
			RoleEntity,
			UserEntity,
			TenantEntity,
			LoanEntity,
			BookEntity,
		]),
	],
	providers: [SuperAdminService, AdminService],
	controllers: [SuperAdminController],
	exports: [SuperAdminService, AdminService],
})
export class SuperAdminModule {}
