'use client';

import {
	Activity,
	BarChart3,
	BookCopy,
	BookOpen,
	BookText,
	Building2,
	Home,
	LayoutDashboard,
	Library,
	LogOut,
	Settings,
	ShieldCheck,
	User,
} from 'lucide-react';

import { useMemo } from 'react';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/ui/sidebar';

import { MenuLinkBase, PAYLOAD_TYPE, ROLES } from '@repo/common';
import { useAuth } from '@repo/hooks';
import { SwitchTenant } from '../select/switch-tenant';

// --- TIPO ---
export interface MenuLink extends MenuLinkBase {
	icon: React.ComponentType<any>;
}

// --- CONFIGURACIÓN UNIFICADA (Super Admin + Tenant) ---
const ALL_MENU_ITEMS: MenuLink[] = [
	// Zona Super Admin
	{
		title: 'Panel Global',
		href: '/super-admin/dashboard',
		tooltip: 'Visión general',
		icon: LayoutDashboard,
		roles: [ROLES.SUPER_ADMIN],
	},
	{
		title: 'Tenants',
		href: '/super-admin/tenants',
		tooltip: 'Gestión de Clientes',
		icon: Building2,
		roles: [ROLES.SUPER_ADMIN],
	},
	{
		title: 'Admin Users',
		href: '/super-admin/admins',
		tooltip: 'Gestión de Super Admins',
		icon: ShieldCheck,
		roles: [ROLES.SUPER_ADMIN],
	},
	{
		title: 'Actividad',
		href: '/super-admin/activity',
		tooltip: 'Logs del Sistema',
		icon: Activity,
		roles: [ROLES.SUPER_ADMIN],
	},
	// {
	//   title: "Configuración",
	//   href: "/super-admin/settings",
	//   tooltip: "Ajustes de Plataforma",
	//   icon: Settings,
	//   roles: [ROLES.SUPER_ADMIN],
	// },
	//TODO: Super admin config
	// Zona Tenant / Usuario Normal
	{
		title: 'Inicio',
		href: '/dashboard',
		tooltip: 'Inicio',
		icon: Home,
		roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STUDENT],
	},
	{
		title: 'Mis préstamos',
		href: '/dashboard/my-loans',
		tooltip: 'Mis préstamos',
		icon: BookCopy,
		roles: [ROLES.STUDENT, ROLES.TEACHER],
	},
	{
		title: 'Libros',
		href: '/dashboard/books',
		tooltip: 'Libros',
		icon: BookOpen,
		roles: [ROLES.ADMIN, ROLES.LIBRARIAN],
	},
	{
		title: 'Préstamos',
		href: '/dashboard/loans',
		tooltip: 'Préstamos',
		icon: BookCopy,
		roles: [ROLES.ADMIN, ROLES.LIBRARIAN],
	},
	{
		title: 'Solicitudes de prestamo',
		href: '/dashboard/requests',
		tooltip: 'Solicitudes',
		icon: BookText,
		roles: [ROLES.LIBRARIAN],
	},
	{
		title: 'Mis usuarios',
		href: '/dashboard/my-users',
		tooltip: 'Usuarios',
		icon: User,
		roles: [ROLES.ADMIN],
	},
];

const FOOTER_LINKS: MenuLink[] = [
	{
		title: 'Perfil',
		href: '/dashboard/profile',
		icon: User,
		tooltip: 'Perfil',
		roles: [], // Vacío = Visible para todos (lógica custom abajo)
	},
];

// --- COMPONENTE ---
export function DashSidebar() {
	const { signOut, session } = useAuth();
	const sessionData = session.data?.data;

	// Filtramos los items basándonos en el usuario actual
	const filteredLinks = useMemo(() => {
		if (!sessionData) return [];
		// Detectamos si es Super Admin por su TYPE o ROL
		const isSuperAdmin =
			sessionData.type === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN ||
			sessionData.roleName === ROLES.SUPER_ADMIN;

		// El rol efectivo para comparar
		const currentRole = isSuperAdmin ? ROLES.SUPER_ADMIN : sessionData.roleName;

		return ALL_MENU_ITEMS.filter((item) =>
			item.roles.includes(currentRole as ROLES),
		);
	}, [session.isSuccess]);

	return (
		<Sidebar className="bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
			{/* HEADER */}
			<SidebarHeader className="border-b border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<a
								href={
									sessionData?.type === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN
										? '/super-admin/dashboard'
										: '/dashboard'
								}
							>
								<div className="flex items-center">
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
										<Library className="size-5" />
									</div>
									<div className="flex flex-col gap-0.5 leading-none ml-2">
										<span className="font-semibold">Vir-tome</span>
										<span className="text-xs text-muted-foreground">
											{sessionData?.tenant?.name || 'Gestión Bibliotecaria'}
										</span>
									</div>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			{/* CONTENT (Menu Principal) */}
			<SidebarContent className="[&_*]:border-sidebar-border">
				<SidebarGroup>
					<SidebarGroupLabel className="text-sidebar-foreground/80">
						Menu
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{filteredLinks.map((link) => {
								const isActive = document.location.pathname === link.href;
								return (
									<SidebarMenuItem key={link.href}>
										<SidebarMenuButton
											asChild
											tooltip={link.tooltip}
											isActive={isActive}
											className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
										>
											<a href={link.href} className="text-sidebar-foreground">
												<link.icon className="mr-2 h-4 w-4" />
												<span>{link.title}</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* FOOTER */}
			<SidebarFooter className="border-t border-sidebar-border">
				<SidebarMenu>
					{
						// Mostrar SwitchTenant solo si el usuario tiene múltiples tenants y no es Super Admin
						sessionData && sessionData.roleName !== ROLES.SUPER_ADMIN && (
							<SidebarMenuItem>
								<div className="px-3 py-2">
									<SwitchTenant userId={sessionData.id} />
								</div>
							</SidebarMenuItem>
						)
					}
					{FOOTER_LINKS.map((link) => (
						<SidebarMenuItem key={link.title}>
							<SidebarMenuButton
								asChild
								className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							>
								<a href={link.href} className="text-sidebar-foreground">
									<link.icon className="mr-2 h-4 w-4" />
									<span>{link.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}

					{/* Botón de Logout separado para manejar el onClick */}
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => signOut.mutate()}
							className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>Cerrar Sesión</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail className="bg-sidebar-background border-r border-sidebar-border" />
		</Sidebar>
	);
}
