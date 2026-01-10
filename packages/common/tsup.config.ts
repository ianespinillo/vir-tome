import { defineConfig } from 'tsup';

export default defineConfig({
	treeshake: true,
	target: 'es2020',
	esbuildOptions(options) {
		options.keepNames = true;
	},
	bundle: false,
	format: ['cjs', 'esm'],
	entry: ['src/**/*.ts'],
	splitting: true,
	sourcemap: true,
	clean: true,
	dts: true,
	esbuildPlugins: [],
	noExternal: ['class-validator', 'class-transformer'],
});
