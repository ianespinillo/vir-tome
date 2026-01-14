import { useLoanContext } from '@/contexts/loan-context';
import { Label } from '@/ui/label';
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group';
import { CreateLoanDto, LoanBorrowerType } from '@repo/common';
import { User, UserPlus } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

export const BorrowerType = () => {
	const form = useFormContext<CreateLoanDto>();
	const { setBorrowerType, borrowerType } = useLoanContext();
	return (
		<div className="space-y-4">
			<Label className="text-sm font-medium">Tipo de Usuario</Label>
			<RadioGroup
				value={borrowerType}
				onValueChange={(value: LoanBorrowerType) => setBorrowerType(value)}
				className="grid grid-cols-2 gap-4"
			>
				<div className="relative">
					<RadioGroupItem
						value={LoanBorrowerType.REGISTERED_USER}
						id={LoanBorrowerType.REGISTERED_USER}
						className="peer sr-only"
					/>
					<Label
						htmlFor={LoanBorrowerType.REGISTERED_USER}
						className="flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer transition-all"
						onClick={() =>
							form.setValue('borrower_type', LoanBorrowerType.REGISTERED_USER)
						}
					>
						<User className="h-4 w-4" />
						Usuario Registrado
					</Label>
				</div>
				<div className="relative">
					<RadioGroupItem
						value={LoanBorrowerType.EXTERNAL_BORROWER}
						id={LoanBorrowerType.EXTERNAL_BORROWER}
						className="peer sr-only"
					/>
					<Label
						htmlFor={LoanBorrowerType.EXTERNAL_BORROWER}
						className="flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer transition-all"
						onClick={() =>
							form.setValue('borrower_type', LoanBorrowerType.EXTERNAL_BORROWER)
						}
					>
						<UserPlus className="h-4 w-4" />
						Invitado
					</Label>
				</div>
			</RadioGroup>
		</div>
	);
};
