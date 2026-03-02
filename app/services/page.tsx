import Navbar from "@/components/Navbar";
import Hero from "@/components/services/Hero";
import Process from "@/components/services/Process";
import Specialization from "@/components/services/Specialization";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Process />
      <Specialization />
    </main>
  );
}
