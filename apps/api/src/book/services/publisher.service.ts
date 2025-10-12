import { MultiTenantService } from '@/core/multi-tenant.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublisherEntity } from '../entities/publisher.entity';

@Injectable()
export class PublisherService extends MultiTenantService<PublisherEntity> {
	constructor(
		@InjectRepository(PublisherEntity)
		private readonly publisherRepository: Repository<PublisherEntity>,
	) {
		super(publisherRepository);
	}
}
