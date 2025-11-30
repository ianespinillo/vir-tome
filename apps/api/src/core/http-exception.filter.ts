// src/common/filters/http-exception.filter.ts
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
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

		// If headers are already sent, don't try to write again — this avoids
		// "Cannot set headers after they are sent to the client" when the
		// controller already sent a response and an error occurs afterwards.
		if (response.headersSent) {
			// let the Node/Express runtime handle any already-started response
			return;
		}

		response.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			...(typeof message === 'object' ? message : { message }),
		});
	}
}
