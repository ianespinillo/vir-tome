import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from '@repo/common';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';
import { AuthBearer } from 'src/auth/decorators/auth-bearer.decorators';

@AuthBearer()
@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    async create(@Body() createDto: CreateCategoryDto): Promise<CategoryEntity> {
      return this.categoryService.createCategory(createDto);
    }
  
    @Get()
    async findAll(@Query('page', ParseIntPipe) page: number = 1) {
      return this.categoryService.findByPage(page);
    }
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<CategoryEntity | null> {
      return this.categoryService.findById(id);
    }
  
    @Patch(':id')
    async update(
      @Param('id') id: number,
      @Body() updateDto: UpdateCategoryDto,
    ): Promise<void> {
      await this.categoryService.updateCategory(id, updateDto);
    }
  
    @Delete(':id')
    async remove(@Param('id') id: number): Promise<void> {
      await this.categoryService.delete(id);
    }
}
