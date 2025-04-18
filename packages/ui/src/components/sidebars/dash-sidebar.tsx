'use client';
import {
	BookCopy,
	BookOpen,
	Home,
	Library,
	LogOut,
	Settings,
} from 'lucide-react';

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

import type { LucideIcon } from 'lucide-react';

interface MenuLink {
	title: string;
	href: string;
	icon: LucideIcon;
	tooltip?: string;
}

interface MenuSection {
	title: string;
	links: MenuLink[];
}

const menuSections: MenuSection[] = [
	{
		title: 'Principal',
		links: [
			{
				title: 'Inicio',
				href: '/dashboard',
				icon: Home,
				tooltip: 'Inicio',
			},
			{
				title: 'Libros',
				href: '/dashboard/books',
				icon: BookOpen,
				tooltip: 'Libros',
			},
			{
				title: 'Prestamos',
				href: '/dashboard/loans',
				icon: BookCopy,
				tooltip: 'Prestamos',
			},
		],
	},
];

const footerLinks: MenuLink[] = [
	{
		title: 'Perfil',
		href: '#',
		icon: Settings,
		tooltip: 'Perfil',
	},
	{
		title: 'Cerrar Sesión',
		href: '#',
		icon: LogOut,
		tooltip: 'Salir',
	},
];

export function DashSidebar() {
	return (
		<Sidebar className="bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
			<SidebarHeader className="border-b border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<div className="flex items-center">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Library className="size-5" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none ml-2">
									<span className="font-semibold">Vit-tome</span>
									<span className="text-xs text-muted-foreground">
										Gestión Bibliotecaria
									</span>
								</div>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="[&_*]:border-sidebar-border">
				{menuSections.map((section) => (
					<SidebarGroup key={section.title}>
						<SidebarGroupLabel className="text-sidebar-foreground/80">
							{section.title}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{section.links.map((link) => (
									<SidebarMenuItem key={link.href}>
										<SidebarMenuButton
											asChild
											tooltip={link.tooltip}
											className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
										>
											<a href={link.href} className="text-sidebar-foreground">
												<link.icon className="mr-2" />
												<span>{link.title}</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border">
				<SidebarMenu>
					{footerLinks.map((link) => (
						<SidebarMenuItem key={link.title}>
							<SidebarMenuButton
								asChild
								className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							>
								<a href={link.href} className="text-sidebar-foreground">
									<link.icon className="mr-2" />
									<span>{link.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail className="bg-sidebar-background border-r border-sidebar-border" />
		</Sidebar>
	);
}
