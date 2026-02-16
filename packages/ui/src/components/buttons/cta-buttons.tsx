import { useUINav } from '@/contexts/navigation-context';
import { Button } from '@/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function CTAButtons() {
	const { navigate } = useUINav();
	return (
		<div className="flex flex-col sm:flex-row gap-4 justify-center">
			<Button size="lg" className="text-lg px-8 py-6">
				Comenzar ahora
				<ArrowRight className="ml-2 h-5 w-5" />
			</Button>
			<Button
				variant="outline"
				size="lg"
				className="text-lg px-8 py-6 bg-transparent"
				onClick={() => navigate('/demo-info', { isExternal: false })}
			>
				<Play className="mr-2 h-5 w-5" />
				Ver demo
			</Button>
		</div>
	);
}
