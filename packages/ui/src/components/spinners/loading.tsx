import React from 'react';
import { MoonLoader } from 'react-spinners';

export const Loading = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full space-y-10">
			<MoonLoader className="h-20 w-20 text-primary" />
			<p className="text-center text-2xl font-semibold text-muted-foreground">
				Cargando...
			</p>
		</div>
	);
};
