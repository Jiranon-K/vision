import Navbar from "@/components/Navbar";
import Header from "@/components/Home/Header";
import Services from "@/components/Home/Services";
import Ctablock from "@/components/Home/Ctablock";
import AnimationProvider from "@/components/AnimationProvider";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <AnimationProvider>
        <Navbar />
        <Header />
        <Services />
        <Ctablock />
      </AnimationProvider>
    </main>
  );
}
