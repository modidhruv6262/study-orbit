import React, { useState } from 'react';
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
  Moon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from './Logo';

export const Navbar = ({ activeTab, setActiveTab, onOpenTimer, onOpenChat, streak = 1, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'textbooks', label: 'Courses', icon: BookOpen },
    { id: 'schedule', label: 'Timetable', icon: Calendar },
    { id: 'exams', label: 'Exams', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}>
        <div className="navbar-inner">
          {/* Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
          >
            <Logo size={32} style={{ borderRadius: '8px', filter: 'drop-shadow(0 2px 6px rgba(79, 70, 229, 0.35))' }} />
            <div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                Study<span style={{ color: 'var(--primary)' }}>Orbit</span>
              </span>
            </div>
          </div>

          {/* Desktop Center Nav */}
          <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions">
            {/* Streak Badge */}
            <div 
              title="Daily Study Streak"
              className="nav-streak-badge"
              style={{
                background: theme === 'dark' ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
                border: theme === 'dark' ? '1px solid rgba(234, 88, 12, 0.35)' : '1px solid #fed7aa',
              }}
            >
              <Flame size={14} fill="#ea580c" color="#ea580c" />
              <span>{streak}d</span>
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost nav-icon-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle light/dark theme"
            >
              {theme === 'dark' ? (
                <Sun size={17} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))' }} />
              ) : (
                <Moon size={17} color="var(--text-secondary)" />
              )}
            </button>

            {/* Focus Timer Trigger */}
            <button
              onClick={onOpenTimer}
              className="btn btn-secondary nav-action-btn nav-btn-icon-mobile"
              title="Focus Timer"
            >
              <Clock size={15} color="var(--primary)" />
              <span className="desktop-only">Timer</span>
            </button>

            {/* AI Chatbot Trigger */}
            <button
              onClick={onOpenChat}
              className="btn btn-primary nav-action-btn nav-btn-icon-mobile"
              title="Study Chatbot"
            >
              <MessageSquare size={15} />
              <span className="desktop-only">Chatbot</span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="btn btn-ghost nav-icon-btn"
              title="Logout"
            >
              <LogOut size={16} color="var(--text-muted)" />
            </button>
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
