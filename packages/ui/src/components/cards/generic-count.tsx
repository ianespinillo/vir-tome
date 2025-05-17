import { Card } from '@/ui/card';
import React, { ReactNode, useEffect, useState } from 'react';

interface GenericCountCardProps {
	title: string;
	value: number;
	icon: ReactNode;
	color?: string; // ejemplo: 'indigo' o 'emerald'
}

export const GenericCountCard = ({
	title,
	value,
	icon,
	color = 'indigo',
}: GenericCountCardProps) => {
	const [animatedCount, setAnimatedCount] = useState(0);

	useEffect(() => {
		const duration = 2000;
		const increment = Math.ceil(value / (duration / 16));

		const timer = setInterval(() => {
			setAnimatedCount((prev) => {
				const newValue = prev + increment;
				if (newValue >= value) {
					clearInterval(timer);
					return value;
				}
				return newValue;
			});
		}, 16);

		return () => clearInterval(timer);
	}, [value]);

	return (
		<Card className="flex items-center justify-start gap-4 p-6 shadow-sm bg-white rounded-2xl w-full h-full">
			<div className={`p-4 rounded-xl bg-${color}-100 text-${color}-600`}>
				{icon}
			</div>
			<div className="flex flex-col">
				<span className="text-sm text-muted-foreground">{title}</span>
				<span className="text-4xl font-semibold text-primary leading-tight">
					{animatedCount.toLocaleString()}
				</span>
			</div>
		</Card>
	);
};
