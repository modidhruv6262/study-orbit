import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Bot, 
  Layers, 
  Target, 
  RotateCcw, 
  Volume2, 
  ChevronDown, 
  Sun, 
  Moon,
  Play,
  Check,
  Award
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

export const LandingPage = ({ onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeFeatureTab, setActiveFeatureTab] = useState('pacing');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const featureTabs = [
    {
      id: 'pacing',
      label: 'Exam Countdown & Pacing',
      icon: Target,
      color: '#ef4444',
      badge: 'Algorithm Engine',
      title: 'Never Cram Again. Every Day Has an Exact, Balanced Plan.',
      desc: 'Set your exam date, total marks, and tested subjects. StudyOrbit computes your remaining days, reserves revision buffers, and balances topics evenly across your weekdays and weekends.',
      bullets: [
        'Multi-subject exam milestone tracking with target scores',
        'Automatic urgency escalation when exams are 5 days away',
        'Formula sheet & mock exam revision buffers locked before test day',
        'Dynamic hour calculation based on your actual study capacity'
      ]
    },
    {
      id: 'pdf',
      label: 'Textbook PDF Parser',
      icon: BookOpen,
      color: '#4f46e5',
      badge: 'Zero Manual Typing',
      title: 'Drop Your Textbook PDF. Get Instant Structured Syllabus.',
      desc: 'Upload full textbook or syllabus PDFs. Our anti-hallucination document engine accurately indexes chapters, subtopics, and exact page numbers automatically.',
      bullets: [
        'Automatic chapter & topic hierarchy mapping from PDF',
        'Page range tracking so you always know where to read',
        'Manual chapter & topic customization tools anytime',
        'Direct linking of syllabus units to upcoming tests'
      ]
    },
    {
      id: 'rebalance',
      label: '1-Click Rebalancer',
      icon: RotateCcw,
      color: '#06b6d4',
      badge: 'Stress Killer',
      title: 'Fell Behind Schedule? Rebalance with a Single Click.',
      desc: 'Life happens and study sessions get missed. Instead of letting overdue tasks pile up and creating panic, hit "Rebalance" and StudyOrbit shifts overdue blocks forward proportionally across remaining days.',
      bullets: [
        'Instantly redistributes incomplete blocks into future days',
        'Protects rest days while maintaining exam completion goals',
        'Eliminates the guilt and paralysis of missed study sessions',
        'Prioritizes higher difficulty subjects automatically'
      ]
    },
    {
      id: 'focus',
      label: 'Focus Sprint Timer',
      icon: Clock,
      color: '#8b5cf6',
      badge: 'Deep Work',
      title: 'Distraction-Free Sprints with Acoustic Completion Chimes.',
      desc: 'Connect your study blocks directly to an ambient circular countdown timer. Choose 25m Pomodoro sprints, 50m deep work blocks, or custom intervals (1–360 min) with acoustic bell chimes and confetti.',
      bullets: [
        'Task-synced timer displays current chapter & target duration',
        'Warm 4-note chime chords via Web Audio API (zero audio lag)',
        'Celebration confetti burst upon milestone completion',
        'Custom mode selector with 15m, 30m, 45m, 60m, 90m quick chips'
      ]
    },
    {
      id: 'ai',
      label: 'AI Study Chatbot',
      icon: Bot,
      color: '#10b981',
      badge: 'Always Online',
      title: 'Guardrailed Academic AI Grounded in Your Syllabus.',
      desc: 'Need a concept explained or a tough practice question solved? Your dedicated AI tutor guides your understanding step-by-step, summarizes textbook topics, and reinforces active recall.',
      bullets: [
        'Powered by Groq high-speed inference (openai/gpt-oss-120b)',
        'Step-by-step problem solver with clean markdown rendering',
        'Academic habit guidance and active recall technique coaching',
        'Zero distraction: strictly focused on your subjects'
      ]
    }
  ];

  const currentTab = featureTabs.find(t => t.id === activeFeatureTab) || featureTabs[0];

  const faqs = [
    {
      q: 'Is StudyOrbit really 100% free?',
      a: 'Yes, absolutely. StudyOrbit has no paywalls, hidden tiers, or credit card requirements. All features—including PDF parsing, algorithmic timetable generation, focus timers, and AI chatbot guidance—are free for students.'
    },
    {
      q: 'Do I have to type in all my chapters and syllabus manually?',
      a: 'Not at all! You can simply upload your course textbook or syllabus PDF. StudyOrbit parses the chapters, topics, and page ranges automatically. You can also customize or edit chapters if you wish.'
    },
    {
      q: 'What happens if I miss a study day or fall behind?',
      a: 'That is where StudyOrbit truly shines. Click the "Rebalance" button on your dashboard. The algorithm automatically redistributes all overdue topics into your remaining available days, recalculating your daily pace without exam panic.'
    },
    {
      q: 'How does StudyOrbit calculate my daily timetable?',
      a: 'You define how many hours you can study on weekdays and weekends, your preferred time slot, and your buffer days before exams. StudyOrbit works backward from your exam milestones to create achievable daily study blocks.'
    },
    {
      q: 'Can I use StudyOrbit on my mobile phone?',
      a: 'Yes! StudyOrbit is designed mobile-first. It includes a native-style mobile bottom navigation bar, optimized touch buttons, and seamless theme switching on phones, tablets, and laptops.'
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* =========================================================================
          Sticky Navbar
          ========================================================================= */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size={34} style={{ filter: 'drop-shadow(0 2px 8px rgba(79, 70, 229, 0.35))' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              Study<span style={{ color: 'var(--primary)' }}>Orbit</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 600 }}>Features</a>
            <a href="#interactive-preview" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 600 }}>Live Showcase</a>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 600 }}>How It Works</a>
            <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 600 }}>FAQ</a>
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleTheme}
              className="btn btn-ghost nav-icon-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{ width: '36px', height: '36px', borderRadius: '10px' }}
            >
              {theme === 'dark' ? (
                <Sun size={18} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))' }} />
              ) : (
                <Moon size={18} color="var(--text-secondary)" />
              )}
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="btn btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '10px' }}
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.82rem', borderRadius: '10px', gap: '6px' }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          Hero Section
          ========================================================================= */}
      <section style={{
        padding: '60px 20px 40px',
        maxWidth: '1240px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Glow backdrop blur */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(700px, 90%)',
          height: '240px',
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            boxShadow: '0 0 16px var(--primary-glow)',
            marginBottom: '20px'
          }}>
            <Sparkles size={15} />
            <span>AI-Powered Adaptive Study Pacing • 100% Free Forever</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.035em',
            color: 'var(--text-primary)',
            maxWidth: '920px',
            margin: '0 auto 18px'
          }}>
            Stop Guessing What to Study. <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Master Every Exam on Autopilot.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            Upload your syllabus or textbook PDF, set your exam dates, and let StudyOrbit algorithmically balance your daily study blocks, revision buffers, and instant overdue rebalancing.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button
              onClick={() => onOpenAuth('register')}
              className="btn btn-primary"
              style={{
                padding: '13px 28px',
                fontSize: '0.98rem',
                borderRadius: '12px',
                boxShadow: 'var(--glow-btn-hover)',
                gap: '8px'
              }}
            >
              <span>Start Studying for Free</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="btn btn-secondary"
              style={{
                padding: '13px 24px',
                fontSize: '0.98rem',
                borderRadius: '12px'
              }}
            >
              <span>Sign In to Existing Account</span>
            </button>
          </div>

          {/* Trust Value Chips */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Zero Manual Syllabus Typing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Real Streak Calculation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>AI Study Companion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Free Forever</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            Interactive Live Dashboard Preview Mockup
            ========================================================================= */}
        <div id="interactive-preview" style={{ marginTop: '50px', textAlign: 'left' }}>
          <div className="glass-card" style={{
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--glow-card-hover)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-card)'
          }}>
            {/* Top Mock Window Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '10px' }}>
                  StudyOrbit Student Portal • Live Interactive Preview
                </span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                ● AI Pace Engine Online
              </span>
            </div>

            {/* 4 Stat Boxes Preview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}>
              {/* Card 1 */}
              <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 20px -4px rgba(239, 68, 68, 0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nearest Exam</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>5 Days Left</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Midterm Test</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Today's Blocks</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>3 / 4 Done</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>75% Daily Goal</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Coursework</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>68% Finished</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>18 of 26 Topics</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 20px -4px rgba(234, 88, 12, 0.25)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={22} fill="#ea580c" />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Study Streak</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c' }}>4 Days 🔥</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Streak!</span>
                </div>
              </div>
            </div>

            {/* Split Row: Daily Study Block on Left, Focus Timer on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {/* Daily Task List Preview */}
              <div style={{ backgroundColor: 'var(--bg-card-subtle)', borderRadius: '16px', padding: '18px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '4px' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Today's Paced Study Blocks</span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem', gap: '4px' }}>
                    <RotateCcw size={12} />
                    <span>Rebalance</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', borderLeft: '4px solid #4f46e5' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Calculus III: Chapter 4</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Topic: Partial Derivatives • Pages 112–126</div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ Done</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '10px', borderLeft: '4px solid #06b6d4' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Operating Systems: Chapter 2</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Topic: Process Scheduling & Threads • 35 min</div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.74rem', gap: '4px' }}>
                      <Play size={11} />
                      <span>Focus</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Focus Sprint Preview */}
              <div style={{ backgroundColor: 'var(--bg-card-subtle)', borderRadius: '16px', padding: '18px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Focus Study Sprint</span>
                  <span className="badge badge-normal" style={{ fontSize: '0.68rem' }}>25m Sprint</span>
                </div>
                
                {/* Circular ring preview */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  margin: '8px auto 12px',
                  background: 'conic-gradient(var(--primary) 220deg, var(--border) 0deg)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 24px var(--primary-glow)'
                }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-card)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace' }}>18:42</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>Pause</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}><RotateCcw size={12} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          The 6 Core Superpowers Section
          ========================================================================= */}
      <section id="features" style={{
        padding: '80px 20px',
        maxWidth: '1240px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="section-tag-pill" style={{ marginBottom: '10px' }}>COMPLETE STUDY ARSENAL</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Built for Students Who Want Results, Not Chaos
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            Everything you need to turn thousands of textbook pages and looming exam countdowns into an effortless daily routine.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {/* Feature 1 */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(79, 70, 229, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Textbook PDF Hierarchy Parser</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Upload any syllabus or complete textbook PDF. StudyOrbit extracts the full chapter structure, subtopics, and exact page ranges in seconds with zero manual typing.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Multi-Subject Exam Milestones</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Track tests and final exams across multiple subjects simultaneously. Visual countdowns show days left, target marks, and automatically ramp up study focus as test day nears.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <RotateCcw size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>1-Click Overdue Rebalancing</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Missed a study day? No problem. One click on "Rebalance" recalculates and redistributes unfinished blocks forward across remaining days, preserving sanity and goals.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Acoustic Focus Timer & Custom Sprints</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Choose 25m sprints, 50m deep blocks, or set any custom timer (1–360 min). Plays a soothing acoustic bell chime and fires confetti when you conquer your session.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Bot size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>AI Study Tutor & Problem Solver</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ask anything about your syllabus. Our guardrailed AI tutor gives step-by-step problem solutions, active recall questions, and chapter summaries grounded in your coursework.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card" style={{ padding: '26px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Dedicated Exam Revision Buffers</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Configure 3 to 14 buffer days reserved strictly for formula sheets, past mock exams, and review—ensuring you finish new syllabus topics with ample time to spare.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Interactive Feature Deep Dive (Tabbed Spotlight)
          ========================================================================= */}
      <section style={{
        padding: '60px 20px',
        backgroundColor: 'var(--bg-card-subtle)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="section-tag-pill" style={{ marginBottom: '8px' }}>DEEP DIVE</span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 800 }}>Explore Core Engine Features</h2>
          </div>

          {/* Segmented Pill Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '36px'
          }}>
            {featureTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-card)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: isActive ? 'var(--glow-btn)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="glass-card" style={{
            padding: '36px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)'
          }}>
            <div>
              <span className="badge" style={{ backgroundColor: `${currentTab.color}20`, color: currentTab.color, marginBottom: '12px' }}>
                {currentTab.badge}
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px' }}>
                {currentTab.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                {currentTab.desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentTab.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn btn-primary"
                style={{ marginTop: '26px', padding: '10px 20px', gap: '8px' }}
              >
                <span>Try It Free Now</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Illustration Graphic Box */}
            <div style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid var(--border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px'
            }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '22px',
                backgroundColor: `${currentTab.color}15`,
                color: currentTab.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: `0 8px 24px ${currentTab.color}30`
              }}>
                <currentTab.icon size={36} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>{currentTab.label}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                Live algorithm feature built natively into StudyOrbit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          How It Works (4 Steps)
          ========================================================================= */}
      <section id="how-it-works" style={{
        padding: '80px 20px',
        maxWidth: '1240px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="section-tag-pill" style={{ marginBottom: '8px' }}>THE WORKFLOW</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800 }}>From Syllabus to Ace in 4 Steps</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}>
          {[
            {
              step: '01',
              title: 'Set Your Study Rhythm',
              desc: 'Tell the planner how many hours you can realistically study on weekdays vs. weekends.'
            },
            {
              step: '02',
              title: 'Drop Your Textbook PDFs',
              desc: 'Upload your syllabus or textbook PDF. Chapters and subtopics are mapped automatically.'
            },
            {
              step: '03',
              title: 'Add Exam Targets',
              desc: 'Set test dates and marks. The engine works backward to allocate paced daily study blocks.'
            },
            {
              step: '04',
              title: 'Execute & Conquer',
              desc: 'Study daily blocks with Pomodoro chimes, ask your AI tutor questions, and track streaks.'
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '24px', position: 'relative' }}>
              <div style={{
                fontSize: '2.4rem',
                fontWeight: 900,
                color: 'var(--primary)',
                opacity: 0.35,
                lineHeight: 1,
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          FAQ Accordion Section
          ========================================================================= */}
      <section id="faq" style={{
        padding: '60px 20px 80px',
        maxWidth: '820px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-tag-pill" style={{ marginBottom: '8px' }}>FREQUENTLY ASKED QUESTIONS</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 800 }}>Got Questions? We Have Answers.</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => toggleFaq(idx)}
              >
                <div style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: '0.96rem'
                }}>
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--primary)'
                    }}
                  />
                </div>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 18px',
                    fontSize: '0.86rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          Final Big CTA Banner
          ========================================================================= */}
      <section style={{
        padding: '0 20px 80px',
        maxWidth: '1240px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div className="glass-card" style={{
          padding: '60px 24px',
          borderRadius: '28px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          boxShadow: 'var(--glow-card-hover)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Logo size={64} style={{ margin: '0 auto 16px', display: 'block', filter: 'drop-shadow(0 6px 18px rgba(79, 70, 229, 0.45))' }} />
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.03em' }}>
            Ready to Ace Your Upcoming Exams?
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Join students using StudyOrbit to eliminate cramming, keep study streaks, and master coursework every single day.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenAuth('register')}
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: '12px', boxShadow: 'var(--glow-btn-hover)', gap: '8px' }}
            >
              <span>Create Free Account</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="btn btn-secondary"
              style={{ padding: '14px 26px', fontSize: '1rem', borderRadius: '12px' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Footer
          ========================================================================= */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '30px 20px',
        backgroundColor: 'var(--bg-card)',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Logo size={24} />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Study<span style={{ color: 'var(--primary)' }}>Orbit</span></span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>Workflow</a>
            <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>FAQ</a>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>100% Free for Students</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
