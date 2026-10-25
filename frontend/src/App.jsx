import React, { useState, useEffect } from 'react';
import { GraduationCap, Calendar, CheckCircle2, RotateCcw, X, Award, ArrowUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Logo } from './components/Logo';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TextbooksPage } from './pages/TextbooksPage';
import { SchedulePage } from './pages/SchedulePage';
import { ExamsPage } from './pages/ExamsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppSettingsPage } from './pages/AppSettingsPage';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { apiClient } from './api/client';

function MainApp() {
  const { user, loading, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState(null); // null: LandingPage, 'login': login, 'register': register
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTaskForTimer, setActiveTaskForTimer] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor window scroll for Scroll-to-Top quick navigation
  useEffect(() => {
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Passed Exam Prompt state
  const [passedExamPrompt, setPassedExamPrompt] = useState(null);
  const [dismissedExamIds, setDismissedExamIds] = useState([]);

  // Keep-alive heartbeat: ping backend every 4 minutes while app is open so it NEVER sleeps when user is AFK
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || '/api';
    const pingBackend = () => {
      fetch(`${apiBase}/health`).catch(() => {});
    };

    // Ping immediately when the user returns/tabs back to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pingBackend();
      }
    };

    const interval = setInterval(pingBackend, 4 * 60 * 1000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch real study streak
  useEffect(() => {
    if (!user) return;
    const fetchStreak = async () => {
      try {
        const overview = await apiClient.get('/dashboard/overview');
        if (overview && typeof overview.active_streak_days === 'number') {
          setStreak(overview.active_streak_days);
        }
      } catch (e) {
        console.error('Failed to load streak:', e);
      }
    };
    fetchStreak();
  }, [user, activeTab]);

  // Check for passed uncompleted exams when user logs in
  useEffect(() => {
    if (!user) return;

    const checkPassedExams = async () => {
      try {
        const exams = await apiClient.get('/exams');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find exams whose date has passed and are not marked as completed
        const uncompletedPassed = exams.filter((e) => {
          if (e.is_completed) return false;
          if (dismissedExamIds.includes(e.id)) return false;
          if (e.days_left < 0) return true;
          const examDate = new Date(e.exam_date + 'T00:00:00');
          return examDate < today;
        });

        if (uncompletedPassed.length > 0) {
          setPassedExamPrompt(uncompletedPassed[0]);
        } else {
          setPassedExamPrompt(null);
        }
      } catch (err) {
        // Silently continue if exams cannot be loaded
        console.error('Check passed exams failed:', err);
      }
    };

    checkPassedExams();
  }, [user, dismissedExamIds]);

  if (loading) {
    return (
      <AuthLoadingScreen 
        title="Starting StudyOrbit" 
        subtitle="Verifying credentials and loading your academic workspace..." 
      />
    );
  }

  if (!user) {
    if (authMode) {
      return (
        <AuthPage
          initialRegister={authMode === 'register'}
          onBackToLanding={() => setAuthMode(null)}
        />
      );
    }
    return <LandingPage onOpenAuth={(mode) => setAuthMode(mode)} />;
  }

  // Check if student has finished onboarding
  if (user.profile && !user.profile.onboarding_completed) {
    return <OnboardingPage onComplete={() => refreshUser()} />;
  }

  const handleStartTaskTimer = (task) => {
    setActiveTaskForTimer(task);
    setIsTimerOpen(true);
  };

  const handleConfirmExamCompleted = async () => {
    if (!passedExamPrompt) return;
    try {
      await apiClient.patch(`/exams/${passedExamPrompt.id}/complete`);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) {}
      setDismissedExamIds((prev) => [...prev, passedExamPrompt.id]);
      setPassedExamPrompt(null);
    } catch (err) {
      alert(`Could not mark exam as completed: ${err.message}`);
    }
  };

  const handleRescheduleExam = () => {
    if (passedExamPrompt) {
      setDismissedExamIds((prev) => [...prev, passedExamPrompt.id]);
      setPassedExamPrompt(null);
      setActiveTab('exams');
    }
  };

  const handleDismissPrompt = () => {
    if (passedExamPrompt) {
      setDismissedExamIds((prev) => [...prev, passedExamPrompt.id]);
      setPassedExamPrompt(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTimer={() => { setActiveTaskForTimer(null); setIsTimerOpen(true); }}
        onOpenChat={() => setIsChatOpen(true)}
        streak={streak}
        user={user}
        onLogout={() => {
          logout();
          setAuthMode(null);
        }}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        flex: 1
      }}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onStartTaskTimer={handleStartTaskTimer}
          />
        )}
        {activeTab === 'textbooks' && <TextbooksPage />}
        {activeTab === 'schedule' && (
          <SchedulePage onStartTaskTimer={handleStartTaskTimer} />
        )}
        {activeTab === 'exams' && <ExamsPage />}
        {activeTab === 'preferences' && <SettingsPage />}
        {activeTab === 'settings' && <AppSettingsPage />}
      </main>

      {/* Passed Exam Prompt Modal */}
      {passedExamPrompt && (
        <div className="modal-overlay" style={{ zIndex: 90 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={handleDismissPrompt}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
              title="Close"
            >
              <X size={18} />
            </button>

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Calendar size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Exam Check-In
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              The scheduled date for <strong>{passedExamPrompt.title}</strong> ({passedExamPrompt.exam_date}) has passed. Did you complete this exam?
            </p>

            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  {passedExamPrompt.title}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {passedExamPrompt.exam_type} • {passedExamPrompt.total_marks ? `${passedExamPrompt.total_marks} Marks` : 'General'}
                </span>
              </div>
              <span className="badge badge-urgent">Date Passed</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleConfirmExamCompleted}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                <span>Yes, Mark as Completed!</span>
              </button>

              <button
                onClick={handleRescheduleExam}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem', gap: '6px' }}
              >
                <RotateCcw size={16} />
                <span>Reschedule Exam Date</span>
              </button>

              <button
                onClick={handleDismissPrompt}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  marginTop: '4px',
                  cursor: 'pointer'
                }}
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus / Pomodoro Timer Modal */}
      <PomodoroTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        activeTask={activeTaskForTimer}
      />

      {/* Guiding Chatbot Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Floating Scroll-to-Top Button for effortless navigation */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="scroll-to-top-btn animate-fade-in"
          title="Scroll back to top"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}
