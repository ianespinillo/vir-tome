import { RequestLoan } from '@/components/forms/loan/request-loan';
import React from 'react';
import { BasicDialog } from '../basic-dialog';

export const RequestLoanDialog = () => {
	return (
		<BasicDialog title="Nueva solicitud de prestamo">
			<RequestLoan />
		</BasicDialog>
	);
};
