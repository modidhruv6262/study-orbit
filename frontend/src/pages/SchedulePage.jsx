import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Download, 
  FileText,
  Sparkles, 
  Play, 
  Clock, 
  BookOpen, 
  Layers,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { triggerCelebration } from '../utils/confettiHelper';
import { exportScheduleToPdf } from '../utils/schedulePdfExporter';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import SectionHeader from '../components/SectionHeader';

export const SchedulePage = ({ onStartTaskTimer }) => {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingIcs, setExportingIcs] = useState(false);
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState('UPCOMING_7'); // TODAY, UPCOMING_7, ALL

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/schedules/active');
      setSchedule(data);
    } catch (err) {
      console.error('Failed to load active schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const newPlan = await apiClient.post('/schedules/generate', {
        title: 'Unified Master Study Plan'
      });
      setSchedule(newPlan);
      triggerCelebration();
    } catch (err) {
      alert(`Schedule generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRebalance = async () => {
    try {
      setRebalancing(true);
      const rebalanced = await apiClient.post('/schedules/rebalance', {});
      setSchedule(rebalanced);
    } catch (err) {
      alert(`Rebalancing failed: ${err.message}`);
    } finally {
      setRebalancing(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      setSchedule((prev) => {
        if (!prev) return prev;
        const updatedTasks = prev.tasks.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        );
        const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
        return {
          ...prev,
          tasks: updatedTasks,
          completed_tasks: completedCount,
          progress_percentage: Math.round((completedCount / updatedTasks.length) * 100)
        };
      });

      await apiClient.patch(`/schedules/tasks/${task.id}`, { status: newStatus });

      if (newStatus === 'completed') {
        triggerCelebration();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      loadSchedule();
    }
  };

  const handleExportPDF = () => {
    if (!schedule || !schedule.tasks || schedule.tasks.length === 0) {
      alert('No study schedule tasks available to export.');
      return;
    }
    try {
      setExportingPdf(true);
      exportScheduleToPdf({
        schedule,
        user,
        themeColor: settings?.themeColor || 'indigo'
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert(`Could not generate PDF: ${err.message}`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportICS = async () => {
    if (!schedule) return;
    try {
      setExportingIcs(true);
      const icsData = await apiClient.get(`/schedules/${schedule.id}/export.ics`);
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_schedule_${schedule.id}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Calendar Export Error:', err);
      alert(`Failed to export .ics calendar: ${err.message}`);
    } finally {
      setExportingIcs(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Group tasks by scheduled_date
  const groupedTasks = {};
  if (schedule?.tasks) {
    schedule.tasks.forEach((t) => {
      if (filterSubject !== 'ALL' && t.subject_id !== filterSubject) return;
      if (timeframeFilter === 'TODAY' && t.scheduled_date !== todayStr) return;
      if (timeframeFilter === 'UPCOMING_7' && (t.scheduled_date < todayStr || t.scheduled_date > next7DaysStr)) return;

      if (!groupedTasks[t.scheduled_date]) {
        groupedTasks[t.scheduled_date] = [];
      }
      groupedTasks[t.scheduled_date].push(t);
    });
  }

  // Get unique subjects for filtering
  const uniqueSubjects = [];
  if (schedule?.tasks) {
    const map = new Map();
    schedule.tasks.forEach((t) => {
      if (!map.has(t.subject_id)) {
        map.set(t.subject_id, { id: t.subject_id, name: t.subject_name });
      }
    });
    uniqueSubjects.push(...map.values());
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Controls */}
      <SectionHeader
        title="Study Timetable & Calendar"
        subtitle="Daily paced learning blocks automatically aligned to your exam milestones"
        icon={CalendarIcon}
        iconColor="#06b6d4"
        iconBg="rgba(6, 182, 212, 0.12)"
        tag="Adaptive Plan"
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRebalance}
              disabled={rebalancing || !schedule}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              title="Recalculates dates for overdue tasks"
            >
              <RotateCcw size={14} className={rebalancing ? 'animate-spin' : ''} />
              <span>{rebalancing ? 'Rebalancing...' : 'Rebalance Schedule'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={!schedule || exportingPdf}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download beautifully styled PDF timetable"
            >
              <FileText size={14} style={{ color: 'var(--primary)' }} />
              <span>{exportingPdf ? 'Generating PDF...' : 'Export (PDF)'}</span>
            </button>

            <button
              onClick={handleExportICS}
              disabled={!schedule || exportingIcs}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download .ics file for Google or Apple Calendar"
            >
              <Download size={14} />
              <span>{exportingIcs ? 'Exporting...' : 'Export (.ics)'}</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <Sparkles size={15} />
              <span>{generating ? 'Calculating Pace...' : 'Regenerate Plan'}</span>
            </button>
          </div>
        }
      />

      {/* Progress & Summary Banner */}
      {schedule && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {schedule.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {schedule.start_date} to {schedule.target_completion_date} • {schedule.total_hours_allocated} Total Hours Planned
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                {schedule.completed_tasks} / {schedule.total_tasks}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                Tasks Completed ({schedule.progress_percentage}%)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${schedule.progress_percentage}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {/* Timeframe and Subject Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
            {/* Timeframe segmented tabs */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '8px', padding: '3px' }}>
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'UPCOMING_7', label: 'Next 7 Days' },
                { id: 'ALL', label: 'Full Schedule' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframeFilter(tf.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: timeframeFilter === tf.id ? 'var(--bg-card)' : 'transparent',
                    color: timeframeFilter === tf.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Subject Filters */}
            {uniqueSubjects.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Subject:</span>
                <button
                  onClick={() => setFilterSubject('ALL')}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: filterSubject === 'ALL' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: filterSubject === 'ALL' ? 'var(--primary-light)' : 'var(--bg-card)',
                    color: filterSubject === 'ALL' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {uniqueSubjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFilterSubject(s.id)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: filterSubject === s.id ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: filterSubject === s.id ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: filterSubject === s.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Grouped Timetable */}
      {!schedule || schedule.tasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CalendarIcon size={44} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Active Study Plan Generated
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
            Generate your personalized, paced timetable based on your exam dates, available daily hours, and coursework syllabus.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <Sparkles size={16} />
            <span>{generating ? 'Calculating Schedule...' : 'Generate Master Study Schedule'}</span>
          </button>
        </div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <div className="glass-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No study blocks in this timeframe
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Switch to "Full Schedule" or "Next 7 Days" to see all planned study blocks.
          </p>
          <button onClick={() => setTimeframeFilter('ALL')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            Show Full Schedule
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionHeader
            title="Daily Study Blocks"
            subtitle="Chronological timetable of allocated textbook topics"
            icon={Clock}
            iconColor="var(--primary)"
            iconBg="var(--primary-light)"
            tag="Paced Pacing"
          />

          {Object.entries(groupedTasks).map(([dateStr, tasks]) => {
            const isToday = dateStr === todayStr;
            const dateObj = new Date(dateStr + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={dateStr} className="glass-card" style={{ padding: '16px' }}>
                {/* Date Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: isToday ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                      color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isToday ? '0 0 10px var(--primary-glow)' : 'none'
                    }}>
                      <CalendarIcon size={16} />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--text-primary)', letterSpacing: '-0.015em' }}>
                      {formattedDate} {isToday && '• Today'}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {tasks.length} {tasks.length === 1 ? 'Block' : 'Blocks'} • {tasks.reduce((a, b) => a + b.estimated_minutes, 0)} min
                  </span>
                </div>

                {/* Day Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: isDone ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderLeft: `4px solid ${task.subject_color || 'var(--primary)'}`,
                          opacity: isDone ? 0.72 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <button
                            onClick={() => handleToggleTask(task)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: isDone ? 'var(--success)' : 'var(--text-muted)',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: task.subject_color || 'var(--primary)', textTransform: 'uppercase' }}>
                                {task.subject_name}
                              </span>
                              {task.is_revision && (
                                <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                                  Revision
                                </span>
                              )}
                              {task.page_start && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  • pp. {task.page_start}–{task.page_end}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.chapter_title}: {task.topic_title}
                            </span>
                            {task.subtopic_title && (
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.subtopic_title}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {task.estimated_minutes}m
                          </span>
                          {!isDone && (
                            <button
                              onClick={() => onStartTaskTimer(task)}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.72rem', gap: '4px', minHeight: '30px' }}
                            >
                              <Play size={12} color="var(--primary)" fill="var(--primary)" />
                              <span>Focus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
