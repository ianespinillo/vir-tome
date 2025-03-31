import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePublisherDto, UpdatePublisherDto } from '@repo/common';
import { GenericService } from '../../core/generic.service';
import { Repository } from 'typeorm';
import { PublisherEntity } from '../entities/publisher.entity';

@Injectable()
export class PublisherService extends GenericService {
    constructor(
        @InjectRepository(PublisherEntity)
        private readonly publisherRepository: Repository<PublisherEntity>,
      ) {
        super(publisherRepository);
      }
    
      async createPublisher(createDto: CreatePublisherDto): Promise<PublisherEntity> {
        return this.create(createDto);
      }
    
      async updatePublisher(
        id: number,
        updateDto: UpdatePublisherDto,
      ): Promise<void> {
        await this.update(id, updateDto);
      }
}
