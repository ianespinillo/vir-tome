import { defineConfig } from 'tsup';

export default defineConfig({
	treeshake: true,
	target: 'node18',
	bundle: false,
	format: ['cjs', 'esm'],
	entry: ['src/**/*.ts'],
	splitting: true,
	sourcemap: true,
	clean: true,
	dts: true,
});
