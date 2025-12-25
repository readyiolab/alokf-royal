import HeroSection from "@/components/casino/HeroSection";
import AboutSection from "@/components/casino/AboutSection";
import OfferSection from "@/components/casino/OfferSection";
import FeaturesSection from "@/components/casino/FeaturesSection";
import ResponsiblePlaySection from "@/components/casino/ResponsiblePlaySection";
import Footer from "@/components/casino/Footer";
import GamesSection from "@/components/casino/GamesSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <AboutSection />
      <OfferSection />
      <GamesSection/>
      <FeaturesSection />
      <ResponsiblePlaySection />
      <Footer />
    </main>
  );
};

export default Index;
