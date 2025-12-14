import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { IApiResponse } from '@repo/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();

		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			exception instanceof HttpException
				? exception.getResponse()
				: 'Internal server error';

		// Evitar escribir en la respuesta si los headers ya fueron enviados
		if (response.headersSent) {
			return;
		}
		console.log(exception);
		const apiResponse: IApiResponse<any> = {
			status,
			message:
				typeof message === 'object' ? (message as any).message || 'Error' : message,
			timestamp: new Date().toISOString(),
			data: {
				path: request.url,
			},
		};

		response.status(status).json(apiResponse);
	}
}
