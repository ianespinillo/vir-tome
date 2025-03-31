import { GenericEntity } from "src/core/generic.entity";
import { Column, Entity } from "typeorm";


@Entity({
    name: 'role'
})
export class RoleEntity extends GenericEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;
}