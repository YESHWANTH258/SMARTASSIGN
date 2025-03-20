const testimonials = [
  {
    content: "EduAI has completely transformed how I create and grade assignments. What used to take hours now takes minutes, and the quality of questions is impressive.",
    author: "Dr. Sarah Johnson",
    role: "Professor, Computer Science",
    rating: 5
  },
  {
    content: "The 24/7 AI assistant is a game-changer. Being able to get instant answers to my questions at any time has significantly improved my understanding of difficult concepts.",
    author: "Michael Chen",
    role: "Engineering Student",
    rating: 5
  },
  {
    content: "As a department head, I've seen improved student outcomes and instructor satisfaction across the board. The analytics provide invaluable insights for curriculum development.",
    author: "Prof. David Wilson",
    role: "Department Chair, Mathematics",
    rating: 4.5
  }
];

const Testimonials = () => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="ri-star-fill"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="ri-star-half-fill"></i>);
    }
    
    return stars;
  };

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800">What Early Testers Are Saying</h2>
          <p className="mt-4 text-xl text-slate-600">Our beta users are already experiencing the transformative power of EduAI.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <div className="flex items-center mb-4">
                <div className="text-amber-400 flex">
                  {renderStars(testimonial.rating)}
                </div>
              </div>
              <p className="text-slate-600 italic">"{testimonial.content}"</p>
              <div className="mt-6 flex items-center">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-slate-500"></i>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-slate-800">{testimonial.author}</h4>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
