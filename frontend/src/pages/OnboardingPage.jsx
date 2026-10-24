import React, { useState } from 'react';
import { 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2,
  AlertCircle,
  Award,
  CheckSquare,
  Square,
  Sun,
  Moon
} from 'lucide-react';
import { triggerCelebration } from '../utils/confettiHelper';
import { apiClient } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import SectionHeader from '../components/SectionHeader';
import { Logo } from '../components/Logo';

export const OnboardingPage = ({ onComplete }) => {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(1); // 1: Timing, 2: Subjects & PDFs, 3: Exams & Syllabus, 4: Finish
  const [loading, setLoading] = useState(false);

  // Step 1: Study Rhythm & Goals
  const [weekdayHours, setWeekdayHours] = useState(3.0);
  const [weekendHours, setWeekendHours] = useState(5.0);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('evening');
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(6);
  const [revisionBufferDays, setRevisionBufferDays] = useState(5);
  const [targetGrade, setTargetGrade] = useState('A');

  // Step 2: Subjects & PDFs
  const [subjectsList, setSubjectsList] = useState([]);
  const [currentSubjName, setCurrentSubjName] = useState('');
  const [currentSubjCode, setCurrentSubjCode] = useState('');
  const [currentSubjColor, setCurrentSubjColor] = useState('#3B82F6');
  const [currentSubjDifficulty, setCurrentSubjDifficulty] = useState(3);
  const [uploadingPdfFor, setUploadingPdfFor] = useState(null);

  // Step 3: Upcoming Exams (Multi-Subject & Marks)
  const [examsList, setExamsList] = useState([]);
  const [currentExamTitle, setCurrentExamTitle] = useState('');
  const [currentExamDate, setCurrentExamDate] = useState('');
  const [currentExamType, setCurrentExamType] = useState('Midterm');
  const [currentExamMarks, setCurrentExamMarks] = useState(60);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [subjectScopesMap, setSubjectScopesMap] = useState({});

  // Add Subject in Step 2
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!currentSubjName.trim()) return;

    try {
      setLoading(true);
      const newSubj = await apiClient.post('/subjects', {
        name: currentSubjName,
        code: currentSubjCode,
        color_code: currentSubjColor,
        difficulty_rating: Number(currentSubjDifficulty)
      });
      setSubjectsList((prev) => [...prev, { ...newSubj, uploadedDoc: null }]);
      // Pre-select for exam
      setSelectedSubjectIds((prev) => [...prev, newSubj.id]);
      setCurrentSubjName('');
      setCurrentSubjCode('');
    } catch (err) {
      alert(`Failed to add subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload PDF for a subject in Step 2
  const handlePdfUpload = async (subjectId, file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF file.');
      return;
    }

    try {
      setUploadingPdfFor(subjectId);
      const formData = new FormData();
      formData.append('subject_id', subjectId);
      formData.append('file', file);

      const docData = await apiClient.upload('/documents/upload', formData);

      setSubjectsList((prev) =>
        prev.map((s) => (s.id === subjectId ? { ...s, uploadedDoc: docData, has_textbook: true } : s))
      );
    } catch (err) {
      alert(`PDF parsing failed: ${err.message}`);
    } finally {
      setUploadingPdfFor(null);
    }
  };

  // Toggle subject selection in Step 3
  const handleToggleExamSubject = (sId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const handleScopeChange = (sId, val) => {
    setSubjectScopesMap((prev) => ({
      ...prev,
      [sId]: val
    }));
  };

  // Add Exam in Step 3
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!currentExamTitle.trim() || !currentExamDate) return;
    if (selectedSubjectIds.length === 0) {
      alert('Please select at least one subject included in this exam.');
      return;
    }

    try {
      setLoading(true);
      // Format scopes
      const formattedScopes = {};
      selectedSubjectIds.forEach((sId) => {
        const str = subjectScopesMap[sId] || '';
        const chs = str.split(',').map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
        formattedScopes[sId] = chs.length > 0 ? chs : [1, 2, 3];
      });

      const newExam = await apiClient.post('/exams', {
        title: currentExamTitle,
        exam_date: currentExamDate,
        exam_type: currentExamType,
        total_marks: Number(currentExamMarks),
        subject_ids: selectedSubjectIds,
        subject_scopes: formattedScopes,
        weight_priority: 4
      });

      setExamsList((prev) => [...prev, newExam]);
      setCurrentExamTitle('');
      setCurrentExamDate('');
    } catch (err) {
      alert(`Failed to add exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Final Step: Complete Onboarding & Generate Schedule
  const handleFinalize = async () => {
    try {
      setLoading(true);

      // 1. Save student preferences
      await apiClient.put('/profile', {
        daily_weekday_hours: Number(weekdayHours),
        daily_weekend_hours: Number(weekendHours),
        preferred_time_slot: preferredTimeSlot,
        study_days_per_week: Number(studyDaysPerWeek),
        revision_buffer_days: Number(revisionBufferDays),
        break_interval_minutes: 25,
        learning_pace: 'moderate',
        target_grade_goal: targetGrade,
        onboarding_completed: true
      });

      // 2. Trigger Schedule Engine
      await apiClient.post('/schedules/generate', {
        title: 'Master Study Plan'
      });

      // 3. Mark Onboarding as Completed (Correct relative endpoint)
      await apiClient.post('/profile/complete-onboarding', {});

      triggerCelebration();

      onComplete();
    } catch (err) {
      alert(`Setup error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 12px',
      position: 'relative',
      transition: 'background-color 0.2s ease'
    }}>
      {/* Top Corner Theme Switcher */}
      <button
        onClick={toggleTheme}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.78rem',
          gap: '6px'
        }}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} />}
        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Logo size={52} style={{ margin: '0 auto 10px', display: 'block', filter: 'drop-shadow(0 4px 14px rgba(79, 70, 229, 0.35))' }} />
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Welcome to Study<span style={{ color: 'var(--primary)' }}>Orbit</span>
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Personalize your coursework, textbook PDFs, and exam milestones
        </p>
      </div>

      {/* Stepper Progress */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '0 8px'
      }}>
        {[
          { stepNum: 1, label: 'Hours' },
          { stepNum: 2, label: 'Textbooks' },
          { stepNum: 3, label: 'Exams' },
          { stepNum: 4, label: 'Launch' }
        ].map((s, idx) => (
          <React.Fragment key={s.stepNum}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: step >= s.stepNum ? 'var(--primary)' : 'var(--bg-card-subtle)',
                color: step >= s.stepNum ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                border: '2px solid',
                borderColor: step >= s.stepNum ? 'var(--primary)' : 'var(--border)'
              }}>
                {step > s.stepNum ? '✓' : s.stepNum}
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: step === s.stepNum ? 700 : 500,
                color: step >= s.stepNum ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {s.label}
              </span>
            </div>
            {idx < 3 && (
              <div style={{
                flex: 1,
                height: '2px',
                backgroundColor: step > s.stepNum ? 'var(--primary)' : 'var(--border)',
                margin: '0 6px',
                marginBottom: '14px'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Wizard Content Card */}
      <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '20px 16px' }}>
        {/* STEP 1: Study Rhythm & Capacity */}
        {step === 1 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHeader
              title="Study Capacity & Daily Rhythm"
              subtitle="Tell us how many hours you want to study each day"
              icon={Clock}
              iconColor="var(--primary)"
              iconBg="var(--primary-light)"
              tag="Step 1"
              compact
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Weekday Hours (Mon–Fri)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  className="input-field"
                  value={weekdayHours}
                  onChange={(e) => setWeekdayHours(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Weekend Hours (Sat–Sun)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  className="input-field"
                  value={weekendHours}
                  onChange={(e) => setWeekendHours(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Preferred Time Slot
                </label>
                <select
                  className="input-field"
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                >
                  <option value="morning">Morning (6–10 AM)</option>
                  <option value="afternoon">Afternoon (12–4 PM)</option>
                  <option value="evening">Evening (5–9 PM)</option>
                  <option value="night">Late Night (9 PM–1 AM)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Study Days / Week
                </label>
                <select
                  className="input-field"
                  value={studyDaysPerWeek}
                  onChange={(e) => setStudyDaysPerWeek(parseInt(e.target.value))}
                >
                  <option value={5}>5 Days (2 Rest Days)</option>
                  <option value={6}>6 Days (1 Rest Day - Best)</option>
                  <option value={7}>7 Days (Intensive)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Revision Buffer (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  className="input-field"
                  value={revisionBufferDays}
                  onChange={(e) => setRevisionBufferDays(parseInt(e.target.value))}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Days before exam reserved for review
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Target Grade
                </label>
                <select
                  className="input-field"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                >
                  <option value="A">Grade A (Mastery)</option>
                  <option value="B">Grade B (Solid)</option>
                  <option value="Top Percentile">Top 1% Rank</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              >
                <span>Continue to Coursework & PDFs</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Subjects & Textbook PDFs */}
        {step === 2 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHeader
              title="Add Subjects & Upload PDFs"
              subtitle="Add your courses and upload complete textbook PDFs to extract chapter outlines"
              icon={BookOpen}
              iconColor="#06b6d4"
              iconBg="rgba(6, 182, 212, 0.12)"
              tag="Step 2"
              compact
            />

            {/* Quick add subject form */}
            <form onSubmit={handleAddSubject} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physics"
                    required
                    className="input-field"
                    value={currentSubjName}
                    onChange={(e) => setCurrentSubjName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="PHY101"
                    className="input-field"
                    value={currentSubjCode}
                    onChange={(e) => setCurrentSubjCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Difficulty (1 to 5)
                  </label>
                  <select
                    className="input-field"
                    value={currentSubjDifficulty}
                    onChange={(e) => setCurrentSubjDifficulty(e.target.value)}
                  >
                    <option value={1}>1 - Easy Pace</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={5}>5 - Challenging / High Priority</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '40px', marginTop: '16px', padding: '0 16px' }}>
                  <Plus size={16} />
                  <span>Add Subject</span>
                </button>
              </div>
            </form>

            {/* Added subjects with PDF upload action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subjectsList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Add at least one subject above (e.g. Physics, Chemistry, Math).
                  </p>
                </div>
              ) : (
                subjectsList.map((subj) => (
                  <div
                    key={subj.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      borderLeft: `4px solid ${subj.color_code || 'var(--primary)'}`,
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {subj.name} {subj.code && `(${subj.code})`}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Difficulty: {subj.difficulty_rating}/5
                      </span>
                    </div>

                    <div>
                      {subj.has_textbook ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          ✓ PDF Hierarchy Ready
                        </span>
                      ) : (
                        <label className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px', cursor: 'pointer' }}>
                          <Upload size={13} />
                          <span>{uploadingPdfFor === subj.id ? 'Extracting...' : 'Upload PDF'}</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handlePdfUpload(subj.id, e.target.files[0])}
                            disabled={uploadingPdfFor === subj.id}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ padding: '12px' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (subjectsList.length === 0) {
                    alert('Please add at least one subject first.');
                    return;
                  }
                  setStep(3);
                }}
                className="btn btn-primary"
                style={{ padding: '12px' }}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Multi-Subject Exam & Scope */}
        {step === 3 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionHeader
              title="Upcoming Exam & Tested Subjects"
              subtitle="Set target date, total marks, and which enrolled subjects are tested"
              icon={Calendar}
              iconColor="#ef4444"
              iconBg="rgba(239, 68, 68, 0.12)"
              tag="Step 3"
              compact
            />

            {/* Exam Details Form */}
            <form onSubmit={handleAddExam} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '14px',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Exam Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 1, Term 1 Midterms, Annual Finals"
                  className="input-field"
                  value={currentExamTitle}
                  onChange={(e) => setCurrentExamTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Exam Date (When is it?) *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={currentExamDate}
                    onChange={(e) => setCurrentExamDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Exam Type
                  </label>
                  <select
                    className="input-field"
                    value={currentExamType}
                    onChange={(e) => setCurrentExamType(e.target.value)}
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Midterm">Midterm Exam</option>
                    <option value="Final">Final Exam</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Entrance Exam">Entrance Exam</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Total Marks (e.g. 20, 60, 100) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    placeholder="60"
                    className="input-field"
                    value={currentExamMarks}
                    onChange={(e) => setCurrentExamMarks(e.target.value)}
                  />
                </div>
              </div>

              {/* Selectable list of added subjects only */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Subjects Tested in this Exam (From Your Added Courses):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {subjectsList.map((s) => {
                    const isChecked = selectedSubjectIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: isChecked ? '#f0fdf4' : '#ffffff'
                        }}
                      >
                        <div 
                          onClick={() => handleToggleExamSubject(s.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        >
                          {isChecked ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--text-muted)" />}
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {s.name} {s.code && `(${s.code})`}
                          </span>
                        </div>

                        {isChecked && (
                          <div style={{ marginTop: '6px', paddingLeft: '28px' }}>
                            <input
                              type="text"
                              placeholder="Chapters in exam (e.g. 1, 2, 3 or leave empty for all)"
                              className="input-field"
                              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                              value={subjectScopesMap[s.id] || ''}
                              onChange={(e) => handleScopeChange(s.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <Plus size={15} />
                  <span>Save Exam Event</span>
                </button>
              </div>
            </form>

            {/* List of configured exams */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {examsList.map((ex) => (
                <div key={ex.id} style={{
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ex.title} ({ex.total_marks} Marks)
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Date: {ex.exam_date} • {ex.subject_ids?.length || 1} Subject(s) Included
                    </span>
                  </div>
                  <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                    Configured
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-secondary"
                style={{ padding: '12px' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (examsList.length === 0) {
                    alert('Please add at least one exam milestone.');
                    return;
                  }
                  setStep(4);
                }}
                className="btn btn-primary"
                style={{ padding: '12px' }}
              >
                <span>Review & Finish</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Generate */}
        {step === 4 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <CheckCircle2 size={30} />
            </div>

            <SectionHeader
              title="You're All Set! Ready to Generate"
              subtitle="Your study hours, courses, and multi-subject exams are configured."
              icon={Sparkles}
              iconColor="var(--success)"
              iconBg="rgba(16, 185, 129, 0.15)"
              tag="Master Plan"
              compact
            />

            <div style={{
              padding: '14px',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '10px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.8rem'
            }}>
              <div><strong>Daily Study Time:</strong> {weekdayHours}h (Weekdays) / {weekendHours}h (Weekends)</div>
              <div><strong>Enrolled Courses:</strong> {subjectsList.length} subjects</div>
              <div><strong>Target Exams:</strong> {examsList.length} exam(s) scheduled</div>
              <div><strong>Revision Buffer:</strong> {revisionBufferDays} days before each exam</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn btn-secondary"
                style={{ padding: '12px' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '0.9rem', gap: '6px' }}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Synthesizing...' : 'Launch Dashboard'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
