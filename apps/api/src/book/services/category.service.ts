import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	CreateCategoryDto,
	IPaginatedResponse,
	UpdateCategoryDto,
} from '@repo/common';
import {
	FindOptionsWhereProperty,
	ILike,
	In,
	IsNull,
	Repository,
} from 'typeorm';
import { GenericService } from '../../core/generic.service';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryService extends GenericService {
	constructor(
		@InjectRepository(CategoryEntity)
		private readonly categoryRepository: Repository<CategoryEntity>,
	) {
		super(categoryRepository);
	}

	async createCategory(
		createCategoryDto: CreateCategoryDto,
	): Promise<CategoryEntity> {
		const category = this.categoryRepository.create({
			name: createCategoryDto.name,
		});
		return this.categoryRepository.save<CategoryEntity>(category);
	}
	async updateCategory(
		id: number,
		updateCategoryDto: UpdateCategoryDto,
	): Promise<CategoryEntity | null> {
		await this.categoryRepository.update(id, updateCategoryDto);
		return this.categoryRepository.findOneBy({ id });
	}

	async findCategoriesByIds(ids: number[]): Promise<CategoryEntity[]> {
		return this.categoryRepository.find({
			where: { id: In(ids) },
		});
	}
	async getPaginated(
		page: number,
		q?: string,
	): Promise<IPaginatedResponse<CategoryEntity>> {
		const where: FindOptionsWhereProperty<CategoryEntity> = {
			deleted_at: IsNull(),
		};
		if (q) where.name = ILike(`%${q}%`);
		const [data, count] = await this.categoryRepository.findAndCount({
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
	async findAllCategories(): Promise<CategoryEntity[]> {
		return this.categoryRepository.find();
	}
	async deleteCategory(id: number): Promise<void> {
		await this.categoryRepository.update(id, { deleted_at: new Date() });
	}
}
