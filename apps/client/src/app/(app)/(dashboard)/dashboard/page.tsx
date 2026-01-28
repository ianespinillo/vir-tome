'use client';
import { ROLES } from '@repo/common';
import { useAuth, useMyStats } from '@repo/hooks';
import {
	AlertTriangle,
	AlertsPanel,
	BookOpen,
	BooksCount,
	CheckCircle,
	Clock,
	LastLoansTable,
	LastReturnsTable,
	LoansCount,
	LoansPanel,
	MostLoanedBooks,
	StatCard,
	UpcomingCard,
} from '@repo/ui';
import React from 'react';

export default function DashPageLayout({
	admins,
	common,
	children,
}: Readonly<{
	admins: React.ReactNode;
	common: React.ReactNode;
	children: React.ReactNode;
}>) {
	const { session } = useAuth();
	if (session.isLoading || session.isRefetching) {
		return <div>Loading...</div>;
	}
	if (
		session.data?.data?.roleName === ROLES.STUDENT ||
		session.data?.data?.roleName === ROLES.TEACHER
	) {
		return <CommonUserDash />;
	}
	if (
		session.data?.data?.roleName === ROLES.ADMIN ||
		session.data?.data?.roleName === ROLES.LIBRARIAN
	) {
		return <AdminsDashPage />;
	}
	return null;
}
function AdminsDashPage() {
	return (
		<section className="min-h-screen flex flex-col p-4 px-6 bg-background">
			<div className="mb-8 space-y-2">
				<h1 className="text-4xl md:text-5xl font-bold text-foreground">
					Dashboard
				</h1>
				<p className="text-muted-foreground text-lg md:text-xl">
					Estas son las estadísticas de tu biblioteca
				</p>
			</div>

			<div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 overflow-auto">
				{/* Columna izquierda */}
				<div className="flex flex-col gap-6">
					{/* Cards de conteo */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<BooksCount />
						<LoansCount />
					</div>

					{/* Libros más prestados */}
					<div className="flex-1 min-h-[300px]">
						<MostLoanedBooks />
					</div>
				</div>

				{/* Columna derecha */}
				<div className="flex flex-col gap-6">
					<div className="flex-1 min-h-[250px]">
						<LastLoansTable />
					</div>
					<div className="flex-1 min-h-[250px]">
						<LastReturnsTable />
					</div>
				</div>
			</div>
		</section>
	);
}
function CommonUserDash() {
	const { myAlerts, myLastLoans, myStats } = useMyStats();
	const { active, dueSoon, overdue, returned } = myStats.data?.data ?? {};
	return (
		<div className="flex h-full flex-col overflow-hidden p-4">
			<div className="grid h-full grid-cols-4 grid-rows-[auto_1fr] gap-3">
				{/* Stats Row */}
				<StatCard
					icon={BookOpen}
					label="Activos"
					value={active ?? 0}
					iconClassName="text-primary"
					bgClassName="bg-primary/10"
				/>
				<StatCard
					icon={Clock}
					label="Por Vencer"
					value={dueSoon ?? 0}
					iconClassName="text-amber-600"
					bgClassName="bg-amber-500/10"
				/>
				<StatCard
					icon={AlertTriangle}
					label="Vencidos"
					value={overdue ?? 0}
					iconClassName="text-destructive"
					bgClassName="bg-destructive/10"
				/>
				<StatCard
					icon={CheckCircle}
					label="Devueltos"
					value={returned ?? 0}
					iconClassName="text-emerald-600"
					bgClassName="bg-emerald-500/10"
				/>

				{/* Préstamos Activos - 2 columnas */}
				<LoansPanel
					loans={myLastLoans.data?.data?.items ?? []}
					className="col-span-2 row-span-1"
				/>

				{/* Vencimientos y Alertas - columna derecha */}
				<div className="col-span-2 row-span-1 grid grid-rows-2 gap-3">
					<UpcomingCard items={myAlerts.data?.data ?? []} />
					<AlertsPanel alerts={myAlerts.data?.data ?? []} />
				</div>
			</div>
		</div>
	);
}
