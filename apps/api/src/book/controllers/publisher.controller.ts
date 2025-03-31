import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePublisherDto, UpdatePublisherDto } from '@repo/common';
import { PublisherEntity } from '../entities/publisher.entity';
import { PublisherService } from '../services/publisher.service';
import { AuthBearer } from 'src/auth/decorators/auth-bearer.decorators';

@AuthBearer()
@Controller('publisher')
export class PublisherController {
    constructor(private readonly publisherService: PublisherService) {}

  @Post()
  async create(@Body() createDto: CreatePublisherDto): Promise<PublisherEntity> {
    return this.publisherService.createPublisher(createDto);
  }

  @Get()
  async findAll(): Promise<PublisherEntity[]> {
    return this.publisherService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<PublisherEntity | null> {
    return this.publisherService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdatePublisherDto,
  ): Promise<void> {
    await this.publisherService.updatePublisher(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    await this.publisherService.delete(id);
  }
}
