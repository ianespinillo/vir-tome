// src/demo/demo.controller.ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ROLES } from '@repo/common';
import { AuthBearer } from '../auth/decorators/auth-bearer.decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/role.guard';
import { DemoResetService } from './demo-reset.service';

@ApiTags('Demo')
@Controller('demo')
export class DemoController {
	constructor(private readonly demoResetService: DemoResetService) {}

	@Post('reset')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Reset demo tenant data',
		description:
			'Manually trigger demo data reset. Only available for demo tenant admins.',
	})
	@ApiResponse({
		status: 200,
		description: 'Demo reset completed successfully',
		schema: {
			example: {
				success: true,
				message: 'Demo data reset successfully',
			},
		},
	})
	async resetDemo() {
		return this.demoResetService.manualReset();
	}

	@Post('status')
	@ApiOperation({
		summary: 'Get demo tenant status',
		description: 'Check if current tenant is demo and last reset time',
	})
	async getDemoStatus() {
		// TODO: Implementar si es necesario
		return {
			is_demo: true,
			last_reset: '2024-01-15T02:00:00Z',
			next_reset: '2024-01-16T02:00:00Z',
		};
	}
}
