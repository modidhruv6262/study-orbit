import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Shield, Sparkles } from 'lucide-react';

export const AuthLoadingScreen = ({ isRegister = false, title, subtitle }) => {
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
    const timer1 = setTimeout(() => setStepIndex(1), 700);
    const timer2 = setTimeout(() => setStepIndex(2), 1700);
    const timer3 = setTimeout(() => setStepIndex(3), 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-card animate-pulse-glow"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '36px 28px',
          borderRadius: '24px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 35px var(--primary-glow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        {/* Animated Brand Emblem with Orbiting Ring */}
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
          {/* Outer glowing pulsing ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #38bdf8 100%)',
              opacity: 0.25,
              filter: 'blur(10px)',
            }}
          />

          {/* Orbiting celestial planet */}
          <div
            className="animate-orbit"
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 12px #38bdf8, 0 0 20px #38bdf8',
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>

          <Logo size={80} style={{ borderRadius: '22px' }} />
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
              lineHeight: 1.4
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
    </div>
  );
};

export default AuthLoadingScreen;
