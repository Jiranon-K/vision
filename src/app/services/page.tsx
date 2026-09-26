import Navbar from "@/shared/layout/navbar";
import Hero from "@/components/services/Hero";
import Process from "@/components/services/Process";
import Specialization from "@/components/services/Specialization";
import Footer from "@/shared/layout/footer";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Process />
      <Specialization />
      <Footer />
    </main>
  );
}
