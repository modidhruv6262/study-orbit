import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Shield, Sparkles } from 'lucide-react';

export const AuthLoadingScreen = ({ 
  isRegister = false, 
  title, 
  subtitle, 
  inline = false 
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = isRegister
    ? [
        'Creating your student account...',
        'Allocating study database space...',
        'Preparing course textbooks & syllabus engines...',
        'Welcome aboard! Launching StudyOrbit...'
      ]
    : [
        'Authenticating your credentials...',
        'Connecting securely to study database...',
        'Synchronizing exam targets & daily timetable...',
        'Ready! Opening your study dashboard...'
      ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepIndex(1), 600);
    const timer2 = setTimeout(() => setStepIndex(2), 1500);
    const timer3 = setTimeout(() => setStepIndex(3), 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const content = (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
        width: '100%',
        padding: inline ? '16px 0 8px' : '0'
      }}
    >
      {/* Animated Brand Emblem with Orbiting Ring */}
      <div style={{ position: 'relative', width: '76px', height: '76px', margin: '0 auto' }}>
        {/* Outer glowing pulsing ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #38bdf8 100%)',
            opacity: 0.22,
            filter: 'blur(8px)',
          }}
        />

        {/* Orbiting celestial planet */}
        <div
          className="animate-orbit"
          style={{
            position: 'absolute',
            inset: '-10px',
            borderRadius: '50%',
          }}
        >
          <div
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8, 0 0 16px #38bdf8',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          />
        </div>

        <Logo size={76} style={{ borderRadius: '20px' }} />
      </div>

      {/* Text Header */}
      <div>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}
        >
          {title || (isRegister ? 'Creating Your Account' : 'Signing You In')}
        </h3>
        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            maxWidth: '320px',
            margin: '0 auto'
          }}
        >
          {subtitle || 'Connecting securely to your StudyOrbit academic workspace'}
        </p>
      </div>

      {/* Sleek Animated Progress Bar */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-card-subtle)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            className="skeleton-shimmer"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, var(--primary) 0%, #38bdf8 50%, var(--primary) 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Real-time status ticker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Sparkles size={12} color="var(--primary)" className="animate-spin" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
            {steps[stepIndex]}
          </span>
        </div>
      </div>

      {/* Security / Quality Tag */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}
      >
        <Shield size={12} color="var(--success)" />
        <span>Encrypted Transport & Secure Token Storage</span>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  // Full-page in-page view (NO modal popup, NO fixed overlay, purely in the page flow)
  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-main)'
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px 28px',
          borderRadius: '20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
