export function castToDto<T extends object, E extends object>(
	DtoClass: new () => T,
	entity: E,
): T {
	const dto = new DtoClass();

	for (const key in dto) {
		if (Object.prototype.hasOwnProperty.call(entity, key)) {
			dto[key as Extract<keyof T, string>] = entity[
				key as unknown as keyof E
			] as unknown as T[Extract<keyof T, string>];
		}
	}

	return dto;
}
