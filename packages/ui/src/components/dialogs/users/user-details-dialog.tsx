'use client';

import type React from 'react';

import { useModalCrud } from '@/contexts/modal-crud-context';
import { Badge } from '@/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Separator } from '@/ui/separator';
import { IUser, ROLES, UsersQueriesDto } from '@repo/common';
import { useAuth, type useUsers } from '@repo/hooks';
import { Building2, Calendar, Mail, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
const planColors: Record<string, string> = {
	enterprise: 'bg-violet-500/10 text-violet-600 border-violet-200',
	permiun: 'bg-blue-500/10 text-blue-600 border-blue-200',
	basic: 'bg-gray-500/10 text-gray-600 border-gray-200',
};
const toDate = (value: string | Date | null | undefined): Date | null => {
	if (!value) return null;
	if (value instanceof Date) return value;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
};

export const UserDetailsDialog = () => {
	const { entity, detailsOpen, closeViewDetails } = useModalCrud<
		IUser,
		UsersQueriesDto,
		ReturnType<typeof useUsers>
	>();
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const { session } = useAuth();
	useEffect(() => {
		if (session.data && entity) {
			setIsSuperAdmin(session.data.data?.roleName === ROLES.SUPER_ADMIN);
		}
	}, [session, setIsSuperAdmin, entity]);
	const visibleTenants = isSuperAdmin
		? entity?.userTenants
		: entity?.userTenants?.filter(
				(ut) => ut.tenant_id !== session.data?.data?.tenantId,
			);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Nunca';
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Dialog open={detailsOpen} onOpenChange={closeViewDetails}>
			<DialogContent className="max-w-md p-0 gap-0">
				<DialogHeader className="p-6 pb-0">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
							<User className="h-6 w-6" />
						</div>
						<div className="flex-1 space-y-1">
							<DialogTitle className="text-lg font-semibold leading-none">
								{entity?.name} {entity?.surname}
							</DialogTitle>
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<Mail className="h-3.5 w-3.5" />
								{entity?.email}
							</div>
						</div>
						{entity?.deleted_at && (
							<Badge variant="destructive" className="text-xs">
								Eliminado
							</Badge>
						)}
					</div>
				</DialogHeader>

				<div className="p-6 space-y-4">
					{/* Metadata */}
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Creado</p>
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<span>
									{formatDate(toDate(entity?.created_at)?.toString() || null)}
								</span>
							</div>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Último Acceso
							</p>
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<span>
									{formatDate(toDate(entity?.last_login_at)?.toString() || null)}
								</span>
							</div>
						</div>
					</div>

					<Separator />

					{/* Tenants Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h5 className="text-sm font-medium flex items-center gap-1.5">
								<Building2 className="h-4 w-4" />
								{isSuperAdmin ? 'Todos los Tenants' : 'Otros Tenants'}
							</h5>
							<Badge variant="secondary" className="text-xs">
								{visibleTenants?.length}{' '}
								{visibleTenants?.length === 1 ? 'tenant' : 'tenants'}
							</Badge>
						</div>

						{visibleTenants?.length === 0 ? (
							<div className="rounded-lg border border-dashed p-4 text-center">
								<p className="text-sm text-muted-foreground">
									No hay registros de otros tenants
								</p>
							</div>
						) : (
							<div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
								{visibleTenants?.map((userTenant) => (
									<div
										key={userTenant.id}
										className="rounded-lg border bg-card p-3 space-y-2 transition-colors hover:bg-accent/50"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="space-y-0.5">
												<p className="font-medium text-sm leading-none">
													{userTenant.tenant.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{userTenant.tenant.subdomain}
												</p>
											</div>
											<div className="flex items-center gap-1.5">
												{userTenant.tenant.is_demo && (
													<Badge variant="outline" className="text-[10px] px-1.5 py-0">
														Demo
													</Badge>
												)}
												<Badge
													variant="outline"
													className={`text-[10px] px-1.5 py-0 capitalize ${planColors[userTenant?.tenant?.plan || ''] || ''}`}
												>
													{userTenant.tenant.plan}
												</Badge>
											</div>
										</div>

										<div className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-1.5">
												<Shield className="h-3 w-3 text-muted-foreground" />
												<span className="text-muted-foreground">Rol:</span>
												<Badge
													variant="secondary"
													className="text-[10px] px-1.5 py-0 font-medium"
												>
													{userTenant?.role.name}
												</Badge>
											</div>
											<Badge
												variant={userTenant.is_active ? 'default' : 'secondary'}
												className={`text-[10px] px-1.5 py-0 ${
													userTenant.is_active
														? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
														: 'bg-gray-500/10 text-gray-500'
												}`}
											>
												{userTenant.is_active ? 'Activo' : 'Inactivo'}
											</Badge>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
