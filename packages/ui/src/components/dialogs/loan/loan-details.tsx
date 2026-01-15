'use client';

import type React from 'react';

import { useModalCrud } from '@/contexts/modal-crud-context';
import { Badge } from '@/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Separator } from '@/ui/separator';
import {
	IBook,
	ILoan,
	IUser,
	LoanBorrowerType,
	LoanStatus,
} from '@repo/common';
import { useBooks, useUsers } from '@repo/hooks';
import {
	AlertCircle,
	BookOpen,
	Calendar,
	CreditCard,
	Mail,
	Package,
	Phone,
	User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const statusColors: Record<LoanStatus, string> = {
	[LoanStatus.ACTIVE]: 'bg-blue-500/10 text-blue-600 border-blue-200',
	[LoanStatus.RETURNED]: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	[LoanStatus.OVERDUE]: 'bg-red-500/10 text-red-600 border-red-200',
	[LoanStatus.REQUESTED]: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
	[LoanStatus.DENIED]: 'bg-gray-500/10 text-gray-600 border-gray-300',
};

const statusLabels: Record<LoanStatus, string> = {
	[LoanStatus.ACTIVE]: 'Activo',
	[LoanStatus.RETURNED]: 'Devuelto',
	[LoanStatus.OVERDUE]: 'Vencido',
	[LoanStatus.REQUESTED]: 'Solicitado',
	[LoanStatus.DENIED]: 'Rechazado',
};

const borrowerTypeLabels: Record<string, string> = {
	user: 'Usuario Registrado',
	guest: 'Invitado',
};

const toDate = (value: string | Date | null | undefined): Date | null => {
	if (!value) return null;
	if (value instanceof Date) return value;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
};

export const LoanDetailsDialog = () => {
	const { entity, detailsOpen, closeViewDetails } = useModalCrud<ILoan, any>();
	const [book, setBook] = useState<IBook | null>(null);
	const [user, setUser] = useState<IUser | null>(null);
	const { getUserById } = useUsers({ page: 1, searchTerm: '' });
	const { findBook } = useBooks({ page: 1, searchTerm: '' });
	useEffect(() => {
		if (!entity) return;
		if (detailsOpen && !entity) closeViewDetails();
		if (entity && entity?.borrower_type === LoanBorrowerType.REGISTERED_USER) {
			getUserById.mutate(entity.user_id ?? 0);
			setUser(getUserById.data?.data ?? null);
		}
		findBook.mutate(entity?.book_id);
		setBook(findBook.data?.data ?? null);
	}, [detailsOpen, entity]);

	const formatDate = (dateString: string | Date | null | undefined) => {
		const date = toDate(dateString);
		if (!date) return 'No disponible';
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const isOverdue = entity?.isOverdue?.() || false;

	return (
		<Dialog open={detailsOpen} onOpenChange={closeViewDetails}>
			<DialogContent className="max-w-md p-0 gap-0">
				<DialogHeader className="p-6 pb-0">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
							<BookOpen className="h-6 w-6" />
						</div>
						<div className="flex-1 space-y-1">
							<DialogTitle className="text-lg font-semibold leading-none">
								Préstamo #{entity?.id}
							</DialogTitle>
							<div className="flex items-center gap-2 mt-2">
								<Badge
									variant="outline"
									className={`text-xs capitalize ${entity?.status ? statusColors[entity?.status] : ''}`}
								>
									{entity?.status
										? statusLabels[entity?.status] || entity?.status
										: 'Desconocido'}
								</Badge>
								{isOverdue && (
									<div className="flex items-center gap-1 text-xs text-red-600">
										<AlertCircle className="h-3 w-3" />
										Vencido
									</div>
								)}
							</div>
						</div>
					</div>
				</DialogHeader>

				<div className="p-6 space-y-4">
					{/* Book Information */}
					<div className="space-y-2">
						<h5 className="text-sm font-medium flex items-center gap-1.5">
							<BookOpen className="h-4 w-4" />
							Libro
						</h5>
						<div className="rounded-lg border bg-card p-3">
							<p className="font-medium text-sm">{entity?.book?.title}</p>
							{book?.publisher && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{book.publisher.name}
								</p>
							)}
							<div className="flex items-center gap-1.5 mt-2">
								<Package className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs text-muted-foreground">
									Cantidad: <span className="font-medium">{entity?.quantity}</span>
								</span>
							</div>
						</div>
					</div>

					<Separator />

					{/* Borrower Information */}
					<div className="space-y-2">
						<h5 className="text-sm font-medium flex items-center gap-1.5">
							<User className="h-4 w-4" />
							Prestatario
						</h5>
						<div className="rounded-lg border bg-card p-3 space-y-2">
							<div className="flex items-center justify-between">
								<p className="font-medium text-sm">
									{entity?.borrower_type === LoanBorrowerType.REGISTERED_USER
										? user && `${user?.name} ${user?.surname}`
										: entity?.borrower_name}
								</p>
								<Badge variant="secondary" className="text-xs">
									{borrowerTypeLabels[entity?.borrower_type || ''] ||
										entity?.borrower_type}
								</Badge>
							</div>

							{entity?.borrower_email && (
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Mail className="h-3 w-3" />
									{entity.borrower_email}
								</div>
							)}

							{entity?.borrower_phone && (
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Phone className="h-3 w-3" />
									{entity.borrower_phone}
								</div>
							)}

							{entity?.borrower_national_id && (
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<CreditCard className="h-3 w-3" />
									{entity.borrower_national_id}
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Dates */}
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Fecha de Préstamo
							</p>
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="text-xs">{formatDate(entity?.loan_date)}</span>
							</div>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Fecha de Devolución
							</p>
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<span
									className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : ''}`}
								>
									{formatDate(entity?.return_date)}
								</span>
							</div>
						</div>
					</div>

					{/* Metadata */}
					<div className="grid grid-cols-2 gap-3 text-sm pt-2">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">Creado</p>
							<span className="text-xs">{formatDate(entity?.created_at)}</span>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Última Actualización
							</p>
							<span className="text-xs">{formatDate(entity?.updated_at)}</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
