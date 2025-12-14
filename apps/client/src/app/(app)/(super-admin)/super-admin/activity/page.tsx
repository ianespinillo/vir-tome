'use client';
import {
	LastLoansTable,
	LastReturnsTable,
	LastUsersTable,
	MostLoanedBooksTable,
} from '@repo/ui';
import React from 'react';

export default function ActivityPage() {
	return (
		<div className="p-4 w-full space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Panel de actividad</h1>
				<p className="text-muted-foreground">
					Visión general de la actividad de todos los tenants.
				</p>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
				{/* COLUMNA IZQUIERDA (Contenido variable) */}
				<div className="lg:col-span-8 flex flex-col gap-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<LastLoansTable />
						<LastReturnsTable />
					</div>
					<MostLoanedBooksTable />
				</div>

				{/* COLUMNA DERECHA (Usuarios) */}
				<div className="lg:col-span-4">
					{/* Aquí está el truco: 'h-full' hará que este contenedor 
       se estire para ser tan alto como la columna izquierda.
       Y dentro, tu componente LastUsersTable debe aceptar className para estirarse también.
    */}
					<LastUsersTable />
				</div>
			</div>
		</div>
	);
}
