'use client';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { ILoan } from '@repo/common';
import { useLoans } from '@repo/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
export function FinalizeLoanPopover({ loanId }: Readonly<{ loanId: number }>) {
	const [open, setOpen] = useState(false);
	const {
		hook: { finishLoan },
	} = useModalCrud<ILoan, ReturnType<typeof useLoans>>();
	const handleConfirm = () => {
		toast.promise(finishLoan.mutateAsync(loanId), {
			success() {
				setOpen(false);
				return 'Prestamo finalizado exitosamente';
			},
			error() {
				return 'Error al finalizar el prestamo';
			},
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<span>Finalizar prestamo</span>
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
