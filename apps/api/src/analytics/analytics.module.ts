import { BookModule } from '@/book/book.module';
import { LoanModule } from '@/loan/loan.module';
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
	controllers: [AnalyticsController],
	imports: [BookModule, LoanModule],
	providers: [AnalyticsService],
})
export class AnalyticsModule {}
