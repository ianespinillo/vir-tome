'use client';
import { CategoryTable } from '@repo/ui';
import React from 'react';

export default function CategoryPage() {
	return (
		<div className="flex flex-col space-y-4 p-3">
			<div className="flex flex-col space-y-4 p-6">
				<h1 className="text-5xl font-bold text-primary">Categorias</h1>
				<span className="text-muted-foreground text-xl">
					Estas son las categorías de libros disponibles
				</span>
			</div>
			<div className="flex flex-col space-y-4 p-2">
				<CategoryTable />
			</div>
		</div>
	);
}
