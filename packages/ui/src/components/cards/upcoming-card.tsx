import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { ILoanAlert } from '@repo/common';
import { Clock } from 'lucide-react';

interface UpcomingCardProps {
	items: ILoanAlert[];
	className?: string;
}

export function UpcomingCard({
	items,
	className,
}: Readonly<UpcomingCardProps>) {
	return (
		<Card className={cn('flex flex-col', className)}>
			<CardHeader className="flex shrink-0 flex-row items-center space-y-0 border-b px-3 py-2.5">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<Clock className="h-4 w-4 text-amber-600" />
					Vencimientos
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 space-y-1.5 overflow-auto p-2.5">
				{items.map((item, i) => (
					<div
						key={item.loan?.id}
						className={cn(
							'flex items-center justify-between rounded-lg p-2',
							(item.daysUntilDue ?? 0) <= 3 ? 'bg-amber-500/10' : 'bg-muted/50',
						)}
					>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
									(item.daysUntilDue ?? 0) <= 3
										? 'bg-amber-500 text-white'
										: 'bg-muted text-muted-foreground',
								)}
							>
								{i + 1}
							</span>
							<span className="line-clamp-1 text-sm text-foreground">
								{item.loan?.book.title}
							</span>
						</div>
						<span
							className={cn(
								'text-xs font-semibold',
								(item.daysUntilDue ?? 0) <= 3
									? 'text-amber-600'
									: 'text-muted-foreground',
							)}
						>
							{item.daysUntilDue === 1 ? 'Mañana' : `${item.daysUntilDue}d`}
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
