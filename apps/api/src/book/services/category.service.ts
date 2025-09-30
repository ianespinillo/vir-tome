import { MultiTenantService } from '@/core/multi-tenat.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from '@repo/common';
import { In, Repository } from 'typeorm';
import { GenericService } from '../../core/generic.service';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryService extends MultiTenantService<CategoryEntity> {
	constructor(
		@InjectRepository(CategoryEntity)
		private readonly categoryRepository: Repository<CategoryEntity>,
	) {
		super(categoryRepository);
	}

	async findAllOfBook(tenat: number, id: number[]): Promise<CategoryEntity[]> {
		return this.findBy(tenat, { id: In(id) });
	}
}
