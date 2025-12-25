import { useInView } from "@/hooks/useInView";
import { useState } from "react";

const ResponsiblePlaySection = () => {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Responsible Play Section */}
      <section id="responsible" className="py-16 relative overflow-hidden" ref={ref}>
        <div className="absolute inset-0 bg-gradient-to-b from-casino-dark to-casino-darker" />

        <div className="container mx-auto px-4 relative z-10">
          <div className={`max-w-2xl mx-auto text-center transition-all duration-1000 ${isInView ? 'opacity-100' : 'opacity-0'}`}>
            {/* Fading cards silhouette */}
            <div className="flex justify-center mb-8 opacity-30">
              <div className="flex -space-x-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-18 bg-gradient-to-b from-muted to-transparent rounded-lg transform"
                    style={{
                      transform: `rotate(${(i - 2) * 10}deg)`,
                      opacity: 1 - Math.abs(i - 2) * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-8 border border-border/30">
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                Play Responsibly
              </h3>
              
              <p className="text-muted-foreground mb-4">
                Gambling should be entertaining and enjoyable. Set limits, take breaks, 
                and never chase losses. If you feel you may have a problem, seek help.
              </p>

              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-6 py-3">
                <span className="text-2xl font-bold text-primary">18+</span>
                <span className="text-muted-foreground">Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 relative overflow-hidden bg-gradient-to-b from-casino-darker to-casino-dark">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Side - Info */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-10 text-casino-dark relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-300 to-transparent rounded-full transform translate-x-20 -translate-y-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400 to-transparent rounded-full transform -translate-x-10 translate-y-10" />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-4xl font-display font-bold mb-4">GET IN TOUCH</h2>
                <p className="text-lg mb-8 opacity-90">
                  We'd love to hear from you. Whether you have questions, feedback, or partnership inquiries, our team is here to assist.
                </p>
                
                <div className="flex gap-4">
                  <button className="w-12 h-12 bg-casino-dark/20 hover:bg-casino-dark/30 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button className="w-12 h-12 bg-casino-dark/20 hover:bg-casino-dark/30 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="glass rounded-2xl p-8 border border-border/30">
              <h3 className="text-3xl font-display font-bold text-yellow-500 mb-6">SEND A MESSAGE</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      First Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full bg-casino-dark/50 border-b border-border/50 focus:border-primary px-2 py-2 text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Last Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full bg-casino-dark/50 border-b border-border/50 focus:border-primary px-2 py-2 text-foreground outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Email Address <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-casino-dark/50 border-b border-border/50 focus:border-primary px-2 py-2 text-foreground outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Phone Number <span className="text-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="081234 56789"
                      className="w-full bg-casino-dark/50 border-b border-border/50 focus:border-primary px-2 py-2 text-foreground outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter your message..."
                    className="w-full bg-casino-dark/50 border-b border-border/50 focus:border-primary px-2 py-2 text-foreground outline-none transition-colors resize-none"
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.message.length} / 500
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-casino-dark font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResponsiblePlaySection;
