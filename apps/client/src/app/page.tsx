'use client';
import { FeaturesSection } from '@/organisms/features-section';
import { Footer } from '@/organisms/footer';
import { HeroSection } from '@/organisms/hero-section';
import { Navbar } from '@/organisms/navbar';
import { StatsSection } from '@/organisms/stats-section';

export default function Home() {
	return (
		<div className="min-h-screen">
			<Navbar />
			<main>
				<HeroSection />
				<FeaturesSection />
				<StatsSection />
			</main>
			<Footer />
		</div>
	);
}
