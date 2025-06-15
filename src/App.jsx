import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FaGithub, FaInstagram, FaEnvelope } from 'react-icons/fa';
import './App.css';

function App() {
  const [hoveredVenture, setHoveredVenture] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [typingText, setTypingText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [matrixBreak, setMatrixBreak] = useState(true);

  const words = ['Entrepreneur', 'Creative Rebel', 'Visionary Coder', 'Freedom Architect', 'SaaS Builder', 'Investor'];

  // Use react-intersection-observer for better scroll animations
  const [headerRef, headerInView] = useInView({ threshold: 0.1 });
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1 });
  const [venturesRef, venturesInView] = useInView({ threshold: 0.1 });
  const [interestsRef, interestsInView] = useInView({ threshold: 0.1 });
  const [connectRef, connectInView] = useInView({ threshold: 0.1 });
  const [footerRef, footerInView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('section, header, footer').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex];
      let charIndex = 0;

      const typingInterval = setInterval(() => {
        if (charIndex <= currentWord.length) {
          setTypingText(currentWord.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          }, 1000);
        }
      }, 100);

      return () => clearInterval(typingInterval);
    }
  }, [currentWordIndex]);

  useEffect(() => {
    // Matrix break effect
    const timer = setTimeout(() => {
      setMatrixBreak(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {matrixBreak && <div className="matrix-break" />}
      <div className="digital-rain" />
      <motion.div 
        className="business-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <div className="background-glow" />
        
        <motion.header 
          ref={headerRef}
          className={`header ${headerInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: headerInView ? 1 : 0, y: headerInView ? 0 : -20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="tagline matrix-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
          >
            I make my own rules
          </motion.div>
          <div className="profile-container">
            <div className="profile-image">
              <img 
                src="/images/willisempiregroup.png" 
                alt="Willis Empire Group"
                className="profile-photo"
              />
              <div className="profile-overlay">
                <div className="profile-social">
                  <a href="https://instagram.com" className="social-icon glitch">📸</a>
                  <a href="https://github.com/nosobasic" className="social-icon glitch">💻</a>
                  <a href="mailto:donte@binrichmediagroup.com" className="social-icon glitch">✉️</a>
                </div>
              </div>
            </div>
          </div>
          <motion.h1 
            className="name matrix-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.7 }}
          >
            Donte D. Willis
          </motion.h1>
          <motion.p 
            className="title matrix-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.9 }}
          >
            {typingText}
            <span className="cursor">|</span>
          </motion.p>
        </motion.header>

        <motion.section 
          ref={aboutRef}
          className={`section ${aboutInView ? 'visible' : ''}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: aboutInView ? 1 : 0, x: aboutInView ? 0 : -50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">About Me</h2>
          <p>
            Multi-business owner with a vision to live without financial restrictions. From the open road to tech, music,
            and marketing—I build, hustle, and grow. Based in Long Island, NY, I'm all about leveling up mentally, physically, and financially.
          </p>
        </motion.section>

        <motion.section 
          ref={venturesRef}
          className={`section right ${venturesInView ? 'visible' : ''}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: venturesInView ? 1 : 0, x: venturesInView ? 0 : 50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">Ventures</h2>
          <ul className="venture-list">
            {[
              {
                title: 'Bin Rich Entertainment',
                description: 'Independent record label. Full production from studio to streaming. Guitarist, pianist, producer.',
                icon: '🎵',
                video: 'https://www.youtube.com/embed/ASA_M211iVo',
                logo: '/images/binrichlogo.png'
              },
              {
                title: 'Auto Avenue',
                description: 'Dropshipping store selling car accessories. Sleek products for street kings.',
                icon: '🚗'
              },
              {
                title: 'Revenue Ripple',
                description: 'SaaS platform helping entrepreneurs market like pros. Affiliate program, tutorials, expert courses, and more.',
                icon: '💡',
                logo: '/images/revenue_ripple_icon_transparent.png',
                link: 'https://revenueripple.org'
              }
            ].map((venture, index) => (
              <li 
                key={index}
                className="venture-item"
                onMouseEnter={() => setHoveredVenture(index)}
                onMouseLeave={() => setHoveredVenture(null)}
              >
                <div className="venture-header">
                  {venture.logo && (
                    <img 
                      src={venture.logo} 
                      alt={`${venture.title} logo`} 
                      className="venture-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="venture-icon">{venture.icon}</div>
                </div>
                <div className="venture-content">
                  <strong className="venture-title">
                    {venture.link ? (
                      <a 
                        href={venture.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="venture-link"
                      >
                        {venture.title}
                      </a>
                    ) : (
                      venture.title
                    )}
                  </strong>
                  <p className="venture-description">{venture.description}</p>
                  {venture.video && (
                    <div className="video-container">
                      <iframe
                        width="100%"
                        height="315"
                        src={venture.video}
                        title="Dont3eezy ft JonGram - Danger (official music video)"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section 
          ref={interestsRef}
          className={`section ${interestsInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: interestsInView ? 1 : 0, y: interestsInView ? 0 : 50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">What I'm Into</h2>
          <div className="interests-grid">
            <div className="interest-item">💼 Business</div>
            <div className="interest-item">🏠 Real Estate</div>
            <div className="interest-item">📈 Investing</div>
            <div className="interest-item">💻 Tech</div>
            <div className="interest-item">💪 Working Out</div>
            <div className="interest-item">🧘‍♂️ Meditation</div>
            <div className="interest-item">📚 Reading</div>
            <div className="interest-item">🎯 Growth</div>
          </div>
        </motion.section>

        <motion.section 
          ref={connectRef}
          className={`section up connect-section ${connectInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: connectInView ? 1 : 0, y: connectInView ? 0 : 50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">Let's Connect</h2>
          <div className="contact-grid">
            {[
              { label: 'Email', href: 'mailto:donte@binrichmediagroup.com', text: 'donte@binrichmediagroup.com', icon: '✉️' },
              { label: 'IG', href: 'https://instagram.com', text: '@tzbinrich', icon: '📸' },
              { label: 'GitHub', href: 'https://github.com/nosobasic', text: 'github.com/nosobasic', icon: '💻' }
            ].map((contact, index) => (
              <div key={index} className="contact-item">
                <span className="contact-icon">{contact.icon}</span>
                <div className="contact-info">
                  <strong className="venture-title">{contact.label}</strong>
                  <a href={contact.href} className="contact-link">{contact.text}</a>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.footer 
          ref={footerRef}
          className={`footer ${footerInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: footerInView ? 1 : 0, y: footerInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <p>&copy; {new Date().getFullYear()} Donte D. Willis. All rights reserved.</p>
        </motion.footer>
      </motion.div>
    </>
  );
}

export default App;