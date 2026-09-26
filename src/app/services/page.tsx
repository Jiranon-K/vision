import Navbar from "@/shared/layout/navbar";
import { ServicesHero as Hero, Process, Specialization } from "@/features/marketing";
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
