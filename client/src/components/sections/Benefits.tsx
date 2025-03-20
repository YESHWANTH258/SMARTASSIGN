const Benefits = () => {
  return (
    <section id="benefits" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Benefits for Educators & Students</h2>
          <p className="mt-4 text-xl text-slate-600">Our platform delivers transformative advantages to the entire educational ecosystem.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Teacher using digital technology" 
              className="rounded-lg shadow-xl" 
            />
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3 text-sm">1</span>
                Time-Saving Automation
              </h3>
              <p className="mt-2 text-slate-600 pl-11">Educators save up to 70% of time spent on assignment creation and grading, allowing more focus on teaching and student interaction.</p>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3 text-sm">2</span>
                Personalized Learning
              </h3>
              <p className="mt-2 text-slate-600 pl-11">AI adapts to each student's learning pace and style, creating a customized educational experience that improves engagement and outcomes.</p>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3 text-sm">3</span>
                Data-Driven Insights
              </h3>
              <p className="mt-2 text-slate-600 pl-11">Comprehensive analytics provide visibility into student performance trends, helping educators identify knowledge gaps and intervention opportunities.</p>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 flex items-center">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white mr-3 text-sm">4</span>
                Increased Engagement
              </h3>
              <p className="mt-2 text-slate-600 pl-11">Gamification elements and interactive features make learning more enjoyable, boosting student participation and retention of material.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
