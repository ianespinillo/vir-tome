'use client';
import { Socket } from 'node:dgram';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Badge } from '@/ui/badge';
import { Card, CardContent } from '@/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Separator } from '@/ui/separator';
import { ITenant } from '@repo/common';
import type { useTenants } from '@repo/hooks';
import {
	BookOpen,
	Building2,
	Calendar,
	FileText,
	Globe,
	Mail,
	MapPin,
	Phone,
	User,
	Users,
} from 'lucide-react';
import React from 'react';

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString('es-AR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};
const toDate = (value: string | Date | null | undefined): Date | null => {
	if (!value) return null;
	if (value instanceof Date) return value;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
};

const getPlanColor = (plan: string) => {
	switch (plan) {
		case 'enterprise':
			return 'bg-amber-100 text-amber-800 border-amber-200';
		case 'premiun':
			return 'bg-blue-100 text-blue-800 border-blue-200';
		default:
			return 'bg-muted text-muted-foreground';
	}
};
export const TenantDetailsDialog = () => {
	const {
		entity: school,
		detailsOpen,
		closeViewDetails,
	} = useModalCrud<ITenant, ReturnType<typeof useTenants>>();
	if (detailsOpen && !school) {
		closeViewDetails();
		return <div>No entity found</div>;
	}
	const isExpiringSoon = () => {
		const expDate = new Date(school?.subscription_expires_at || Date.now());
		const now = new Date();
		const daysUntilExpiry = Math.ceil(
			(expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		return daysUntilExpiry <= 30;
	};

	return (
		<Dialog open={detailsOpen} onOpenChange={closeViewDetails} modal>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
								<Building2 className="h-6 w-6 text-primary" />
							</div>
							<div>
								<DialogTitle className="text-xl font-semibold text-balance">
									{school?.name}
								</DialogTitle>
								<p className="text-sm text-muted-foreground mt-0.5">ID: {school?.id}</p>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-2 mt-3">
						<Badge variant={school?.is_active ? 'default' : 'secondary'}>
							{school?.is_active ? 'Activo' : 'Inactivo'}
						</Badge>
						{school?.is_demo && (
							<Badge
								variant="outline"
								className="border-orange-200 bg-orange-50 text-orange-700"
							>
								Demo
							</Badge>
						)}
						<Badge variant="outline" className={getPlanColor(school?.plan ?? 'nulo')}>
							{(school?.plan ?? '').charAt(0).toUpperCase() +
								(school?.plan ?? '').slice(1)}
						</Badge>
					</div>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Contact Information */}
					<Card className="border-0 bg-muted/40">
						<CardContent className="p-4 space-y-3">
							<h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
								Información de contacto
							</h3>
							<div className="grid gap-3">
								<div className="flex items-center gap-3">
									<Mail className="h-4 w-4 text-muted-foreground shrink-0" />
									<a
										href={`mailto:${school?.contact_email}`}
										className="text-sm text-primary hover:underline"
									>
										{school?.contact_email}
									</a>
								</div>
								<div className="flex items-center gap-3">
									<Phone className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-sm">{school?.settings?.school_info?.phone}</span>
								</div>
								<div className="flex items-center gap-3">
									<MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-sm">
										{school?.settings?.school_info?.address}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<User className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-sm">
										<span className="text-muted-foreground">Director:</span>{' '}
										{school?.settings?.school_info?.principal}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<Globe className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-sm font-mono text-muted-foreground">
										{school?.subdomain}.virtome.app
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Plan Limits */}
					<Card className="border-0 bg-muted/40">
						<CardContent className="p-4 space-y-3">
							<h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
								Límites del plan
							</h3>
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center p-3 rounded-lg bg-background">
									<BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
									<p className="text-2xl font-bold">
										{school?.settings?.limits?.max_books}
									</p>
									<p className="text-xs text-muted-foreground">Libros</p>
								</div>
								<div className="text-center p-3 rounded-lg bg-background">
									<FileText className="h-5 w-5 text-primary mx-auto mb-1" />
									<p className="text-2xl font-bold">
										{school?.settings?.limits?.max_loans}
									</p>
									<p className="text-xs text-muted-foreground">Préstamos</p>
								</div>
								<div className="text-center p-3 rounded-lg bg-background">
									<Users className="h-5 w-5 text-primary mx-auto mb-1" />
									<p className="text-2xl font-bold">
										{school?.settings?.limits?.max_users}
									</p>
									<p className="text-xs text-muted-foreground">Usuarios</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Subscription & Dates */}
					<Card className="border-0 bg-muted/40">
						<CardContent className="p-4 space-y-3">
							<h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
								Suscripción
							</h3>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Vencimiento</span>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span
											className={`text-sm font-medium ${
												isExpiringSoon() ? 'text-amber-600' : ''
											} ${
												new Date(school?.subscription_expires_at || Date.now()) < new Date()
													? 'text-red-600'
													: ''
											}`}
										>
											{formatDate(
												toDate(school?.subscription_expires_at)?.toString() ||
													new Date().toString(),
											)}
										</span>
										{new Date(school?.subscription_expires_at || Date.now()) <=
										new Date() ? (
											<Badge
												variant="outline"
												className="border-red-200 bg-red-50 text-red-700 text-xs"
											>
												Vencido
											</Badge>
										) : (
											(() =>
												isExpiringSoon() &&
												new Date(school?.subscription_expires_at || Date.now()) >=
													new Date() && (
													<Badge
														variant="outline"
														className="border-amber-200 bg-amber-50 text-amber-700 text-xs"
													>
														Próximo a vencer
													</Badge>
												))()
										)}
									</div>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Creado</span>
									<span className="text-sm">
										{formatDate(
											toDate(school?.created_at)?.toLocaleDateString() ||
												new Date(Date.now()).toLocaleDateString(),
										)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">
										Última actualización
									</span>
									<span className="text-sm">
										{formatDate(
											toDate(school?.updated_at)?.toLocaleDateString() ||
												new Date(Date.now()).toLocaleDateString(),
										)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Theme */}
					<div className="flex items-center justify-between px-1">
						<span className="text-sm text-muted-foreground">Tema configurado</span>
						<div className="flex items-center gap-2">
							<div
								className="h-4 w-4 rounded-full border"
								style={{
									backgroundColor: (() => {
										switch (school?.settings?.theme) {
											case 'blue':
												return '#3b82f6';
											case 'green':
												return '#22c55e';
											case 'dark':
												return '#1f2937';
											case 'light':
												return '#f3f4f6';
											default:
												return '#d1d5db'; // Default to muted color
										}
									})(),
								}}
							/>
							<span className="text-sm capitalize">{school?.settings?.theme}</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
