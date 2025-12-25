'use client';

import type React from 'react';

import { toTitleCase } from '@/helpers/to-title-case';
import { Button } from '@/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/ui/dialog';
import { Label } from '@/ui/label';
import { ScrollArea } from '@/ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';
import { ROLES } from '@repo/common';
import { useUsers } from '@repo/hooks';
import { Plus, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface LinkTenantDialogProps {
	tenantId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	availableRoles?: ROLES[];
}

export function LinkTenantDialog({
	tenantId,
	open,
	onOpenChange: setOpen,
	availableRoles,
}: Readonly<LinkTenantDialogProps>) {
	const [loading, setLoading] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const observerTarget = useRef<HTMLDivElement>(null);
	const [selectedRole, setSelectedRole] = useState<ROLES>(ROLES.ADMIN);

	const { attachUserToTenant, getUsersByRole } = useUsers({
		page,
		searchTerm: '',
	});
	const { data: usersData, isLoading, isFetching } = getUsersByRole();

	// Infinite scroll observer
	const handleObserver = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			const [target] = entries;
			if (
				target?.isIntersecting &&
				!isFetching &&
				(usersData?.data?.meta?.last_page ?? 0) > page
			) {
				setPage((prev) => prev + 1);
			}
		},
		[isFetching, usersData?.data?.meta.last_page],
	);
	// Setup intersection observer
	useEffect(() => {
		const element = observerTarget.current;
		if (!element) return;

		const observer = new IntersectionObserver(handleObserver, {
			threshold: 0.1,
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, [handleObserver]);

	// Reset page when dialog opens
	useEffect(() => {
		if (open) {
			setPage(1);
		}
	}, [open]);

	const handleLinkUser = async (userId: number) => {
		setLoading(userId);
		try {
			toast.promise(
				attachUserToTenant.mutateAsync({
					userId,
					dto: { tenantId, role: selectedRole },
				}),
				{
					success: 'Usuario vinculado al tenant exitosamente',
					error: 'Error vinculando el usuario al tenant',
				},
			);
			setOpen(false);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(null);
		}
	};

	// Accumulate all users from paginated results
	const allUsers = usersData?.data?.items || [];

	return (
		<Dialog open={open} onOpenChange={setOpen} modal>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Vincular Usuario a Tenant</DialogTitle>
					<DialogDescription>
						Seleccione un rol y un usuario para vincularlo al tenant.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2 pb-4">
					<Label htmlFor="role-select">Rol</Label>
					<Select
						value={selectedRole}
						onValueChange={(value) => setSelectedRole(value as ROLES)}
					>
						<SelectTrigger id="role-select">
							<SelectValue placeholder="Seleccione un rol" />
						</SelectTrigger>
						<SelectContent>
							{availableRoles?.map((role) => {
								if (!role) return null;
								return (
									<SelectItem key={role} value={role}>
										{toTitleCase(role)}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>

				<ScrollArea className="max-h-[400px] pr-4">
					<div className="space-y-2">
						{isLoading && page === 1 && (
							<div className="flex items-center justify-center py-8">
								<span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							</div>
						)}
						{allUsers.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<User className="h-12 w-12 text-muted-foreground mb-2" />
								<p className="text-sm text-muted-foreground">
									No hay usuarios disponibles
								</p>
							</div>
						) : (
							<>
								{allUsers.map((user) => {
									const isAlreadyLinked = user.userTenants?.some(
										(ut) => ut.tenant_id === tenantId,
									);

									return (
										<div
											key={user.id}
											className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
										>
											<div className="flex-1 min-w-0">
												<h4 className="font-medium text-sm truncate">
													{user.name || user.email}
												</h4>
												<p className="text-xs text-muted-foreground truncate">
													{user.email}
												</p>
												{user.userTenants && user.userTenants?.length > 0 && (
													<p className="text-xs text-muted-foreground mt-1">
														{user.userTenants?.length} tenant(s) vinculado(s)
													</p>
												)}
											</div>
											<Button
												size="sm"
												onClick={() => handleLinkUser(user.id)}
												disabled={loading === user.id || isAlreadyLinked}
											>
												{loading === user.id && (
													<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												)}
												{isAlreadyLinked ? (
													'Vinculado'
												) : (
													<>
														<Plus className="h-4 w-4 mr-1" />
														Agregar
													</>
												)}
											</Button>
										</div>
									);
								})}
								{/* Infinite scroll trigger */}
								<div ref={observerTarget} className="h-4">
									{isFetching && page > 1 && (
										<div className="flex items-center justify-center py-4">
											<span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
										</div>
									)}
								</div>
							</>
						)}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
