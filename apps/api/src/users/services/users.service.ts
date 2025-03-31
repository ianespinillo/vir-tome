import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GenericService } from '../../core/generic.service';
import { Repository } from 'typeorm';
import { UserEntity } from '../entites/user.entity';
import { SignUpDto } from '@repo/common';
import { PasswordAdapter } from '../../core/passport-adapter';

@Injectable()
export class UsersService extends GenericService{
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {
        super(userRepository);
    }
    async createUser(user: SignUpDto): Promise<UserEntity> {
        const exists = await this.findUserByEmail(user.email);
        if (exists) {
            throw new BadRequestException('User already exists');
        }
        const newUser = this.userRepository.create(user);
        const password = await PasswordAdapter.hashPassword(user.password);
        newUser.password = password;
        return this.userRepository.save(newUser);
    }
    async findUserByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { email }});
    }

}
