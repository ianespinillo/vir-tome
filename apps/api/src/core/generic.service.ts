import { ILike, Repository } from 'typeorm';

export abstract class GenericService {
	constructor(protected repository: Repository<any>) {}

	async findAll() {
		return this.repository.find();
	}
	async findById(id: number) {
		return this.repository.findOne({
			where: { id, deleted_at: null },
		});
	}
	async create(entity: any) {
		return this.repository.save(entity);
	}
	async update(id: number, entity: any) {
		return this.repository.update(id, entity);
	}
	async delete(id: number) {
		return this.repository.update(id, { deleted_at: new Date() });
	}
	async findByPage(page: number) {
		const [data, total] = await this.repository.findAndCount({
			where: { deleted_at: null },
			order: { id: 'ASC' },
			take: 10,
			skip: (page - 1) * 10,
		});
		return {
			data,
			total,
			current_page: page,
			last_page: Math.ceil(total / 10),
		};
	}
	async findByName(name: string) {
		return this.repository.find({
			where: { name: ILike(`%${name}%`), deleted_at: null },
		});
	}
}
