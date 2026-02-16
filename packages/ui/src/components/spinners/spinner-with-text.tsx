export function SpinnerWithText({
	text = 'Cargando...',
}: Readonly<{ text?: string }>) {
	return (
		<div className="flex flex-col items-center justify-center h-full w-full gap-4">
			<div className="h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
			<p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
		</div>
	);
}
