import { IGeneric } from '@repo/common';
import {
	CreateDateColumn,
	DeleteDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export class GenericEntity implements IGeneric {
	@PrimaryGeneratedColumn()
	id!: number;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at: Date;

	@DeleteDateColumn({
		nullable: true,
		default: null,
	})
	deleted_at?: Date;
}
