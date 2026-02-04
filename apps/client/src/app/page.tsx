'use client';
import { FeaturesSection } from '@/organisms/features-section';
import { Footer } from '@/organisms/footer';
import { HeroSection } from '@/organisms/hero-section';
import { Navbar } from '@/organisms/navbar';
import { StatsSection } from '@/organisms/stats-section';
import { UIConfigProvider } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function Home() {
	const router = useRouter();
	return (
		<UIConfigProvider
			value={{
				navigate: (to, options) => {
					if (options?.isExternal) {
						window.location.href = to;
					} else {
						if (options?.replace) {
							router.replace(to);
							return;
						}
						router.push(to);
					}
				},
			}}
		>
			<div className="min-h-screen">
				<Navbar />
				<main>
					<HeroSection />
					<FeaturesSection />
					<StatsSection />
				</main>
				<Footer />
			</div>
		</UIConfigProvider>
	);
}
