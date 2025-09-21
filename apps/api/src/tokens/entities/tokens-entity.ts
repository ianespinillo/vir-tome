import { User } from '@/auth/decorators/user.decorator';
import { UserEntity } from '@/users/entities/user.entity';
import { TokenTypes } from '@repo/common';
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('tokens')
export class TokenEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	@Index()
	user_id: number;

	@ManyToOne(
		() => UserEntity,
		(user) => user.tokens,
		{ onDelete: 'CASCADE' },
	)
	@JoinColumn({ name: 'user_id' })
	user: UserEntity;

	@Column({ type: 'enum', enum: TokenTypes })
	type: TokenTypes;

	@Column()
	@Index({ unique: true })
	token_hash: string;

	@Column({ type: 'jsonb', nullable: true })
	metadata?: Record<string, any>;

	@Column({ type: 'timestamp with time zone' })
	expires_at: Date;

	@Column({ type: 'timestamp with time zone', nullable: true })
	used_at: Date | null;

	@CreateDateColumn({ type: 'timestamp with time zone' })
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp with time zone' })
	updated_at: Date;
}
