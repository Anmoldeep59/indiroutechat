import { CallToAction } from "@/components/CallToAction";
import { FestivalRibbon } from "@/components/FestivalRibbon";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { IndiaShopStrip } from "@/components/IndiaShopStrip";
import { JourneyStrip } from "@/components/JourneyStrip";
import { Pricing } from "@/components/Pricing";
import { Services } from "@/components/Services";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { TrustRow } from "@/components/TrustRow";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustRow />
        <HowItWorks />
        <JourneyStrip />
        <Services />
        <IndiaShopStrip />
        <ShippingCalculator />
        <FestivalRibbon />
        <Pricing />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
