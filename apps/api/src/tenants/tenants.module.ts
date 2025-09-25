import { UsersModule } from '@/users/users.module';
// src/tenants/tenants.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { TenantGuard } from './guards/tenant.guard';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
	imports: [TypeOrmModule.forFeature([TenantEntity]), UsersModule],
	controllers: [TenantsController],
	providers: [TenantsService, TenantGuard],
	exports: [TenantsService, TypeOrmModule, TenantGuard], // Exportar para usar en otros módulos
})
export class TenantsModule {}
