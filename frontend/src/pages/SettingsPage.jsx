import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { SectionLoader } from '../components/SectionLoader';
import SectionHeader from '../components/SectionHeader';

export const SettingsPage = () => {
  const [profile, setProfile] = useState({
    daily_weekday_hours: 3.0,
    daily_weekend_hours: 5.0,
    preferred_time_slot: 'evening',
    study_days_per_week: 6,
    revision_buffer_days: 5,
    break_interval_minutes: 25,
    learning_pace: 'moderate',
    target_grade_goal: 'A'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/profile');
        if (data) setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.put('/profile', profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to save preferences: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SectionHeader
          title="Student Study Preferences"
          subtitle="Configure your daily study capacity and scheduling rules. The AI scheduler respects these bounds."
          icon={Settings}
          iconColor="var(--primary)"
          iconBg="var(--primary-light)"
          tag="Preferences"
        />
        <SectionLoader 
          message="Loading your study preferences & timetable capacity..." 
          subtitle="Fetching your customized study hours and buffer configurations..." 
          type="cards" 
          minHeight="320px" 
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        title="Student Study Preferences"
        subtitle="Configure your daily study capacity and scheduling rules. The AI scheduler respects these bounds."
        icon={Settings}
        iconColor="var(--primary)"
        iconBg="var(--primary-light)"
        tag="Preferences"
      />

      <form onSubmit={handleSave} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Study Hours */}
        <div>
          <SectionHeader
            title="Available Daily Study Hours"
            subtitle="Hours allocated for weekdays and weekends"
            icon={Clock}
            iconColor="var(--primary)"
            tag="Capacity"
            compact
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Weekday Study Hours (Mon–Fri)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                className="input-field"
                value={profile.daily_weekday_hours}
                onChange={(e) => setProfile({ ...profile, daily_weekday_hours: parseFloat(e.target.value) })}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hours you can allocate per weekday</span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Weekend Study Hours (Sat–Sun)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                className="input-field"
                value={profile.daily_weekend_hours}
                onChange={(e) => setProfile({ ...profile, daily_weekend_hours: parseFloat(e.target.value) })}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hours on weekends / holidays</span>
            </div>
          </div>
        </div>

        {/* Schedule Constraints */}
        <div>
          <SectionHeader
            title="Study Rhythm & Rest Days"
            subtitle="Study frequency per week and preferred work shift"
            icon={Calendar}
            iconColor="#06b6d4"
            tag="Rhythm"
            compact
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Study Days Per Week
              </label>
              <select
                className="input-field"
                value={profile.study_days_per_week}
                onChange={(e) => setProfile({ ...profile, study_days_per_week: parseInt(e.target.value) })}
              >
                <option value={5}>5 Days (2 Rest / Catchup Days)</option>
                <option value={6}>6 Days (1 Rest Day - Recommended)</option>
                <option value={7}>7 Days (Intensive Daily Study)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Preferred Time Slot
              </label>
              <select
                className="input-field"
                value={profile.preferred_time_slot}
                onChange={(e) => setProfile({ ...profile, preferred_time_slot: e.target.value })}
              >
                <option value="morning">Morning (6:00 AM – 10:00 AM)</option>
                <option value="afternoon">Afternoon (12:00 PM – 4:00 PM)</option>
                <option value="evening">Evening (5:00 PM – 9:00 PM)</option>
                <option value="night">Late Night (9:00 PM – 1:00 AM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exam Pacing & Spaced Repetition */}
        <div>
          <SectionHeader
            title="Exam Buffering & Spaced Repetition"
            subtitle="Revision buffers before milestones and Pomodoro blocks"
            icon={ShieldCheck}
            iconColor="#10b981"
            tag="Buffer"
            compact
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Revision Buffer Before Exam
              </label>
              <input
                type="number"
                min="1"
                max="14"
                className="input-field"
                value={profile.revision_buffer_days}
                onChange={(e) => setProfile({ ...profile, revision_buffer_days: parseInt(e.target.value) })}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Days reserved strictly for revision, mock exams & formula sheets
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Focus Timer Work Block
              </label>
              <select
                className="input-field"
                value={profile.break_interval_minutes}
                onChange={(e) => setProfile({ ...profile, break_interval_minutes: parseInt(e.target.value) })}
              >
                <option value={25}>25 Minutes (Standard Pomodoro)</option>
                <option value={50}>50 Minutes (Deep Work Sprint)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div>
            {savedSuccess && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Preferences saved successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ gap: '8px', minWidth: '160px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
