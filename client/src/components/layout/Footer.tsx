import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center">
              <i className="ri-brain-line text-emerald-500 text-3xl mr-2"></i>
              <span className="font-bold text-xl">EduAI</span>
            </div>
            <p className="mt-2 text-slate-400">Transforming education with the power of artificial intelligence.</p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition">
                <i className="ri-linkedin-box-fill text-xl"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition">
                <i className="ri-facebook-box-fill text-xl"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-slate-400 hover:text-white transition">Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Roadmap</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Beta Program</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Tutorials</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} EduAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
