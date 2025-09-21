import { Logo } from '@repo/ui';

export function Footer() {
	return (
		<footer className="bg-muted/30 py-16">
			<div className="container mx-auto px-4">
				<div className="grid md:grid-cols-4 gap-8">
					<div className="md:col-span-2">
						<Logo size="lg" />
						<p className="text-muted-foreground mt-4 max-w-md leading-relaxed">
							Vir-tome es un producto de VIRTEC, diseñado para revolucionar la gestión
							bibliotecaria en instituciones educativas.
						</p>
					</div>

					<div>
						<h3 className="font-semibold text-foreground mb-4">Producto</h3>
						<ul className="space-y-2 text-muted-foreground">
							<li>
								<a
									href="#caracteristicas"
									className="hover:text-primary transition-colors"
								>
									Características
								</a>
							</li>
							{/* <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Precios
                </a>
              </li> */}
							<li>
								<a href="/" className="hover:text-primary transition-colors">
									Demo
								</a>
							</li>
							<li>
								<a href="/" className="hover:text-primary transition-colors">
									Soporte
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="font-semibold text-foreground mb-4">Empresa</h3>
						<ul className="space-y-2 text-muted-foreground">
							<li>
								<a href="/" className="hover:text-primary transition-colors">
									Acerca de VIRTEC
								</a>
							</li>
							<li>
								<a href="/" className="hover:text-primary transition-colors">
									Contacto
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} VIRTEC. Todos los derechos reservados.
					</p>
				</div>
			</div>
		</footer>
	);
}
