import Navbar from "@/shared/layout/navbar";
import { PricingHero as Hero } from "@/features/marketing";
import Footer from "@/shared/layout/footer";

const PricingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Footer />
    </>
  );
};

export default PricingPage;
