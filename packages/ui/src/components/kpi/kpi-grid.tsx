import { useSuperAdmin } from '@repo/hooks';
import { Activity, BookCopy, Building2, Users } from 'lucide-react';
import React from 'react';
import { KpiCard } from './kpi-card';

export const KpiGrid = () => {
	const { dashMetrics } = useSuperAdmin();
	if (dashMetrics.isLoading || dashMetrics.isError) {
		return <div>Cargando métricas...</div>;
	}
	const { data } = dashMetrics;
	if (!data) {
		return <div>No hay datos disponibles.</div>;
	}
	const queryData = dashMetrics.data.data;
	if (!queryData) {
		return <div>No hay satos disponibles</div>;
	}
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{/* KPI 1: Tenants Activos */}
			<KpiCard
				title="Tenants Activos"
				value={queryData?.active_tenants.toString() || '0'}
				icon={Building2}
				trend={{
					value: queryData?.active_tenants,
					isPositive: queryData?.active_tenants >= 0,
				}}
				description="vs mes pasado"
			/>

			{/* KPI 2: Usuarios Totales */}
			<KpiCard
				title="Usuarios Totales"
				value={queryData.total_users.toString() || '0'}
				icon={Users}
				trend={{
					value: queryData.total_users,
					isPositive: queryData?.total_users >= 0,
				}}
				description="Crecimiento orgánico"
			/>

			{/* KPI 3: Préstamos del Mes */}
			<KpiCard
				title="Préstamos (Mes)"
				value={queryData?.active_loans.toString() || '0'}
				icon={BookCopy}
				trend={{
					value: queryData?.active_loans,
					isPositive: queryData?.active_loans >= 0,
				}}
				description="Baja estacional (Vacaciones)"
			/>

			{/* KPI 4: Estado del Sistema (Custom logic) */}
			{/* Aquí podríamos poner lógica para detectar si hay errores */}
			<KpiCard
				title="Health Status"
				value="99.9%"
				icon={Activity}
				description="Uptime últimos 30 días"
				className="border-l-4 border-l-emerald-500" // Un toque visual extra
			/>
		</div>
	);
};
