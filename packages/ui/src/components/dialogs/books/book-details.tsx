import { useModalCrud } from '@/contexts/modal-crud-context';
import { Badge } from '@/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { IBook } from '@repo/common';
import { useBooks } from '@repo/hooks';
import { Building2, Calendar, Package } from 'lucide-react';

export function BookDetailDialog() {
	const { entity, detailsOpen, setDetailsOpen } = useModalCrud<
		IBook,
		ReturnType<typeof useBooks>
	>();
	if (!entity) return null;

	return (
		<Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-balance pr-8">
						{entity.title}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 pt-4">
					{/* Main Information Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Publication Year */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar className="w-4 h-4" />
								<span className="font-medium">Año de Publicación</span>
							</div>
							<p className="text-lg font-semibold pl-6">{entity.publicationYear}</p>
						</div>

						{/* Available Quantity */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Package className="w-4 h-4" />
								<span className="font-medium">Cantidad Disponible</span>
							</div>
							<p className="text-lg font-semibold pl-6">
								{entity.availableQuantity}{' '}
								{entity.availableQuantity === 1 ? 'unidad' : 'unidades'}
							</p>
						</div>
					</div>

					{/* Publisher Section */}
					<div className="space-y-3 pt-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Building2 className="w-4 h-4" />
							<span className="font-medium">Editorial</span>
						</div>
						<div className="pl-6 p-4 bg-muted/50 rounded-lg border border-border">
							<p className="font-semibold text-lg">{entity.publisher.name}</p>
						</div>
					</div>

					{/* Categories Section */}
					{entity.categories && entity.categories.length > 0 && (
						<div className="space-y-3 pt-2">
							<div className="text-sm text-muted-foreground font-medium">
								Categorías
							</div>
							<div className="flex flex-wrap gap-2">
								{entity.categories.map((category) => (
									<Badge
										key={category.id}
										variant="secondary"
										className="px-4 py-2 text-sm font-medium"
									>
										{category.name}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Metadata Section */}
					<div className="pt-4 border-t border-border">
						<details className="group">
							<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
								<span className="font-medium">Información adicional</span>
								<span className="transition-transform group-open:rotate-180">▼</span>
							</summary>
							<div className="mt-4 space-y-2 text-sm pl-4">
								<div className="flex justify-between py-1.5">
									<span className="text-muted-foreground">ID:</span>
									<span className="font-mono">{entity.id}</span>
								</div>
								<div className="flex justify-between py-1.5">
									<span className="text-muted-foreground">Creado:</span>
									<span className="font-mono">
										{new Date(entity.created_at).toLocaleDateString('es-ES')}
									</span>
								</div>
								<div className="flex justify-between py-1.5">
									<span className="text-muted-foreground">Actualizado:</span>
									<span className="font-mono">
										{new Date(entity.updated_at).toLocaleDateString('es-ES')}
									</span>
								</div>
							</div>
						</details>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
