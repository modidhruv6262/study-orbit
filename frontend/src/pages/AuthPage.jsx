import React, { useState } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const AuthPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: 'var(--bg-main)',
      position: 'relative'
    }}>
      {/* Top Corner Theme Switcher */}
      <button
        onClick={toggleTheme}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          gap: '6px'
        }}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '36px 28px',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 18px var(--primary-glow)'
          }}>
            <GraduationCap size={30} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Study<span style={{ color: 'var(--primary)' }}>Orbit</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Adaptive Coursework Scheduler & Academic Guide
          </p>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card-subtle)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !isRegister ? 'var(--bg-card)' : 'transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: !isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isRegister ? 'var(--bg-card)' : 'transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.8rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Student Email
            </label>
            <input
              type="email"
              required
              placeholder="student@example.com"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
          >
            <span>{submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
