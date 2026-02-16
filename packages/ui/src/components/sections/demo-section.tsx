'use client';

import { PAYLOAD_TYPE } from '@repo/common';
import { useAuth } from '@repo/hooks';
import {
	ArrowLeft,
	BookOpen,
	Clock,
	GraduationCap,
	Library,
	Shield,
} from 'lucide-react';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useUINav } from '../../contexts/navigation-context';
import { Button } from '../../ui/button';
import { DemoRoleCard } from '../cards/demo-role-card';

const DEMO_ROLES = [
	{
		role: 'Administrador',
		title: 'Director/a',
		icon: Shield,
		email: 'admin@demo.com',
		description:
			'Control total del sistema. Gestiona usuarios, configuraciones y reportes generales de la biblioteca.',
		features: [
			'Panel de administración completo',
			'Gestión de usuarios y roles',
			'Reportes y estadísticas',
			'Configuración del sistema',
		],
	},
	{
		role: 'Bibliotecario',
		title: 'Bibliotecario/a',
		icon: Library,
		email: 'bibliotecario@demo.com',
		description:
			'Gestión diaria de la biblioteca. Administra préstamos, devoluciones y el catálogo de libros.',
		features: [
			'Gestión de préstamos y devoluciones',
			'Administración del catálogo',
			'Control de inventario',
			'Registro de nuevos libros',
		],
	},
	{
		role: 'Profesor',
		title: 'Profesor/a',
		icon: GraduationCap,
		email: 'profesora@demo.com',
		description:
			'Acceso para docentes. Solicita préstamos de material didáctico y consulta disponibilidad.',
		features: [
			'Solicitar préstamos de libros',
			'Ver historial de préstamos',
			'Consultar catálogo completo',
			'Reservar materiales',
		],
	},
	{
		role: 'Estudiante',
		title: 'Estudiante',
		icon: BookOpen,
		email: 'estudiante1@demo.com',
		description:
			'Experiencia de alumno. Explora el catálogo, consulta tus préstamos activos y el historial.',
		features: [
			'Explorar catálogo de libros',
			'Ver préstamos activos',
			'Consultar historial',
			'Buscar por categorías',
		],
	},
];

export function DemoSection() {
	const { generalLogin, signIn } = useAuth();
	const { navigate } = useUINav();
	const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

	const handleStartDemo = async (email: string, password: string) => {
		setLoadingEmail(email);

		try {
			const result = await generalLogin.mutateAsync({
				email,
				password,
				type: PAYLOAD_TYPE.USER_LOGIN,
			});

			if (result?.data) {
				if (
					result.data.requiresTenantSelection === false &&
					'tenant' in result.data
				) {
					const tenant = result.data.tenant;

					await signIn.mutateAsync({
						email,
						password,
						type: PAYLOAD_TYPE.USER_LOGIN,
						tenantId: tenant.id,
					});

					toast.success('Iniciando demo...');

					setTimeout(() => {
						navigate(`/app/${tenant.subdomain}/dashboard`, { isExternal: false });
					}, 1000);
				} else if (
					result.data.requiresTenantSelection &&
					'tenants' in result.data
				) {
					const demoTenant = result.data.tenants?.find(
						(t) => t.subdomain === 'demo',
					);
					if (demoTenant) {
						await signIn.mutateAsync({
							email,
							password,
							type: PAYLOAD_TYPE.USER_LOGIN,
							tenantId: demoTenant.id,
						});

						toast.success('Iniciando demo...');

						setTimeout(() => {
							navigate(`/app/${demoTenant.subdomain}/dashboard`, {
								isExternal: false,
							});
						}, 1000);
					}
				}
			}
		} catch {
			toast.error('Error al iniciar la demo. Intenta nuevamente.');
		} finally {
			setLoadingEmail(null);
		}
	};

	const handleBack = () => {
		navigate('/', { isExternal: false });
	};

	return (
		<div className="min-h-screen bg-background">
			<Toaster position="top-right" richColors />

			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto px-4 h-16 flex items-center">
					<Button variant="ghost" size="sm" className="gap-2" onClick={handleBack}>
						<ArrowLeft className="w-4 h-4" />
						Volver al inicio
					</Button>
				</div>
			</header>

			<main className="container mx-auto px-4 py-12 lg:py-20">
				{/* Hero Section */}
				<section className="text-center mb-16">
					<div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
						<Clock className="w-4 h-4" />
						Demo de 4 horas disponible
					</div>

					<h1 className="text-4xl lg:text-5xl font-bold text-foreground text-balance mb-6">
						Explora Vir-tome desde{' '}
						<span className="text-primary">cada perspectiva</span>
					</h1>

					<p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed mb-8">
						Descubre cómo funciona nuestro sistema de gestión bibliotecaria
						experimentando la plataforma desde el rol que prefieras. Cada cuenta demo
						está preconfigurada con datos de ejemplo.
					</p>

					<div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-green-500" />
							Datos de ejemplo incluidos
						</div>
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-green-500" />
							Sin registro necesario
						</div>
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-green-500" />
							Acceso inmediato
						</div>
					</div>
				</section>

				{/* Roles Grid */}
				<section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
					{DEMO_ROLES.map((role) => (
						<DemoRoleCard
							key={role.email}
							icon={role.icon}
							role={role.role}
							title={role.title}
							description={role.description}
							features={role.features}
							email={role.email}
							onStartDemo={handleStartDemo}
							isLoading={loadingEmail === role.email}
						/>
					))}
				</section>

				{/* Info Section */}
				<section className="max-w-3xl mx-auto text-center">
					<div className="bg-muted/50 rounded-2xl p-8 border border-border/50">
						<h2 className="text-xl font-semibold text-foreground mb-4">
							Acerca de la demo
						</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Las cuentas de demostración se reinician automáticamente cada 4 horas
							para garantizar una experiencia limpia. Todos los cambios que realices
							durante la sesión serán temporales.
						</p>
						<p className="text-sm text-muted-foreground">
							Credenciales: Cada rol utiliza la contraseña{' '}
							<code className="bg-muted px-2 py-1 rounded text-foreground">
								demo1234
							</code>
						</p>
					</div>
				</section>
			</main>
		</div>
	);
}
