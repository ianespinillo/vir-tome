import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/ui/dialog';
import { TenantSelection } from '@repo/common';
import { Building2, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TenantSelectionModalProps {
	tenants: TenantSelection[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectTenant: (tenant: TenantSelection) => void;
}

export function TenantSelectionDialog({
	tenants,
	open,
	onOpenChange,
	onSelectTenant,
}: Readonly<TenantSelectionModalProps>) {
	const [selectedTenant, setSelectedTenant] = useState<TenantSelection | null>(
		null,
	);

	const handleSelectAndLogin = () => {
		if (selectedTenant) {
			onSelectTenant(selectedTenant);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="text-balance">
						Selecciona tu organización
					</DialogTitle>
					<DialogDescription className="text-pretty">
						Elige a qué organización deseas acceder para continuar
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 space-y-2">
					{tenants.map((tenant) => (
						<button
							type="button"
							key={tenant.id}
							onClick={() => setSelectedTenant(tenant)}
							className={cn(
								'w-full rounded-lg border-2 p-4 text-left transition-all hover:border-primary',
								selectedTenant?.id === tenant.id
									? 'border-primary bg-primary/5'
									: 'border-border bg-card',
							)}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-3">
									<div
										className={cn(
											'rounded-md p-2 transition-colors',
											selectedTenant?.id === tenant.id
												? 'bg-primary text-primary-foreground'
												: 'bg-muted text-muted-foreground',
										)}
									>
										<Building2 className="h-5 w-5" />
									</div>
									<div className="flex-1 space-y-1">
										<h3 className="font-semibold leading-none text-balance">
											{tenant.name}
										</h3>
										<p className="text-sm text-muted-foreground">{tenant.subdomain}</p>
										<span
											className={cn(
												'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
												tenant.role === 'ADMIN'
													? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
													: 'bg-secondary text-secondary-foreground',
											)}
										>
											{tenant.role}
										</span>
									</div>
								</div>
								<ChevronRight
									className={cn(
										'h-5 w-5 transition-all',
										selectedTenant?.id === tenant.id
											? 'text-primary'
											: 'text-muted-foreground',
									)}
								/>
							</div>
						</button>
					))}
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button onClick={handleSelectAndLogin} disabled={!selectedTenant}>
						Continuar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
