'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/ui/card'; // Ajusta tus imports
import { useSuperAdmin } from '@repo/hooks';
import { Loader2 } from 'lucide-react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

// Mock Data: Préstamos por mes

// Custom Tooltip para que combine con Shadcn
const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload?.length) {
		return (
			<div className="rounded-lg border bg-background p-2 shadow-sm">
				<div className="grid grid-cols-2 gap-2">
					<div className="flex flex-col">
						<span className="text-[0.70rem] uppercase text-muted-foreground">
							{label}
						</span>
						<span className="font-bold text-muted-foreground">
							{payload[0].value} Préstamos
						</span>
					</div>
				</div>
			</div>
		);
	}
	return null;
};

export function OverviewChart() {
	const { loansByMonth } = useSuperAdmin();
	return (
		<Card className="col-span-4 h-full w-full">
			<CardHeader>
				<CardTitle>Actividad de Préstamos</CardTitle>
				<CardDescription>
					Tendencia de uso de la plataforma este año
				</CardDescription>
			</CardHeader>
			<CardContent className="pl-2">
				<div className="h-[350px] w-full">
					{loansByMonth.data?.data?.length === 0 ? (
						<div className="flex justify-center items-center">
							<span>No hay prestamos registrados</span>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							{loansByMonth.isLoading ? (
								<div className="flex justify-center items-center">
									<Loader2 />
								</div>
							) : (
								<AreaChart
									data={
										Array.isArray(loansByMonth.data?.data) ? loansByMonth.data.data : []
									}
									margin={{
										top: 5,
										right: 10,
										left: 10,
										bottom: 0,
									}}
								>
									<defs>
										{/* Gradiente para rellenar el área */}
										<linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
											<stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
										</linearGradient>
									</defs>

									<XAxis
										dataKey="name"
										stroke="#888888"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										stroke="#888888"
										fontSize={12}
										tickLine={false}
										axisLine={false}
										tickFormatter={(value) => `${value}`}
									/>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										className="stroke-muted"
									/>
									<Tooltip
										content={<CustomTooltip />}
										cursor={{ stroke: '#8884d8', strokeWidth: 1 }}
									/>

									<Area
										type="monotone"
										dataKey="total"
										stroke="#8884d8" // Color principal (puedes usar una variable CSS o Hex)
										strokeWidth={2}
										fillOpacity={1}
										fill="url(#colorTotal)"
									/>
								</AreaChart>
							)}
						</ResponsiveContainer>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
