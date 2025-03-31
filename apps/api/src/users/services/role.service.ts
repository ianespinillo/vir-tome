import { Injectable } from '@nestjs/common';
import { GenericService } from 'src/core/generic.service';
import { RoleEntity } from '../entites/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService extends GenericService{
    constructor(
        @InjectRepository(RoleEntity)
        private readonly roleRepository: Repository<RoleEntity>,
    ){
        super(roleRepository);
    }
}
