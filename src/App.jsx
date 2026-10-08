import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './App.css';
import RoadmapTimeline from './components/RoadmapTimeline';
import { ROADMAP_URL } from './data/roadmapProgress';

function DeferredVideo(props) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  return <iframe {...props} ref={ref} src={inView ? props.src : undefined} />;
}

const words = ['Entrepreneur', 'Creative Rebel', 'Visionary Coder', 'Freedom Architect', 'SaaS Builder', 'Investor'];

function App() {
  const [typingText, setTypingText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [matrixBreak, setMatrixBreak] = useState(true);


  const [headerRef, headerInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [venturesRef, venturesInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [interestsRef, interestsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [connectRef, connectInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [footerRef, footerInView] = useInView({ threshold: 0.1, triggerOnce: true });


  useEffect(() => {
    if (currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex];
      let charIndex = 0;
      let nextWordTimeout;

      const typingInterval = setInterval(() => {
        if (charIndex <= currentWord.length) {
          setTypingText(currentWord.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          nextWordTimeout = setTimeout(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          }, 1000);
        }
      }, 100);

      return () => {
        clearInterval(typingInterval);
        clearTimeout(nextWordTimeout);
      };
    }
  }, [currentWordIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMatrixBreak(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {matrixBreak && <div className="matrix-break" />}
      <div className="digital-rain" />
      <Motion.div
        className="business-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="background-glow" />
        
        <Motion.header
          ref={headerRef}
          className={`header ${headerInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: headerInView ? 1 : 0, y: headerInView ? 0 : -20 }}
          transition={{ duration: 0.5 }}
        >
          <Motion.div
            className="tagline matrix-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            I make my own rules
          </Motion.div>
          <div className="profile-container">
            <div className="profile-image">
              <img 
                src="/images/willisempiregroup-400.png"
                alt="Willis Empire Group"
                fetchPriority="high"
                decoding="async"
                className="profile-photo"
              />
              <div className="profile-overlay">
                <div className="profile-social">
                  <a href="https://instagram.com/tzbinrich" className="social-icon glitch">📸</a>
                  <a href="https://github.com/nosobasic" className="social-icon glitch">💻</a>
                  <a href="mailto:donte@binrichmediagroup.com" className="social-icon glitch">✉️</a>
                </div>
              </div>
            </div>
          </div>
          <Motion.h1
            className="name matrix-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Donte D. Willis
          </Motion.h1>
          <Motion.p
            className="title matrix-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {typingText}
            <span className="cursor">|</span>
          </Motion.p>
          <Motion.a
            href={ROADMAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="download-button header-roadmap-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Cloud Engineering Roadmap
          </Motion.a>
          <RoadmapTimeline />
        </Motion.header>


        <Motion.section
          ref={aboutRef}
          className={`section ${aboutInView ? 'visible' : ''}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: aboutInView ? 1 : 0, x: aboutInView ? 0 : -50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">About Me</h2>
          <p>
            Multi-business owner and cloud engineer with a vision to live without financial restrictions. 
            I leverage cutting-edge tech skills to build scalable ventures—from SaaS platforms to AI-powered solutions. 
            Based in Long Island, NY, I'm all about leveling up mentally, physically, and financially while creating products that make a real impact.
          </p>
        </Motion.section>

        <Motion.section
          className={`section certifications-section ${aboutInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: aboutInView ? 1 : 0, y: aboutInView ? 0 : 50 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2 className="section-title matrix-text">🏆 Certifications</h2>
          <div className="certifications-grid">
            <div className="certification-badge">
              <img 
                src="/images/aws-saa-badge.png" 
                alt="AWS Solutions Architect Associate Badge"
                className="badge-image"
                loading="lazy"
                decoding="async"
              />
              <h3 className="badge-title">AWS Solutions Architect</h3>
              <p className="badge-subtitle">Associate</p>
            </div>
            <div className="certification-badge">
              <img 
                src="/images/terraform-associate-badge.svg" 
                alt="HashiCorp Terraform Associate Badge"
                className="badge-image"
                loading="lazy"
                decoding="async"
              />
              <h3 className="badge-title">HashiCorp Terraform</h3>
              <p className="badge-subtitle">Associate</p>
            </div>
          </div>
        </Motion.section>

        <Motion.section
          ref={venturesRef}
          className={`section building-section ${venturesInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: venturesInView ? 1 : 0, y: venturesInView ? 0 : 50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">What I'm Building</h2>
          
          {/* Tech Ventures Category */}
          <div className="category-section">
            <h3 className="category-header">💻 Tech Ventures</h3>
            <div className="venture-category-grid">
              <div className="venture-item-compact">
                <div className="venture-compact-header">
                  <img 
                    src="/images/revenue_ripple_icon_transparent.png" 
                    alt="Revenue Ripple logo" 
                    className="venture-logo-small"
                  />
                  <a 
                    href="https://revenueripple.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="venture-link-compact"
                  >
                    <strong>Revenue Ripple</strong>
                  </a>
                </div>
                <p className="venture-description-compact">
                  SaaS platform empowering entrepreneurs with marketing tools, affiliate programs, and expert courses.
                </p>
              </div>
              
              <div className="venture-item-compact">
                <div className="venture-compact-header">
                  <span className="venture-icon-small">👕</span>
                  <a 
                    href="https://bingone.co" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="venture-link-compact"
                  >
                    <strong>BinGone</strong>
                  </a>
                </div>
                <p className="venture-description-compact">
                  Online platform connecting clothing donors with people in need, making charitable giving simple and impactful.
                </p>
              </div>
            </div>
          </div>

          {/* Creative Work Category */}
          <div className="category-section">
            <h3 className="category-header">🎵 Creative Work</h3>
            <div className="venture-item-featured">
              <div className="venture-featured-header">
                <img 
                  src="/images/binrichlogo.png" 
                  alt="Bin Rich Entertainment logo" 
                  className="venture-logo-featured"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <strong className="venture-title-featured">Bin Rich Entertainment</strong>
                  <p className="venture-description-compact">
                    Independent record label offering full production from studio to streaming. Guitarist, pianist, and producer.
                  </p>
                </div>
              </div>
              <div className="video-container">
                <DeferredVideo
                  width="100%"
                  height="315"
                  src="https://www.youtube.com/embed/ASA_M211iVo"
                  title="Dont3eezy ft JonGram - Danger (official music video)"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* AI & Cloud Innovation Category */}
          <div className="category-section">
            <h3 className="category-header">🤖 AI & Cloud Innovation</h3>
            <p className="category-intro">
              Helping businesses harness AI to transform operations and unlock new possibilities.
            </p>
            <div className="video-container">
              <DeferredVideo
                width="100%"
                height="315"
                src="https://www.youtube.com/embed/bfyNJSiqTmA"
                title="Upcoming AI Projects & Business Applications"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="ebook-cta">
              <h4 className="ebook-title-compact">🎯 Free Context Engineering Ebook</h4>
              <p className="ebook-description-compact">
                Master the art of context engineering and unlock your full potential.
              </p>
              <a 
                href="/images/downloads/context-engineering-ebook.pdf" 
                download="Context-Engineering-Ebook.pdf"
                className="download-button-compact"
              >
                📥 Download Free
              </a>
            </div>
          </div>
        </Motion.section>

        <Motion.section
          ref={interestsRef}
          className={`section interests-simplified ${interestsInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: interestsInView ? 1 : 0, y: interestsInView ? 0 : 50 }}
          transition={{ duration: 0.5 }}
        >
          <p className="interests-statement">
            When I'm not building: Real estate investing, fitness, meditation, and continuous growth 🎯
          </p>
        </Motion.section>

        <Motion.section
          ref={connectRef}
          className={`section up connect-section ${connectInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: connectInView ? 1 : 0, y: connectInView ? 0 : 50 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title matrix-text">Let's Connect</h2>
          <div className="contact-grid">
            {[
              { label: 'Email', href: 'mailto:nosobasic@duck.com', text: 'nosobasic@duck.com', icon: '✉️' },
              { label: 'IG', href: 'https://instagram.com/tzbinrich', text: '@tzbinrich', icon: '📸' },
              { label: 'GitHub', href: 'https://github.com/nosobasic', text: 'github.com/nosobasic', icon: '💻' },
              { label: 'Substack', href: 'https://nosobasic.substack.com', text: 'nosobasic.substack.com', icon: '📝' }
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
        </Motion.section>

        <Motion.footer
          ref={footerRef}
          className={`footer ${footerInView ? 'visible' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: footerInView ? 1 : 0, y: footerInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <p>&copy; {new Date().getFullYear()} Donte D. Willis. All rights reserved.</p>
        </Motion.footer>
      </Motion.div>
    </>
  );
}

export default App;