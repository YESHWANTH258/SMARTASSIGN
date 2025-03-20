import { useRef, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Benefits from "@/components/sections/Benefits";
import Testimonials from "@/components/sections/Testimonials";
import WaitlistForm from "@/components/sections/WaitlistForm";

const Landing = () => {
  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero scrollToSection={scrollToSection} />
      <Features />
      <Benefits />
      <Testimonials />
      <WaitlistForm />
      <Footer />
    </div>
  );
};

export default Landing;
