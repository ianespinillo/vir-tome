import { BookOpen } from 'lucide-react';

interface LogoProps {
	size?: 'sm' | 'md' | 'lg';
	showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
	const sizeClasses = {
		sm: 'h-6 w-6',
		md: 'h-8 w-8',
		lg: 'h-12 w-12',
	};

	const textSizeClasses = {
		sm: 'text-lg',
		md: 'text-xl',
		lg: 'text-3xl',
	};

	return (
		<div className="flex items-center gap-2">
			<div className="bg-primary rounded-lg p-2">
				<BookOpen className={`${sizeClasses[size]} text-primary-foreground`} />
			</div>
			{showText && (
				<div className="flex flex-col">
					<span className={`${textSizeClasses[size]} font-bold text-foreground`}>
						Vir-tome
					</span>
					<span className="text-xs text-muted-foreground">
						Gestión Bibliotecaria
					</span>
				</div>
			)}
		</div>
	);
}
