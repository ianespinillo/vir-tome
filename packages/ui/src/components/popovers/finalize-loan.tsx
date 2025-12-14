'use client';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { useLoans } from '@repo/hooks';
import { useState } from 'react';

export function FinalizeLoanPopover({
	loanId,
}: Readonly<{ loanId: string | number }>) {
	const [open, setOpen] = useState(false);
	const { finishLoan } = useLoans();
	const handleConfirm = () => {
		finishLoan.mutate(loanId);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm">
					Finalizar
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64">
				<p className="text-sm mb-4 text-muted-foreground">
					¿Querés finalizar este préstamo?
				</p>
				<div className="flex justify-end gap-2">
					<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button size="sm" onClick={handleConfirm}>
						Confirmar
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
