const navigationItems = [
	{ href: '#inicio', label: 'Inicio' },
	{ href: '#caracteristicas', label: 'Características' },
	{ href: '#beneficios', label: 'Beneficios' },
	{ href: '#contacto', label: 'Contacto' },
];

export function NavigationMenu() {
	return (
		<nav className="hidden md:flex items-center gap-8">
			{navigationItems.map((item) => (
				<a
					key={item.href}
					href={item.href}
					className="text-foreground hover:text-primary transition-colors font-medium"
				>
					{item.label}
				</a>
			))}
		</nav>
	);
}
