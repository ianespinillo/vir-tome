'use client';
import { PasswordChangeForm, PersonalInfoForm, ScrollArea } from '@repo/ui';

export default function ProfilePage() {
	return (
		<ScrollArea className="h-screen overflow-y-auto scroll-smooth">
			<div className="container py-10">
				<div className="flex flex-col gap-6">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Configuración de Perfil
						</h1>
						<p className="text-muted-foreground mt-2">
							Administra tu información personal y credenciales de acceso.
						</p>
					</div>

					<PersonalInfoForm />
					<PasswordChangeForm />
				</div>
			</div>
		</ScrollArea>
	);
}
