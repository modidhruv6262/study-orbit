import React from 'react';
import { Sparkles } from 'lucide-react';

export const SectionLoader = ({ 
  message = 'Loading data from database...', 
  subtitle = 'Syncing your study records...', 
  type = 'cards',
  minHeight = '240px' 
}) => {
  return (
    <div 
      className="animate-fade-in" 
      style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        minHeight
      }}
    >
      {/* Central Spinner & Status Badge */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '24px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center',
          gap: '12px'
        }}
      >
        {/* Orbital Spinner with Glowing Core */}
        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
          {/* Outer glowing track */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid var(--primary-light)',
            }} 
          />
          {/* Spinning primary gradient arc */}
          <div 
            className="animate-spin"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'var(--primary)',
              borderRightColor: 'var(--primary)',
              boxShadow: '0 0 12px var(--primary-glow)',
            }} 
          />
          {/* Orbiting Satellite Dot */}
          <div 
            className="animate-orbit"
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '50%',
            }}
          >
            <div 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--secondary, #38bdf8)',
                boxShadow: '0 0 8px var(--secondary, #38bdf8)',
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)'
              }} 
            />
          </div>
          {/* Center pulsating star/sparkle */}
          <div 
            className="animate-pulse-glow"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Sparkles size={16} />
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
            {message}
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Shimmering Skeleton Mockups to prevent layout jumping */}
      {type === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          width: '100%'
        }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-shimmer" style={{ width: '45%', height: '16px' }} />
                <div className="skeleton-shimmer" style={{ width: '22%', height: '14px', borderRadius: '12px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '75%', height: '12px' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <div className="skeleton-shimmer" style={{ width: '50px', height: '24px', borderRadius: '6px' }} />
                <div className="skeleton-shimmer" style={{ width: '70px', height: '24px', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {[1, 2].map((n) => (
            <div key={n} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-shimmer" style={{ width: '140px', height: '16px' }} />
                <div className="skeleton-shimmer" style={{ width: '90px', height: '14px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
              <div className="skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      )}

      {type === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="glass-card" style={{ padding: '18px', height: '90px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="skeleton-shimmer" style={{ width: '40%', height: '12px' }} />
                <div className="skeleton-shimmer" style={{ width: '60%', height: '24px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px', height: '220px' }}>
              <div className="skeleton-shimmer" style={{ width: '50%', height: '18px', marginBottom: '14px' }} />
              <div className="skeleton-shimmer" style={{ width: '100%', height: '130px', borderRadius: '12px' }} />
            </div>
            <div className="glass-card" style={{ padding: '20px', height: '220px' }}>
              <div className="skeleton-shimmer" style={{ width: '50%', height: '18px', marginBottom: '14px' }} />
              <div className="skeleton-shimmer" style={{ width: '100%', height: '130px', borderRadius: '12px' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionLoader;
