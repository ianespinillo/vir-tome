import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
	it('should not write response when headers already sent', () => {
		const res = {
			headersSent: true,
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as any;

		const req = { url: '/health' };

		const host = {
			switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
		} as unknown as ArgumentsHost;

		const filter = new AllExceptionsFilter();

		expect(() => filter.catch(new Error('boom'), host)).not.toThrow();
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});

	it('should write response when headers not sent', () => {
		const res = {
			headersSent: false,
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as any;

		const req = { url: '/test' };

		const host = {
			switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
		} as unknown as ArgumentsHost;

		const filter = new AllExceptionsFilter();

		const exc = new HttpException({ message: 'bad' }, HttpStatus.BAD_REQUEST);
		filter.catch(exc, host);

		expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
		expect(res.json).toHaveBeenCalled();
	});
});
