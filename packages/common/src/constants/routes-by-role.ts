import { ROLES } from '../enum/roles.enum';
import { MenuLinkBase } from '../types/ui/sidebar-menu.types';

export const ROUTES_BY_ROLE: MenuLinkBase[] = [
	// Zona Super Admin
	{
		title: 'Panel Global',
		href: '/super-admin/dashboard',
		tooltip: 'Visión general',
		roles: [ROLES.SUPER_ADMIN],
	},
	{
		title: 'Tenants',
		href: '/super-admin/tenants',
		tooltip: 'Gestión de Clientes',
		roles: [ROLES.SUPER_ADMIN],
	},
	{
		title: 'Admin Users',
		href: '/super-admin/admins',
		tooltip: 'Gestión de Super Admins',
		roles: [ROLES.SUPER_ADMIN],
	},
	{
		title: 'Actividad',
		href: '/super-admin/activity',
		tooltip: 'Logs del Sistema',
		roles: [ROLES.SUPER_ADMIN],
	},
	// {
	//   title: "Configuración",
	//   href: "/super-admin/settings",
	//   tooltip: "Ajustes de Plataforma",
	//
	//   roles: [ROLES.SUPER_ADMIN],
	// },
	//TODO: Super admin config
	// Zona Tenant / Usuario Normal
	{
		title: 'Inicio',
		href: '/dashboard',
		tooltip: 'Inicio',
		roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STUDENT],
	},
	{
		title: 'Libros',
		href: '/dashboard/books',
		tooltip: 'Libros',
		roles: [ROLES.ADMIN, ROLES.LIBRARIAN],
	},
	{
		title: 'Préstamos',
		href: '/dashboard/loans',
		tooltip: 'Préstamos',
		roles: [ROLES.ADMIN, ROLES.LIBRARIAN],
	},
	{
		title: 'Mis usuarios',
		href: '/dashboard/my-users',
		tooltip: 'Usuarios',
		roles: [ROLES.ADMIN],
	},
];
