import { StatCard } from '@repo/ui';

const stats = [
	{
		value: '500+',
		label: 'Escuelas',
		description: 'confían en Vir-tome',
	},
	{
		value: '98%',
		label: 'Eficiencia',
		description: 'en gestión de préstamos',
	},
	{
		value: '50,000+',
		label: 'Estudiantes',
		description: 'utilizan el sistema',
	},
	{
		value: '24/7',
		label: 'Soporte',
		description: 'técnico especializado',
	},
];

export function StatsSection() {
	return (
		<section className="py-20">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl lg:text-5xl font-bold text-balance mb-6">
						Resultados que <span className="text-primary">transforman</span>{' '}
						instituciones
					</h2>
					<p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
						Miles de escuelas ya han optimizado su gestión bibliotecaria con Vir-tome.
					</p>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
					{/*TODO: Map through stats array to create StatCard components*/}
				</div>
			</div>
		</section>
	);
}
