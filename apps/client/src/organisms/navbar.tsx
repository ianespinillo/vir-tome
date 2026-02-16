import { Button, Logo, Menu, NavigationMenu, Play } from '@repo/ui';
import Link from 'next/link';

export function Navbar() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<Logo size="md" />

				<NavigationMenu />

				<div className="flex items-center gap-4">
					<Button variant="ghost" className="hidden md:inline-flex">
						<Link href="/auth/sign-in">Iniciar sesión</Link>
					</Button>
					<Button className="hidden md:inline-flex">
						<Link href="/demo-info" className="flex items-center gap-2">
							<Play className="h-4 w-4" />
							Prueba gratis
						</Link>
					</Button>
					<Button variant="ghost" size="icon" className="md:hidden">
						<Menu className="h-5 w-5" />
					</Button>
				</div>
			</div>
		</header>
	);
}
