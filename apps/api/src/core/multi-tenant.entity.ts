import { IGeneric } from '@repo/common';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { GenericEntity } from './generic.entity';

@Entity({ name: 'multitenant' })
export abstract class MultiTenantEntity
	extends GenericEntity
	implements IGeneric
{
	@Column()
	@Index()
	tenant_id!: number;

	@ManyToOne('TenantEntity')
	@JoinColumn({ name: 'tenant_id' })
	tenant!: any;
}
