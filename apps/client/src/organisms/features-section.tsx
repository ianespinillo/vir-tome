import {
	BarChart3,
	BookOpen,
	Clock,
	FeatureCard,
	Shield,
	Smartphone,
	Users,
} from '@repo/ui';

const features = [
	{
		icon: BookOpen,
		title: 'Gestión de inventario',
		description:
			'Control completo del catálogo de libros con búsqueda avanzada y categorización automática.',
	},
	{
		icon: Users,
		title: 'Administración de usuarios',
		description:
			'Gestiona estudiantes, profesores y personal con perfiles personalizados y permisos específicos.',
	},
	{
		icon: BarChart3,
		title: 'Reportes inteligentes',
		description:
			'Analíticas detalladas sobre préstamos, devoluciones y uso de la biblioteca.',
	},
	{
		icon: Shield,
		title: 'Seguridad avanzada',
		description:
			'Protección de datos con encriptación y respaldos automáticos en la nube.',
	},
	{
		icon: Clock,
		title: 'Automatización',
		description:
			'Recordatorios automáticos, renovaciones y gestión de multas sin intervención manual.',
	},
	{
		icon: Smartphone,
		title: 'Acceso móvil',
		description:
			'Interfaz responsive que funciona perfectamente en cualquier dispositivo.',
	},
];

export function FeaturesSection() {
	return (
		<section id="caracteristicas" className="py-20 bg-muted/30">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl lg:text-5xl font-bold text-balance mb-6">
						Todo lo que necesitas para{' '}
						<span className="text-primary">modernizar</span> tu biblioteca
					</h2>
					<p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
						Herramientas completas diseñadas específicamente para las necesidades de
						las bibliotecas escolares modernas.
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature) => (
						<FeatureCard
							key={feature.title}
							icon={feature.icon}
							title={feature.title}
							description={feature.description}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
