import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from 'lucide-react';
// kpi-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface KpiCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	trend?: {
		value: number; // Porcentaje o valor numérico
		isPositive: boolean; // true = verde/arriba, false = rojo/abajo
		label?: string; // ej: "vs mes pasado"
	};
	className?: string;
}

export function KpiCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	className,
}: Readonly<KpiCardProps>) {
	return (
		<Card className={cn('overflow-hidden', className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>

				{(trend || description) && (
					<div className="flex items-center text-xs text-muted-foreground mt-1">
						{trend && (
							<span
								className={cn(
									'flex items-center font-medium mr-2',
									trend.isPositive ? 'text-emerald-500' : 'text-rose-500',
								)}
							>
								{trend.isPositive ? (
									<ArrowUpRight className="h-3 w-3 mr-1" />
								) : (
									<ArrowDownRight className="h-3 w-3 mr-1" />
								)}
								{Math.abs(trend.value)}%
							</span>
						)}

						{description && (
							<span className="opacity-70 truncate">{description}</span>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
