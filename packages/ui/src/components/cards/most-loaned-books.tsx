'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/ui/chart';
import { useAnalytics } from '@repo/hooks';
import React, { useEffect } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
	XAxis,
	YAxis,
} from 'recharts';
import { Loading } from '../spinners/loading';

export const MostLoanedBooks = () => {
	const { mostLoanedBooks } = useAnalytics();

	useEffect(() => {
		mostLoanedBooks.refetch();
	}, []);

	const config = {
		count: {
			label: 'Solicitudes',
			color: 'hsl(var(--primary))',
		},
	} satisfies ChartConfig;

	const data = mostLoanedBooks.data?.data
		? [...mostLoanedBooks.data.data]
				.sort((a, b) => b.count - a.count) // Orden descendente
				.slice(0, 5) // Top 5
		: [];

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Top Libros más solicitados</CardTitle>
			</CardHeader>
			<CardContent className="p-5">
				{mostLoanedBooks.isPending ? (
					<Loading />
				) : (
					data.length && (
						<div className="max-h-[400px]">
							<ChartContainer config={config}>
								<BarChart
									accessibilityLayer
									data={data}
									layout="vertical"
									margin={{
										right: 16,
										left: 120,
									}}
								>
									<CartesianGrid horizontal={false} />
									<YAxis
										dataKey="title"
										fontSize={22}
										type="category"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										width={120}
									/>
									<XAxis dataKey="count" type="number" />
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator="line" />}
									/>
									<Bar
										dataKey="count"
										layout="vertical"
										fill="var(--color-count)"
										barSize={30}
										radius={4}
										isAnimationActive
									>
										<LabelList
											dataKey="count"
											position="right"
											offset={8}
											className="fill-foreground"
											fontSize={13}
										/>
									</Bar>
								</BarChart>
							</ChartContainer>
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
};
