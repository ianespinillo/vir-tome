import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/ui/alert';
import { Badge } from '@/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { ILoanAlert } from '@repo/common';
import { AlertTriangle, Info } from 'lucide-react';

interface AlertsPanelProps {
	alerts: ILoanAlert[];
	className?: string;
}

const alertStyles = {
	error: 'border-destructive/50 bg-destructive/10',
	warning: 'border-amber-500/50 bg-amber-500/10',
	info: 'border-primary/50 bg-primary/10',
};

const alertIconStyles = {
	error: 'text-destructive',
	warning: 'text-amber-600',
	info: 'text-primary',
};

export function AlertsPanel({ alerts, className }: Readonly<AlertsPanelProps>) {
	return (
		<Card className={cn('flex flex-col', className)}>
			<CardHeader className="flex shrink-0 flex-row items-center space-y-0 border-b px-3 py-2.5">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<AlertTriangle className="h-4 w-4 text-destructive" />
					Alertas
				</CardTitle>
				<Badge
					variant="destructive"
					className="ml-auto h-5 w-5 justify-center rounded-full p-0 text-xs"
				>
					{alerts.length}
				</Badge>
			</CardHeader>
			<CardContent className="flex-1 space-y-1.5 overflow-auto p-2.5">
				{alerts.map((alert) => (
					<Alert
						key={alert.message}
						className={cn('py-2', alertStyles[alert.severity])}
					>
						{alert.type === 'info' ? (
							<Info className={cn('h-3 w-3', alertIconStyles[alert.type])} />
						) : (
							<AlertTriangle
								className={cn('h-3 w-3', alertIconStyles[alert.severity])}
							/>
						)}
						<AlertDescription className="text-xs">{alert.message}</AlertDescription>
					</Alert>
				))}
			</CardContent>
		</Card>
	);
}
