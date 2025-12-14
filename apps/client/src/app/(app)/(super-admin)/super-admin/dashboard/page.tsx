'use client';
import { KpiGrid, OverviewChart, RecentTenantsTable } from '@repo/ui';
import React from 'react';

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-6 px-6 py-2 w-full">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Panel Global</h1>
				<p className="text-muted-foreground">
					Visión general del rendimiento de todos los tenants.
				</p>
			</div>

			{/* Grid de KPIs */}
			<KpiGrid />

			{/* 2. Sección Principal */}
			<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
				{/* IZQUIERDA: Gráfico (4 columnas) */}
				<div className="lg:col-span-4 rounded-xl border bg-card text-card-foreground shadow flex items-center justify-center bg-muted/5 border-dashed">
					<OverviewChart />
				</div>

				{/* DERECHA: Tabla (3 columnas) */}
				<div className="lg:col-span-3">
					<RecentTenantsTable />
				</div>
			</div>
		</div>
	);
}
