import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 md:py-32 px-4 sm:px-6 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {/* Contact Info */}
          <div className="order-2 md:order-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-8 sm:mb-12">
              Nous contacter
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <div>
                <p className="text-xs sm:text-sm tracking-widest text-neutral-600 mb-2">TÉLÉPHONE</p>
                <p className="text-base sm:text-lg text-neutral-900 font-light">
                  <a href="tel:+212" className="hover:text-neutral-500 transition">+212 [Votre numéro]</a>
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm tracking-widest text-neutral-600 mb-2">EMAIL</p>
                <p className="text-base sm:text-lg text-neutral-900 font-light">
                  <a href="mailto:contact@fisafi.ma" className="hover:text-neutral-500 transition">contact@fisafi.ma</a>
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm tracking-widest text-neutral-600 mb-2">ADRESSE</p>
                <p className="text-base sm:text-lg text-neutral-900 font-light leading-relaxed">
                  [Votre adresse]<br />
                  [Ville], [Code postal]
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 order-1 md:order-2">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Nom complet"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-0 py-3 bg-transparent border-b border-neutral-300 focus:border-neutral-900 outline-none transition font-light placeholder-neutral-400 text-base"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-0 py-3 bg-transparent border-b border-neutral-300 focus:border-neutral-900 outline-none transition font-light placeholder-neutral-400 text-base"
              />
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-neutral-300 focus:border-neutral-900 outline-none transition font-light placeholder-neutral-400 text-base"
              />
            </div>

            <div>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-0 py-3 bg-transparent border-b border-neutral-300 focus:border-neutral-900 outline-none transition font-light text-base"
              >
                <option value="">Sujet</option>
                <option value="engineering">Ingénierie</option>
                <option value="expertise">Expertise & Conseil</option>
                <option value="training">Formation</option>
                <option value="import-export">Import-Export</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <textarea
                name="message"
                placeholder="Message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                required
                className="w-full px-0 py-3 bg-transparent border-b border-neutral-300 focus:border-neutral-900 outline-none transition font-light placeholder-neutral-400 resize-none text-base"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-neutral-900 text-white text-sm sm:text-base tracking-wide hover:bg-neutral-700 active:bg-neutral-800 transition min-h-12 font-medium"
            >
              {submitted ? 'Message envoyé ✓' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
