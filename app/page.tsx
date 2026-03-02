import Navbar from "@/components/Navbar";
import Header from "@/components/Home/Header";
import Services from "@/components/Home/Services";
import Ctablock from "@/components/Home/Ctablock";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Header />
      <Services />
      <Ctablock />
    </main>
  );
}
