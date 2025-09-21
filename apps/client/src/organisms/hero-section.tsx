import { CTAButtons } from '@repo/ui';

export function HeroSection() {
	return (
		<section id="inicio" className="py-20 lg:py-32">
			<div className="container mx-auto px-4 text-center">
				<div className="max-w-4xl mx-auto">
					<div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
						<span className="w-2 h-2 bg-primary rounded-full">{/* a */}</span>
						Nuevo: Sistema completo de gestión
					</div>

					<h1 className="text-5xl lg:text-7xl font-bold text-balance mb-6">
						Gestión bibliotecaria <span className="text-primary">inteligente</span>{' '}
						para escuelas secundarias
					</h1>

					<p className="text-xl text-muted-foreground text-balance mb-12 max-w-2xl mx-auto leading-relaxed">
						Vir-tome revoluciona la administración de préstamos de libros en tu
						institución educativa. Desarrollado por VIRTEC para optimizar la gestión
						bibliotecaria.
					</p>

					<CTAButtons />
				</div>
			</div>
		</section>
	);
}
