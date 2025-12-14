import { TokenTypes } from '../../enum/tokens-type.enum';
import { IUser } from './user.type';

export interface IToken {
	id: string;
	user_id: string;
	user: IUser;
	type: TokenTypes;
	token_hash: string;
	metadata?: Record<string, any>;
	expires_at: Date;
	getTenantId(): Promise<number>;
}
