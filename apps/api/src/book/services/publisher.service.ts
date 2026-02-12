import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePublisherDto, IPaginatedResponse } from '@repo/common';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { GenericService } from '../../core/generic.service';
import { PublisherEntity } from '../entities/publisher.entity';

@Injectable()
export class PublisherService extends GenericService {
	constructor(
		@InjectRepository(PublisherEntity)
		private readonly publisherRepository: Repository<PublisherEntity>,
	) {
		super(publisherRepository);
	}
	async findById(id: number): Promise<PublisherEntity | null> {
		return this.publisherRepository.findOneBy({ id });
	}
	async findAll(): Promise<PublisherEntity[]> {
		return this.publisherRepository.find();
	}
	async createPublisher({ name }: CreatePublisherDto): Promise<PublisherEntity> {
		if (await this.findByName(name))
			throw new BadRequestException('Publisher already exists');
		const publisher = this.publisherRepository.create({ name });
		return this.publisherRepository.save(publisher);
	}
	async deletePublisher(id: number): Promise<void> {
		await this.publisherRepository.update(id, { deleted_at: new Date() });
	}
	async getPaginated(
		page: number,
		q?: string,
	): Promise<IPaginatedResponse<PublisherEntity>> {
		const where: FindOptionsWhere<PublisherEntity> = {
			deleted_at: IsNull(),
		};
		if (q) where.name = ILike(`%${q}%`);
		const [data, count] = await this.publisherRepository.findAndCount({
			where,
			take: 5,
			skip: 5 * (page - 1),
		});
		return {
			items: data,
			meta: {
				current_page: page,
				last_page: Math.ceil(count / 5),
				per_page: 5,
				total: count,
			},
		};
	}
}
