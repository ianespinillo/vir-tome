import {
	ArgumentMetadata,
	HttpException,
	HttpStatus,
	Injectable,
	PipeTransform,
} from '@nestjs/common';
import { ROLES } from '@repo/common';

@Injectable()
export class ValidRolePipe implements PipeTransform {
	transform(value: string, metadata: ArgumentMetadata) {
		const valid: boolean = Object.values(ROLES).some(
			(role) => role === (value as ROLES),
		);
		if (!valid)
			throw new HttpException(
				{
					status: HttpStatus.NOT_ACCEPTABLE,
					error: 'Invalid role',
				},
				HttpStatus.NOT_ACCEPTABLE,
				{
					cause: 'Invalid role provided',
				},
			);
		return value;
	}
}
