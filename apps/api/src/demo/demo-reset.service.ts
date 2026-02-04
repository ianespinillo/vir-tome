// src/demo/demo-reset.service.ts - Servicio para reset automático
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DemoSeeder } from '../database/seeds/demo-tenant.seeder';

@Injectable()
export class DemoResetService {
	private readonly logger = new Logger(DemoResetService.name);

	constructor(private readonly demoSeeder: DemoSeeder) {}

	// Reset demo data every day at 2 AM
	@Cron(CronExpression.EVERY_DAY_AT_2AM)
	async scheduledReset() {
		// Permitir deshabilitar por environment
		if (process.env.ENABLE_DEMO_RESET === 'false') {
			this.logger.log('Demo reset disabled by environment');
			return;
		}

		this.logger.log('Starting scheduled demo reset...');
		try {
			await this.demoSeeder.reset();
			this.logger.log('Scheduled demo reset completed successfully');
		} catch (error) {
			this.logger.error('Scheduled demo reset failed:', error);
		}
	}

	// Manual reset endpoint
	async manualReset(): Promise<{ success: boolean; message: string }> {
		try {
			this.logger.log('Starting manual demo reset...');
			await this.demoSeeder.reset();
			this.logger.log('Manual demo reset completed');

			return {
				success: true,
				message: 'Demo data reset successfully',
			};
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error('Manual demo reset failed:', error);
				return {
					success: false,
					message: `Reset failed: ${error.message}`,
				};
			}
			this.logger.error('Manual demo reset failed with unknown error');
			return {
				success: false,
				message: 'Reset failed due to an unknown error',
			};
		}
	}
}
