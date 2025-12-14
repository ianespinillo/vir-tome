interface Props {
	text: string;
	action?: () => void;
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link'
		| null;
}
import { Button } from '@/ui/button';
import { CircleFadingPlus } from 'lucide-react';
import React from 'react';

export const AddButton = ({ text, action, variant }: Readonly<Props>) => {
	return (
		<Button variant={variant} onClick={action}>
			{text}
			<CircleFadingPlus className="h-4 w-4" />
		</Button>
	);
};
