import type { LucideIcon } from 'lucide-react';

interface FeatureIconProps {
	icon: LucideIcon;
	className?: string;
}

export function FeatureIcon({ icon: Icon, className = '' }: FeatureIconProps) {
	return (
		<div className={`bg-primary/10 rounded-lg p-3 w-fit ${className}`}>
			<Icon className="h-6 w-6 text-primary" />
		</div>
	);
}
