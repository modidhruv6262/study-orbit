import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  LayoutDashboard, 
  Settings, 
  Clock, 
  MessageSquare, 
  LogOut, 
  Flame,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from './Logo';

export const Navbar = ({ activeTab, setActiveTab, onOpenTimer, onOpenChat, streak = 1, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'textbooks', label: 'Courses', icon: BookOpen },
    { id: 'schedule', label: 'Timetable', icon: Calendar },
    { id: 'exams', label: 'Exams', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'SO';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : 'Student';

  return (
    <>
      {/* Top Navbar with Glassmorphism */}
      <header className="top-header">
        <div className="navbar-inner">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer', 
              flexShrink: 0,
              transition: 'transform 0.18s ease'
            }}
            className="brand-logo-btn"
          >
            <Logo size={34} style={{ borderRadius: '10px', filter: 'drop-shadow(0 2px 8px rgba(79, 70, 229, 0.4))' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>
                Study<span style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>Orbit</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }} className="desktop-only">
                AI
              </span>
            </div>
          </div>

          {/* Desktop Center Segmented Navigation */}
          <nav className="desktop-only nav-center-pill">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-pill-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="navbar-actions">
            {/* Daily Streak Counter */}
            <div 
              title={`${streak}-day study streak! Keep the momentum going`}
              className="nav-streak-badge"
              style={{
                background: theme === 'dark' ? 'rgba(234, 88, 12, 0.16)' : 'rgba(254, 215, 170, 0.35)',
                border: theme === 'dark' ? '1px solid rgba(234, 88, 12, 0.4)' : '1px solid rgba(251, 146, 60, 0.4)',
              }}
            >
              <Flame size={15} fill="#ea580c" color="#ea580c" style={{ filter: 'drop-shadow(0 0 4px rgba(234, 88, 12, 0.5))' }} />
              <span style={{ fontWeight: 800 }}>{streak}d</span>
            </div>

            {/* Focus Pomodoro Timer Trigger */}
            <button
              onClick={onOpenTimer}
              className="btn btn-secondary nav-action-btn nav-btn-icon-mobile"
              title="Focus Pomodoro Timer"
              style={{ border: '1px solid var(--border)' }}
            >
              <Clock size={15} color="var(--primary)" />
              <span className="desktop-only">Timer</span>
            </button>

            {/* AI Academic Guide / Chatbot Trigger */}
            <button
              onClick={onOpenChat}
              className="btn btn-primary nav-action-btn nav-btn-icon-mobile"
              title="Study AI Guide"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 2px 10px rgba(79, 70, 229, 0.35)'
              }}
            >
              <Sparkles size={14} />
              <span className="desktop-only">AI Guide</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="nav-icon-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle light/dark theme"
            >
              {theme === 'dark' ? (
                <Sun size={17} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' }} />
              ) : (
                <Moon size={16} color="var(--text-secondary)" />
              )}
            </button>

            {/* User Avatar Chip & Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <div 
                className="nav-user-chip"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title="Account Menu"
              >
                <div className="nav-user-avatar">
                  {getInitials(user?.full_name)}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }} className="desktop-only">
                  {firstName}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" className="desktop-only" />
              </div>

              {/* Profile Menu Popup */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '240px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '8px',
                  zIndex: 50,
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {user?.full_name || 'Student'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email || 'Logged In'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowProfileMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Settings size={15} />
                    <span>Study Preferences & Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutModal(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--danger)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginTop: '2px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '380px', textAlign: 'center', padding: '24px 20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--danger)'
            }}>
              <LogOut size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Confirm Logout
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to log out of <strong>StudyOrbit</strong>? Your current timetable and progress will be securely saved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '9px 16px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="btn btn-danger"
                style={{ flex: 1, padding: '9px 16px', fontSize: '0.85rem' }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="mobile-only mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                height: '100%',
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'color 0.15s ease'
              }}
            >
              <div style={{
                padding: '4px 14px',
                borderRadius: '16px',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
