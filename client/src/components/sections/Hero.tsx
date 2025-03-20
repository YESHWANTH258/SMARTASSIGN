import { Button } from "@/components/ui/button";

interface HeroProps {
  scrollToSection: (id: string) => void;
}

const Hero = ({ scrollToSection }: HeroProps) => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
              <span className="text-primary">AI-Powered</span> Assignment Management System
            </h1>
            <p className="mt-4 text-lg md:text-xl text-slate-600 leading-relaxed">
              Transform how educators create, distribute, and grade assignments with our intelligent platform that saves time and improves learning outcomes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => scrollToSection('waitlist')}
                className="bg-emerald-500 hover:bg-emerald-600 px-6 py-6 h-auto text-base"
              >
                Join Waitlist
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
              <Button 
                onClick={() => scrollToSection('features')}
                variant="outline" 
                className="px-6 py-6 h-auto text-base"
              >
                Explore Features
              </Button>
            </div>
          </div>
          <div className="mt-10 md:mt-0 md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Students using digital education technology" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
