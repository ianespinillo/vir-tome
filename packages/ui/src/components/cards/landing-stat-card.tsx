interface StatCardProps {
	value: string;
	label: string;
	description?: string;
}

export function LandingStatCard({ value, label, description }: StatCardProps) {
	return (
		<div className="text-center">
			<div className="text-4xl font-bold text-primary mb-2">{value}</div>
			<div className="text-lg font-semibold text-foreground mb-1">{label}</div>
			{description && (
				<div className="text-sm text-muted-foreground">{description}</div>
			)}
		</div>
	);
}
