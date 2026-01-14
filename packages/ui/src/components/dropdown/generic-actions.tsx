'use client';
import { Button } from '@/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import React, { MouseEventHandler } from 'react';

export interface ActionNode {
	id: number;
	children: JSX.Element | string;
	onClick?: MouseEventHandler<HTMLDivElement>;
	className?: string;
}

interface GenericActionsProps {
	nodes: ActionNode[];
}

export const GenericActions = ({ nodes }: Readonly<GenericActionsProps>) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Abrir menú</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Acciones</DropdownMenuLabel>
				{nodes.map((node) => (
					<DropdownMenuItem
						className={node.className && `${node.className}`}
						onClick={node.onClick}
						key={node.id}
					>
						{node.children}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
