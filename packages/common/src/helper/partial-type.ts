export function PartialType<T extends new (...args: any[]) => any>(
	BaseClass: T,
) {
	class PartialClass {}
	Object.getOwnPropertyNames(BaseClass.prototype).forEach((key) => {
		if (key !== 'constructor') {
			Object.defineProperty(
				PartialClass.prototype,
				key,
				Object.getOwnPropertyDescriptor(BaseClass.prototype, key) || {},
			);
		}
	});

	// copiamos metadatos de class-validator y agregamos IsOptional
	const validator = require('class-validator');
	const metadataStorage = validator.getMetadataStorage();

	const metadatas = metadataStorage.getTargetValidationMetadatas(
		BaseClass,
		null,
	);

	for (const meta of metadatas) {
		metadataStorage.addValidationMetadata({
			...meta,
			target: PartialClass,
			propertyName: meta.propertyName,
			constraints: meta.constraints,
			always: meta.always,
			each: meta.each,
			type: meta.type,
		});

		// agregamos IsOptional
		validator.IsOptional()(PartialClass.prototype, meta.propertyName);
	}

	return PartialClass as T;
}
