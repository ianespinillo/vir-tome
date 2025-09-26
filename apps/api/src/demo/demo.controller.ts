import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DemoSeeder } from '../database/seeds/demo-tenant.seeder';
import { DemoResetService } from './demo-reset.service';

@Controller('demo')
export class DemoController {
	constructor(
		private readonly demoResetService: DemoResetService,
		private readonly demoSeeder: DemoSeeder,
	) {}

	@Post('reset')
	async resetDemo() {
		return this.demoResetService.manualReset();
	}

	@Post('seed')
	async seedDemo() {
		try {
			await this.demoSeeder.seed();
			return {
				success: true,
				message: 'Demo data seeded successfully',
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					success: false,
					message: `Seeding failed: ${error.message}`,
				};
			}
			return {
				success: false,
				message: 'Seeding failed due to an unknown error',
			};
		}
	}

	@Get('status')
	async getDemoStatus() {
		// TODO: Implementar lógica para verificar estado del demo
		return {
			demo_active: true,
			last_reset: new Date(), // Implementar tracking real
			next_reset: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 horas
		};
	}
}
