const featuresData = [
  {
    icon: "ri-dashboard-line",
    title: "Home Dashboard",
    description: "Personalized dashboard with quick actions, progress tracking, and important notifications.",
    benefits: [
      "Quick access to assignments and materials",
      "Performance insights and analytics",
      "Real-time notifications for deadlines"
    ],
    image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    bgColor: "bg-blue-100",
    iconColor: "text-primary"
  },
  {
    icon: "ri-file-list-3-line",
    title: "Assignment Generation",
    description: "AI-powered system that helps educators create customized assignments from study materials.",
    benefits: [
      "Upload study materials for AI analysis",
      "Customize assignment types (MCQs, essays)",
      "AI-generated questions with easy editing"
    ],
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    bgColor: "bg-green-100",
    iconColor: "text-emerald-500"
  },
  {
    icon: "ri-award-line",
    title: "AI-Powered Quiz Contests",
    description: "Engage students with adaptive quizzes that adjust difficulty based on performance.",
    benefits: [
      "Topic-specific quiz generation",
      "Gamification with leaderboards and badges",
      "Instant scoring and detailed feedback"
    ],
    image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-500"
  },
  {
    icon: "ri-upload-2-line",
    title: "Assignment Submission & Evaluation",
    description: "Streamlined submission process with AI-powered grading and feedback.",
    benefits: [
      "Multiple submission formats supported",
      "Automated grading with AI assessment",
      "Optional teacher review and override"
    ],
    image: "https://images.unsplash.com/photo-1488751045188-3c55bbf9a3fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    bgColor: "bg-blue-100",
    iconColor: "text-primary"
  },
  {
    icon: "ri-questionnaire-line",
    title: "AI Query Handler",
    description: "24/7 AI-powered assistant that answers student questions and provides support.",
    benefits: [
      "Intelligent chatbot for personalized help",
      "Context-aware explanations from materials",
      "Voice and text input support"
    ],
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    bgColor: "bg-green-100",
    iconColor: "text-emerald-500"
  },
  {
    icon: "ri-user-settings-line",
    title: "User Profiles & Settings",
    description: "Customized dashboards for both educators and students with powerful management tools.",
    benefits: [
      "Role-specific dashboards and features",
      "Comprehensive progress tracking",
      "Customizable permission settings"
    ],
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-500"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Powerful Features for Educators & Students</h2>
          <p className="mt-4 text-xl text-slate-600">Our platform offers innovative tools designed to transform the educational experience.</p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden border border-slate-100 flex flex-col">
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <i className={`${feature.icon} text-2xl ${feature.iconColor}`}></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.description}</p>
                <ul className="mt-4 space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <i className="ri-check-line text-emerald-500 mt-1 mr-2"></i>
                      <span className="text-slate-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto p-5 bg-slate-50 border-t border-slate-100">
                <div className="text-center">
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className="h-48 rounded-lg object-cover w-full shadow-sm" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
