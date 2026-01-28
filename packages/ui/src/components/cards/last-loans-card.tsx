import { useUINav } from '@/contexts/navigation-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { ILoan, LoanStatus } from '@repo/common';
import { differenceInDays } from 'date-fns';
import { ArrowUpRight, BookOpen } from 'lucide-react';

interface LoansPanelProps {
	loans: ILoan[];
	className?: string;
}

const statusStyles = {
	[LoanStatus.ACTIVE]:
		'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
	[LoanStatus.RETURNED]: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20',
	[LoanStatus.OVERDUE]:
		'bg-destructive/10 text-destructive hover:bg-destructive/20',
	[LoanStatus.REQUESTED]: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
	[LoanStatus.DENIED]: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
};

const statusLabels = {
	[LoanStatus.ACTIVE]: 'Activo',
	[LoanStatus.RETURNED]: 'Devuelto',
	[LoanStatus.OVERDUE]: 'Vencido',
	[LoanStatus.REQUESTED]: 'Solicitado',
	[LoanStatus.DENIED]: 'Denegado',
};

export function LoansPanel({ loans, className }: Readonly<LoansPanelProps>) {
	return (
		<Card className={cn('flex flex-col', className)}>
			<CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-4 py-2.5">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<BookOpen className="h-4 w-4 text-primary" />
					Mis Préstamos Activos
				</CardTitle>
				<a href="/dashboard/my-loans">
					<Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
						Ver todos <ArrowUpRight className="h-3 w-3" />
					</Button>
				</a>
			</CardHeader>
			<CardContent className="flex-1 space-y-1.5 overflow-auto p-3">
				{loans.map((loan, i) => {
					const daysRemaining = differenceInDays(
						new Date(loan.return_date),
						new Date(),
					);
					return (
						<Card key={loan.id} className="transition-colors hover:bg-accent/50">
							<CardContent className="flex items-center justify-between p-2.5">
								<div className="flex items-center gap-2.5">
									<div className="flex h-8 w-6 items-center justify-center rounded bg-muted">
										<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">
											{loan.book.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{loan.book.publisher.name}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">
										{daysRemaining > 0
											? `${daysRemaining}d`
											: `${Math.abs(daysRemaining)}d atraso`}
									</span>
									<Badge
										variant="secondary"
										className={cn(statusStyles[loan.status], 'border-0 text-xs')}
									>
										{statusLabels[loan.status]}
									</Badge>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</CardContent>
		</Card>
	);
}
