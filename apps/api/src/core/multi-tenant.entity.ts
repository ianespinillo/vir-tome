import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { GenericEntity } from './generic.entity';

@Entity({ name: 'multitenant' })
export abstract class MultiTenantEntity extends GenericEntity {
	@Column()
	@Index()
	tenant_id!: number;

	@ManyToOne(() => TenantEntity)
	@JoinColumn({ name: 'tenant_id' })
	tenant!: TenantEntity;
}
