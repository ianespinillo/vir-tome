import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from '@repo/common';
import { GenericService } from '../../core/generic.service';
import { Repository, In } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryService extends GenericService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>,
      ) {
        super(categoryRepository);
      }
    
      async createCategory(createDto: CreateCategoryDto): Promise<CategoryEntity> {
        return this.create(createDto);
      }
    
      async updateCategory(
        id: number,
        updateDto: UpdateCategoryDto,
      ): Promise<void> {
        await this.update(id, updateDto);
      }
    
      async findAllOfBook(id: number[]): Promise<CategoryEntity[]> {
        return this.categoryRepository.findBy({
            id: In(id),
          });
      }
}
