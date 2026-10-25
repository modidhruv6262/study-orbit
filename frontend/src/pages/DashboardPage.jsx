import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Flame, 
  ArrowRight, 
  RotateCcw, 
  Download, 
  Play, 
  PlusCircle, 
  CheckSquare, 
  Square,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  Zap
} from 'lucide-react';
import { triggerCelebration } from '../utils/confettiHelper';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { CountdownCard } from '../components/CountdownCard';
import { DashboardStopwatch } from '../components/DashboardStopwatch';
import { SectionLoader } from '../components/SectionLoader';
import SectionHeader from '../components/SectionHeader';

export const DashboardPage = ({ setActiveTab, onStartTaskTimer }) => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [exams, setExams] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rebalancing, setRebalancing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, examsData, tasksData] = await Promise.all([
        apiClient.get('/dashboard/overview'),
        apiClient.get('/exams'),
        apiClient.get('/schedules/today')
      ]);
      setOverview(overviewData);
      setExams(examsData);
      setTodayTasks(tasksData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      setTodayTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );

      await apiClient.patch(`/schedules/tasks/${task.id}`, { status: newStatus });

      if (newStatus === 'completed') {
        triggerCelebration();
      }
      const updatedOverview = await apiClient.get('/dashboard/overview');
      setOverview(updatedOverview);
    } catch (err) {
      console.error('Failed to update task:', err);
      loadDashboardData();
    }
  };

  const handleRebalance = async () => {
    try {
      setRebalancing(true);
      await apiClient.post('/schedules/rebalance', {});
      await loadDashboardData();
    } catch (err) {
      alert(`Could not rebalance: ${err.message}`);
    } finally {
      setRebalancing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '8px 0' }}>
        <SectionLoader 
          message="Loading your study dashboard & exam schedule..." 
          subtitle="Calculating streak, upcoming tests, and daily learning targets..." 
          type="dashboard" 
          minHeight="55vh" 
        />
      </div>
    );
  }

  const studentName = user?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {getGreeting()}, {studentName} 👋
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Top Banner Stats with Decorative Ambient Backlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Nearest Exam Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '22px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px',
            boxShadow: overview?.closest_exam_days !== null && overview?.closest_exam_days <= 5 
              ? '0 10px 28px -4px rgba(239, 68, 68, 0.25), 0 0 16px rgba(239, 68, 68, 0.15)' 
              : '0 10px 28px -4px rgba(79, 70, 229, 0.18), 0 0 16px rgba(79, 70, 229, 0.1)'
          }}
        >
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: overview?.closest_exam_days !== null && overview?.closest_exam_days <= 5 ? '#fee2e2' : 'var(--primary-light)',
            color: overview?.closest_exam_days !== null && overview?.closest_exam_days <= 5 ? '#dc2626' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: overview?.closest_exam_days !== null && overview?.closest_exam_days <= 5 
              ? '0 6px 18px rgba(239, 68, 68, 0.35)' 
              : '0 6px 18px rgba(79, 70, 229, 0.28)'
          }}>
            <Calendar size={26} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Nearest Exam
            </span>
            <h4 style={{ 
              fontSize: '1.6rem', 
              fontWeight: 800, 
              color: overview?.closest_exam_days !== null && overview?.closest_exam_days <= 5 ? '#dc2626' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginTop: '2px'
            }}>
              {overview?.closest_exam_days !== null ? `${overview.closest_exam_days} Days Left` : 'No Exams Set'}
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {overview?.closest_exam_title || 'Add upcoming exams'}
            </span>
          </div>
        </div>

        {/* Today's Tasks Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '22px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px',
            boxShadow: '0 10px 28px -4px rgba(16, 185, 129, 0.2), 0 0 16px rgba(16, 185, 129, 0.12)'
          }}
        >
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: '#dcfce7',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 18px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={26} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Completed
            </span>
            <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: '2px' }}>
              {overview?.today_tasks_completed || 0} / {overview?.today_tasks_total || 0} Tasks
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              {overview?.today_minutes_completed || 0} of {overview?.today_minutes_planned || 0} min studied
            </span>
          </div>
        </div>

        {/* Overall Coursework Progress Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '22px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px',
            boxShadow: '0 10px 28px -4px rgba(245, 158, 11, 0.2), 0 0 16px rgba(245, 158, 11, 0.12)'
          }}
        >
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 18px rgba(245, 158, 11, 0.3)'
          }}>
            <TrendingUp size={26} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Coursework Finished
            </span>
            <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: '2px' }}>
              {overview?.overall_progress_percentage || 0}%
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              Syllabus topics mastered
            </span>
          </div>
        </div>

        {/* Weekly Adherence & Study Streak Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '22px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '18px',
            boxShadow: '0 10px 28px -4px rgba(234, 88, 12, 0.2), 0 0 16px rgba(234, 88, 12, 0.12)'
          }}
        >
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: '#ffedd5',
            color: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 18px rgba(234, 88, 12, 0.3)'
          }}>
            <Flame size={26} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Weekly Adherence
            </span>
            <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: '2px' }}>
              {overview?.weekly_adherence_percent || 0}%
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, display: 'block', marginTop: '2px' }}>
              {overview?.active_streak_days ?? 0} day study streak!
            </span>
          </div>
        </div>
      </div>

      {/* Split Row on Desktop: Upcoming Exam Countdowns (Left 50%) & Big Focus Stopwatch (Right 50%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Left Column: Upcoming Exams Countdown Section (Half width) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader
            title="Upcoming Exam Countdowns"
            subtitle="Days left and topic progress across your courses"
            icon={Target}
            iconColor="#ef4444"
            iconBg="rgba(239, 68, 68, 0.12)"
            tag="Milestones"
            action={
              <button
                onClick={() => setActiveTab('exams')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <PlusCircle size={15} />
                <span>Manage Exams</span>
              </button>
            }
          />

          {exams.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem' }}>
                No exams scheduled yet! Add your exam date and syllabus to generate an adaptive schedule.
              </p>
              <button
                onClick={() => setActiveTab('exams')}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                Add Your First Exam
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: exams.length > 1 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
              gap: '16px',
              flex: 1
            }}>
              {exams.map((exam) => (
                <CountdownCard
                  key={exam.id}
                  exam={exam}
                  onSelectExam={() => setActiveTab('schedule')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Big Interactive Focus Stopwatch */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader
            title="Focus Study Sprint"
            subtitle="Interactive countdown stopwatch with acoustic chimes"
            icon={Clock}
            iconColor="var(--primary)"
            iconBg="var(--primary-light)"
            tag="Focus Timer"
          />
          <DashboardStopwatch
            onOpenTimer={() => onStartTaskTimer && onStartTaskTimer(null)}
            activeTask={todayTasks.find((t) => t.status === 'in_progress') || todayTasks[0]}
          />
        </div>
      </div>

      {/* Today's Actionable Study Plan */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Task List Column */}
        <div style={{ flex: 2 }}>
          <SectionHeader
            title="Today's Paced Study Blocks"
            subtitle="Mark topics complete as you study from your textbook"
            icon={Sparkles}
            iconColor="var(--primary)"
            iconBg="var(--primary-light)"
            tag="Daily Focus"
            action={
              <button
                onClick={handleRebalance}
                disabled={rebalancing}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                title="Shift overdue tasks forward across remaining days"
              >
                <RotateCcw size={14} className={rebalancing ? 'animate-spin' : ''} />
                <span>{rebalancing ? 'Rebalancing...' : 'Rebalance'}</span>
              </button>
            }
          />

          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayTasks.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No study blocks for today!
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  You either completed today's target or need to generate your schedule.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button onClick={() => setActiveTab('schedule')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                    View Full Timetable
                  </button>
                </div>
              </div>
            ) : (
              todayTasks.map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: isDone ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderLeft: `4px solid ${task.subject_color || 'var(--primary)'}`,
                      opacity: isDone ? 0.75 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isDone ? 'var(--success)' : 'var(--text-muted)'
                        }}
                      >
                        {isDone ? <CheckSquare size={20} color="var(--success)" /> : <Square size={20} />}
                      </button>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: task.subject_color || 'var(--primary)',
                            textTransform: 'uppercase'
                          }}>
                            {task.subject_name}
                          </span>
                          {task.is_revision && (
                            <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>
                              Revision
                            </span>
                          )}
                          {task.page_start && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              • pp. {task.page_start}{task.page_end ? `–${task.page_end}` : ''}
                            </span>
                          )}
                        </div>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.chapter_title}: {task.topic_title}
                        </h4>
                        {task.subtopic_title && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {task.subtopic_title}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {task.estimated_minutes} min
                      </span>
                      {!isDone && (
                        <button
                          onClick={() => onStartTaskTimer(task)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                          title="Start Focus Timer for this task"
                        >
                          <Play size={12} color="var(--primary)" />
                          <span>Focus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Launch & Guidance Tips Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionHeader
            title="Quick Actions"
            subtitle="Shortcuts for coursework and calendar"
            icon={Zap}
            iconColor="#06b6d4"
            iconBg="rgba(6, 182, 212, 0.12)"
            tag="Shortcuts"
          />

          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('textbooks')}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px', gap: '12px' }}
            >
              <BookOpen size={18} color="var(--primary)" />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>Upload Textbook PDF</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Generates chapter & topic hierarchy</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px', gap: '12px' }}
            >
              <Calendar size={18} color="#06b6d4" />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>View Full Calendar</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>See all days up to your exams</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px', gap: '12px' }}
            >
              <Clock size={18} color="#8b5cf6" />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem' }}>Adjust Study Hours</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Weekday/weekend split & buffers</span>
              </div>
            </button>
          </div>

          {/* Active Recall Tip Box */}
          <div className="glass-card" style={{ padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="var(--success)" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>Study Tip of the Day</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>The 3-Pass Rule:</strong> Skim the chapter outline first, read the core sections in 25-minute Pomodoro sprints, and close the book to write down 3 key formulas from memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
