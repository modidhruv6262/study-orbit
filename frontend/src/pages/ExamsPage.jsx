import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  GraduationCap, 
  Calendar, 
  Trash2, 
  BookOpen, 
  AlertCircle,
  Award,
  CheckSquare,
  Square,
  Edit3,
  CheckCircle2,
  Clock,
  Filter,
  Target
} from 'lucide-react';
import { apiClient } from '../api/client';
import { CountdownCard } from '../components/CountdownCard';
import { SectionLoader } from '../components/SectionLoader';
import SectionHeader from '../components/SectionHeader';

export const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'upcoming', 'completed'

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examType, setExamType] = useState('Midterm');
  const [totalMarks, setTotalMarks] = useState(60);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [subjectScopesMap, setSubjectScopesMap] = useState({});
  const [weightPriority, setWeightPriority] = useState(3);
  const [notes, setNotes] = useState('');
  const [isCompletedVal, setIsCompletedVal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsData, subjectsData] = await Promise.all([
        apiClient.get('/exams'),
        apiClient.get('/subjects')
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
      if (subjectsData.length > 0 && selectedSubjectIds.length === 0) {
        setSelectedSubjectIds([subjectsData[0].id]);
      }
    } catch (err) {
      console.error('Failed to load exams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setTitle('');
    setExamDate('');
    setExamType('Midterm');
    setTotalMarks(60);
    setSelectedSubjectIds(subjects.length > 0 ? [subjects[0].id] : []);
    setSubjectScopesMap({});
    setWeightPriority(3);
    setNotes('');
    setIsCompletedVal(false);
    setEditingExam(null);
    setShowAddModal(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setTitle(exam.title || '');
    setExamDate(exam.exam_date || '');
    setExamType(exam.exam_type || 'Midterm');
    setTotalMarks(exam.total_marks || 60);

    // Subject IDs & Scopes
    const subIds = exam.subject_ids || (exam.subject_id ? [exam.subject_id] : []);
    setSelectedSubjectIds(subIds);

    const scopes = {};
    if (exam.subject_scopes) {
      Object.keys(exam.subject_scopes).forEach((sId) => {
        const arr = exam.subject_scopes[sId];
        scopes[sId] = Array.isArray(arr) ? arr.join(', ') : String(arr);
      });
    }
    setSubjectScopesMap(scopes);

    setWeightPriority(exam.weight_priority || 3);
    setNotes(exam.notes || '');
    setIsCompletedVal(Boolean(exam.is_completed));
    setShowAddModal(true);
  };

  const handleToggleSubject = (sId) => {
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

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!title.trim() || !examDate) return;
    if (selectedSubjectIds.length === 0) {
      alert('Please select at least one subject included in this exam.');
      return;
    }

    try {
      const formattedScopes = {};
      selectedSubjectIds.forEach((sId) => {
        const str = subjectScopesMap[sId] || '';
        const chs = str.split(',').map((n) => parseInt(n.trim())).filter((n) => !isNaN(n));
        formattedScopes[sId] = chs.length > 0 ? chs : [1, 2, 3];
      });

      const payload = {
        title,
        exam_date: examDate,
        exam_type: examType,
        total_marks: Number(totalMarks),
        subject_ids: selectedSubjectIds,
        subject_scopes: formattedScopes,
        weight_priority: Number(weightPriority),
        notes,
        is_completed: isCompletedVal
      };

      if (editingExam) {
        await apiClient.put(`/exams/${editingExam.id}`, payload);
      } else {
        await apiClient.post('/exams', payload);
      }

      setShowAddModal(false);
      setEditingExam(null);
      await loadData();
    } catch (err) {
      alert(`Failed to save exam: ${err.message}`);
    }
  };

  const handleToggleComplete = async (exam) => {
    try {
      await apiClient.patch(`/exams/${exam.id}/complete`);
      await loadData();
    } catch (err) {
      alert(`Failed to update exam status: ${err.message}`);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam target?')) return;
    try {
      await apiClient.delete(`/exams/${examId}`);
      await loadData();
    } catch (err) {
      alert(`Failed to delete exam: ${err.message}`);
    }
  };

  // Filter exams according to active tab
  const filteredExams = exams.filter((e) => {
    if (filterTab === 'completed') return Boolean(e.is_completed);
    if (filterTab === 'upcoming') return !e.is_completed;
    return true;
  });

  const upcomingCount = exams.filter((e) => !e.is_completed).length;
  const completedCount = exams.filter((e) => e.is_completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <SectionHeader
        title="Exam Targets & Milestones"
        subtitle="Schedule and track your upcoming tests, marks, and tested subjects"
        icon={Target}
        iconColor="#ef4444"
        iconBg="rgba(239, 68, 68, 0.12)"
        tag="Milestones"
        action={
          <button
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ gap: '6px', fontSize: '0.85rem', padding: '9px 16px' }}
          >
            <Plus size={16} />
            <span>Add Exam</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setFilterTab('all')}
          className={`btn ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          All ({exams.length})
        </button>
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`btn ${filterTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          onClick={() => setFilterTab('completed')}
          className={`btn ${filterTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Exam Cards Grid */}
      {loading ? (
        <SectionLoader 
          message="Loading exam targets & countdowns..." 
          subtitle="Fetching your upcoming exam schedule and test dates..." 
          type="cards" 
        />
      ) : filteredExams.length === 0 ? (
        <div className="glass-card" style={{ padding: '36px 16px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {filterTab === 'completed' ? 'No Completed Exams' : 'No Exams Found'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px' }}>
            {filterTab === 'completed' 
              ? 'Completed exams will show up here.'
              : 'Add your upcoming tests and exams to build your study countdown.'}
          </p>
          <button onClick={openAddModal} className="btn btn-primary">
            Add Exam Target
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          width: '100%'
        }}>
          {filteredExams.map((exam) => (
            <CountdownCard
              key={exam.id}
              exam={exam}
              onEdit={() => openEditModal(exam)}
              onToggleComplete={() => handleToggleComplete(exam)}
              onDelete={() => handleDeleteExam(exam.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <SectionHeader
              title={editingExam ? 'Edit Exam Target' : 'Add Upcoming Exam Target'}
              subtitle="Set the target date and select which subjects are tested"
              icon={Target}
              iconColor="var(--primary)"
              iconBg="var(--primary-light)"
              tag="Configuration"
              compact
            />
            <form onSubmit={handleSaveExam} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Exam Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 1, Term 1 Midterms, Annual Finals"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Exam Type
                  </label>
                  <select
                    className="input-field"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final Exam</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Entrance Exam">Entrance Exam</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Total Marks *
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[20, 50, 60, 100].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTotalMarks(m)}
                          style={{
                            padding: '1px 5px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: totalMarks === m ? 'var(--primary-light)' : 'var(--bg-card)',
                            color: totalMarks === m ? 'var(--primary)' : 'var(--text-muted)',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    placeholder="60"
                    className="input-field"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                  />
                </div>
              </div>

              {/* Selectable list of added subjects only */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Subjects Tested in this Exam (From Your Added Courses):
                </label>
                {subjects.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                    No subjects found. Please add subjects first in Courses & Textbooks.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {subjects.map((s) => {
                      const isChecked = selectedSubjectIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                            backgroundColor: isChecked ? 'var(--primary-light)' : 'var(--bg-card)'
                          }}
                        >
                          <div 
                            onClick={() => handleToggleSubject(s.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          >
                            {isChecked ? <CheckSquare size={17} color="var(--primary)" /> : <Square size={17} color="var(--text-muted)" />}
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {s.name} {s.code && `(${s.code})`}
                            </span>
                          </div>

                          {isChecked && (
                            <div style={{ marginTop: '6px', paddingLeft: '25px' }}>
                              <input
                                type="text"
                                placeholder="Chapters in exam (e.g. 1, 2, 3 or empty for all)"
                                className="input-field"
                                style={{ fontSize: '0.72rem', padding: '5px 8px' }}
                                value={subjectScopesMap[s.id] || ''}
                                onChange={(e) => handleScopeChange(s.id, e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Priority Level
                  </label>
                  <select
                    className="input-field"
                    value={weightPriority}
                    onChange={(e) => setWeightPriority(Number(e.target.value))}
                  >
                    <option value={1}>1 - Low Priority</option>
                    <option value={3}>3 - Standard / Important</option>
                    <option value={5}>5 - High / Critical Target</option>
                  </select>
                </div>

                {editingExam && (
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      Exam Completion Status
                    </label>
                    <div 
                      onClick={() => setIsCompletedVal(!isCompletedVal)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-card)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isCompletedVal ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {isCompletedVal ? <CheckSquare size={16} color="var(--success)" /> : <Square size={16} />}
                      <span>{isCompletedVal ? 'Completed' : 'Pending'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Notes / Syllabus Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on Section B and numerical problems"
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExam(null);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjects.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  {editingExam ? 'Save Changes' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
