'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '../../ui/card';

export interface DemoRoleCardProps {
	icon: LucideIcon;
	role: string;
	title: string;
	description: string;
	features: string[];
	email: string;
	onStartDemo: (email: string, password: string) => void;
	isLoading?: boolean;
}

export function DemoRoleCard({
	icon: Icon,
	role,
	title,
	description,
	features,
	email,
	onStartDemo,
	isLoading = false,
}: Readonly<DemoRoleCardProps>) {
	const handleClick = () => {
		onStartDemo(email, 'demo1234');
	};

	return (
		<Card className="flex flex-col h-full border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
			<CardHeader className="pb-4">
				<div className="flex items-center gap-3 mb-2">
					<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
						<Icon className="w-6 h-6 text-primary" />
					</div>
					<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						{role}
					</span>
				</div>
				<CardTitle className="text-xl text-foreground">{title}</CardTitle>
				<CardDescription className="text-muted-foreground leading-relaxed">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-4">
				<ul className="space-y-2">
					{features.map((feature) => (
						<li key={feature} className="flex items-start gap-2 text-sm">
							<span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
							<span className="text-muted-foreground">{feature}</span>
						</li>
					))}
				</ul>
			</CardContent>
			<CardFooter className="pt-0">
				<Button
					onClick={handleClick}
					disabled={isLoading}
					className="w-full"
					size="lg"
				>
					{isLoading ? 'Iniciando...' : `Probar como ${title}`}
				</Button>
			</CardFooter>
		</Card>
	);
}
