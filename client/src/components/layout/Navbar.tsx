import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <i className="ri-brain-line text-primary text-3xl mr-2"></i>
              <span className="font-bold text-xl text-slate-800">EduAI</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-slate-600 hover:text-primary transition px-3 py-2 text-sm font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('benefits')}
              className="text-slate-600 hover:text-primary transition px-3 py-2 text-sm font-medium"
            >
              Benefits
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-slate-600 hover:text-primary transition px-3 py-2 text-sm font-medium"
            >
              Testimonials
            </button>
            <Button 
              onClick={() => scrollToSection('waitlist')}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Join Waitlist
            </Button>
          </div>
          
          <div className="flex items-center md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <i className="ri-menu-line text-xl"></i>
                  <span className="sr-only">Open main menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <div className="flex flex-col mt-6 space-y-4">
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-slate-600 hover:text-primary px-3 py-2 text-sm font-medium text-left"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection('benefits')}
                    className="text-slate-600 hover:text-primary px-3 py-2 text-sm font-medium text-left"
                  >
                    Benefits
                  </button>
                  <button 
                    onClick={() => scrollToSection('testimonials')}
                    className="text-slate-600 hover:text-primary px-3 py-2 text-sm font-medium text-left"
                  >
                    Testimonials
                  </button>
                  <Button 
                    onClick={() => scrollToSection('waitlist')}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full"
                  >
                    Join Waitlist
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
