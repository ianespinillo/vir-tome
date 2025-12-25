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
	transform(value: any) {
		// ⛔ ignorar valores "vacíos lógicos"
		if (
			value === undefined ||
			value === null ||
			value === '' ||
			value === 'undefined' ||
			value === 'null'
		) {
			return undefined;
		}

		const valid = Object.keys(ROLES).includes(value);

		if (!valid) {
			throw new HttpException(
				{
					status: HttpStatus.NOT_ACCEPTABLE,
					error: 'Invalid role',
				},
				HttpStatus.NOT_ACCEPTABLE,
			);
		}

		return value as ROLES;
	}
}
