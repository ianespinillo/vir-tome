import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { FeatureIcon } from '../icons/feature-icon';

interface FeatureCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
	return (
		<Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
			<CardContent className="p-6">
				<FeatureIcon icon={icon} className="mb-4" />
				<h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
				<p className="text-muted-foreground leading-relaxed">{description}</p>
			</CardContent>
		</Card>
	);
}
