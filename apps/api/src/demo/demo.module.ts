import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { DemoResetService } from './demo-reset.service';
import { DemoController } from './demo.controller';

@Module({
	imports: [ScheduleModule.forRoot(), DatabaseModule],
	controllers: [DemoController],
	providers: [DemoResetService],
	exports: [DemoResetService],
})
export class DemoModule {}
