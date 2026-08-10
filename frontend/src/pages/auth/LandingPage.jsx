import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';
import './LandingPage.css';

const FloatingElement = ({ delay, duration, x, y, emoji }) => (
  <motion.div
    className="floating-element"
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0.4, 0.6, 0.4],
      y: [0, -30, 0],
      x: [0, 15, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
    style={{ left: x, top: y }}
  >
    {emoji}
  </motion.div>
);

const MilkSplashPlaceholder = () => (
  <div style={{ 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(212, 165, 116, 0.1) 100%)',
    borderRadius: '24px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '6rem', marginBottom: '16px' }}>🥛</div>
      <p style={{ color: '#2D5F3F', fontWeight: 600 }}>Fresh Milk Daily</p>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="landing-page">
      <Navigation isAuthenticated={false} />

      <section className="hero-section">
        <div className="hero-background">
          <svg className="animated-blob" viewBox="0 0 200 200">
            <defs>
              <filter id="gooey">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
              </filter>
            </defs>
            <circle cx="100" cy="100" r="60" fill="rgba(76, 175, 80, 0.08)" filter="url(#gooey)" />
          </svg>

          <FloatingElement delay={0} duration={8} x="10%" y="20%" emoji="🌾" />
          <FloatingElement delay={1} duration={9} x="80%" y="30%" emoji="🥛" />
          <FloatingElement delay={2} duration={10} x="70%" y="70%" emoji="🌱" />
          <FloatingElement delay={0.5} duration={11} x="15%" y="75%" emoji="🌿" />
        </div>

        <div className="hero-container">
          <motion.div
            className="hero-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={itemVariants} className="hero-title">
              Pure Milk, <span className="accent-text">Trusted Source</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="hero-subtitle">
              Farm-to-table excellence. Real taste. Real quality. Get fresh, premium milk delivered to your doorstep every morning.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="hero-buttons"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
              >
                Start Ordering
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/login')}
              >
                Learn More
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="hero-trust">
              <div className="trust-badge">✓ Farm Certified</div>
              <div className="trust-badge">✓ 10+ Years</div>
              <div className="trust-badge">✓ 5,000+ Happy Customers</div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-3d-container"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <MilkSplashPlaceholder />
          </motion.div>
        </div>
      </section>

      <section id="about" className="features-section">
        <motion.div
          className="features-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Why Choose RaithuPalu?
          </motion.h2>

          <div className="features-grid">
            {[
              {
                icon: '🥛',
                title: 'Farm Fresh Daily',
                desc: 'Direct from our certified farms to your table in hours, not days.',
              },
              {
                icon: '🌱',
                title: 'Organic & Natural',
                desc: 'No antibiotics, hormones, or additives. Pure, natural goodness.',
              },
              {
                icon: '📦',
                title: 'Easy Ordering',
                desc: 'Simple subscription model. Pause or adjust anytime, no hassle.',
              },
              {
                icon: '💚',
                title: 'Community Trust',
                desc: 'Trusted by 5,000+ families. Consistent 4.9★ rating.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="products" className="cta-section">
        <motion.div
          className="cta-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2 className="cta-title">
            Ready for Fresh, Premium Milk?
          </motion.h2>
          <p className="cta-subtitle">
            Join thousands of satisfied customers. First order gets 20% discount!
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
          >
            Get Started Today
          </Button>
        </motion.div>
      </section>

      <section id="contact" className="features-section" style={{ background: '#FEFDFB' }}>
        <motion.div
          className="features-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Contact Us
          </motion.h2>
          <div className="features-grid">
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon">📧</div>
              <h3 className="feature-title">Email</h3>
              <p className="feature-desc">raithupalu</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon">📞</div>
              <h3 className="feature-title">Phone</h3>
              <p className="feature-desc">+91 9441609701</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon">📍</div>
              <h3 className="feature-title">Location</h3>
              <p className="feature-desc">DHONE</p>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>RaithuPalu</h4>
            <p>Premium farm-to-table dairy solutions for modern families.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#products">Products</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: </p>
            <p>Phone: +91 9441609701</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 RaithuPalu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;