import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entites/user.entity';
import { RoleService } from './services/role.service';
import { RoleEntity } from './entites/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity])],
  exports: [UsersService],
  providers: [UsersService, RoleService],
})
export class UsersModule {}
