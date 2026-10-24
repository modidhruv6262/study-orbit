import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Sparkles,
  AlertCircle,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { apiClient } from '../api/client';
import SectionHeader from '../components/SectionHeader';

export const TextbooksPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Add / Edit Subject Modals
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjColor, setSubjColor] = useState('#4f46e5');
  const [subjDifficulty, setSubjDifficulty] = useState(3);

  // Edit Syllabus / Hierarchy Modal
  const [showEditHierarchy, setShowEditHierarchy] = useState(false);
  const [editableChapters, setEditableChapters] = useState([]);

  // Expanded chapter accordions
  const [expandedChapters, setExpandedChapters] = useState({});

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/subjects');
      setSubjects(data);
      if (data.length > 0) {
        const current = selectedSubject ? data.find((s) => s.id === selectedSubject.id) || data[0] : data[0];
        setSelectedSubject(current);
        loadHierarchy(current.id);
      } else {
        setSelectedSubject(null);
        setHierarchy(null);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHierarchy = async (subjectId) => {
    try {
      setHierarchy(null);
      const hData = await apiClient.get(`/documents/subject/${subjectId}/hierarchy`);
      setHierarchy(hData);
    } catch (err) {
      setHierarchy(null);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleSelectSubject = (subj) => {
    setSelectedSubject(subj);
    loadHierarchy(subj.id);
  };

  const openAddSubjectModal = () => {
    setSubjName('');
    setSubjCode('');
    setSubjColor('#4f46e5');
    setSubjDifficulty(3);
    setShowAddSubject(true);
  };

  const openEditSubjectModal = () => {
    if (!selectedSubject) return;
    setSubjName(selectedSubject.name || '');
    setSubjCode(selectedSubject.code || '');
    setSubjColor(selectedSubject.color_code || '#4f46e5');
    setSubjDifficulty(selectedSubject.difficulty_rating || 3);
    setShowEditSubject(true);
  };

  const handleSaveNewSubject = async (e) => {
    e.preventDefault();
    if (!subjName.trim()) return;

    try {
      const created = await apiClient.post('/subjects', {
        name: subjName,
        code: subjCode,
        color_code: subjColor,
        difficulty_rating: Number(subjDifficulty)
      });
      setShowAddSubject(false);
      await loadSubjects();
      setSelectedSubject(created);
      loadHierarchy(created.id);
    } catch (err) {
      alert(`Error creating subject: ${err.message}`);
    }
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !subjName.trim()) return;

    try {
      const updated = await apiClient.put(`/subjects/${selectedSubject.id}`, {
        name: subjName,
        code: subjCode,
        color_code: subjColor,
        difficulty_rating: Number(subjDifficulty)
      });
      setShowEditSubject(false);
      setSelectedSubject(updated);
      await loadSubjects();
    } catch (err) {
      alert(`Error updating subject: ${err.message}`);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSubject.name} and all its textbooks?`)) return;

    try {
      await apiClient.delete(`/subjects/${selectedSubject.id}`);
      setSelectedSubject(null);
      setHierarchy(null);
      await loadSubjects();
    } catch (err) {
      alert(`Error deleting subject: ${err.message}`);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedSubject) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('subject_id', selectedSubject.id);
      formData.append('file', file);

      await apiClient.upload('/documents/upload', formData);
      await loadSubjects();
      await loadHierarchy(selectedSubject.id);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Hierarchy editing handlers
  const openEditHierarchyModal = () => {
    const currentChapters = hierarchy?.structure_json?.chapters || [
      {
        chapter_number: 1,
        chapter_title: 'Chapter 1: Foundations',
        page_start: 1,
        page_end: 20,
        estimated_study_minutes: 120,
        topics: [
          {
            topic_id: '1.1',
            title: 'Core Concepts',
            page_start: 1,
            page_end: 10,
            subtopics: ['Definitions', 'Formulas'],
            estimated_minutes: 45
          }
        ]
      }
    ];
    setEditableChapters(JSON.parse(JSON.stringify(currentChapters)));
    setShowEditHierarchy(true);
  };

  const handleChapterFieldChange = (chIdx, field, val) => {
    setEditableChapters((prev) => {
      const clone = [...prev];
      clone[chIdx] = { ...clone[chIdx], [field]: val };
      return clone;
    });
  };

  const handleAddChapter = () => {
    setEditableChapters((prev) => {
      const nextNum = prev.length + 1;
      const lastCh = prev[prev.length - 1];
      const startPage = lastCh ? Number(lastCh.page_end) + 1 : 1;
      return [
        ...prev,
        {
          chapter_number: nextNum,
          chapter_title: `Chapter ${nextNum}: New Unit`,
          page_start: startPage,
          page_end: startPage + 20,
          estimated_study_minutes: 120,
          topics: [
            {
              topic_id: `${nextNum}.1`,
              title: `Fundamentals of Unit ${nextNum}`,
              page_start: startPage,
              page_end: startPage + 10,
              subtopics: ['Core Concepts'],
              estimated_minutes: 45
            }
          ]
        }
      ];
    });
  };

  const handleDeleteChapter = (chIdx) => {
    if (editableChapters.length <= 1) {
      alert('You must have at least one chapter.');
      return;
    }
    setEditableChapters((prev) => prev.filter((_, idx) => idx !== chIdx));
  };

  const handleAddTopic = (chIdx) => {
    setEditableChapters((prev) => {
      const clone = [...prev];
      const ch = clone[chIdx];
      const topNum = (ch.topics?.length || 0) + 1;
      const newTopic = {
        topic_id: `${ch.chapter_number}.${topNum}`,
        title: `Topic ${topNum}: New Section`,
        page_start: ch.page_start,
        page_end: ch.page_end,
        subtopics: ['Key Review'],
        estimated_minutes: 45
      };
      clone[chIdx] = {
        ...ch,
        topics: [...(ch.topics || []), newTopic]
      };
      return clone;
    });
  };

  const handleDeleteTopic = (chIdx, topIdx) => {
    setEditableChapters((prev) => {
      const clone = [...prev];
      const ch = clone[chIdx];
      clone[chIdx] = {
        ...ch,
        topics: ch.topics.filter((_, idx) => idx !== topIdx)
      };
      return clone;
    });
  };

  const handleSaveHierarchy = async () => {
    if (!selectedSubject) return;
    try {
      const payload = {
        subject: selectedSubject.name,
        chapters: editableChapters
      };
      await apiClient.put(`/documents/subject/${selectedSubject.id}/hierarchy`, payload);
      setShowEditHierarchy(false);
      await loadHierarchy(selectedSubject.id);
    } catch (err) {
      alert(`Failed to save syllabus: ${err.message}`);
    }
  };

  const toggleChapter = (chNum) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chNum]: !prev[chNum]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <SectionHeader
        title="Coursework & Textbooks"
        subtitle="Manage subjects, upload PDFs, and edit textbook outlines"
        icon={BookOpen}
        iconColor="var(--primary)"
        iconBg="var(--primary-light)"
        tag="Curriculum"
        action={
          <button
            onClick={openAddSubjectModal}
            className="btn btn-primary"
            style={{ gap: '6px', fontSize: '0.85rem', padding: '9px 16px' }}
          >
            <Plus size={16} />
            <span>New Subject</span>
          </button>
        }
      />

      {/* Main Grid: Subject List on Left, Coursework Outline on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Subjects Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SectionHeader
            title={`Enrolled Courses (${subjects.length})`}
            subtitle="Select a course to inspect outline"
            icon={BookOpen}
            iconColor="var(--primary)"
            tag="Catalog"
            compact
          />

          {subjects.length === 0 ? (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                No courses added yet. Add your first subject to start building your study plan.
              </p>
              <button onClick={openAddSubjectModal} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                Add Subject
              </button>
            </div>
          ) : (
            subjects.map((subj) => {
              const isSelected = selectedSubject?.id === subj.id;
              return (
                <div
                  key={subj.id}
                  onClick={() => handleSelectSubject(subj)}
                  className="glass-card"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: isSelected ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                    borderLeft: `5px solid ${subj.color_code || 'var(--primary)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {subj.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>{subj.code || 'No code'}</span>
                      <span>• Difficulty: {subj.difficulty_rating}/5</span>
                    </div>
                  </div>
                  <div>
                    {subj.has_textbook ? (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        PDF Ready
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        No PDF
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Subject Coursework & Hierarchy Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {selectedSubject ? (
            <div className="glass-card" style={{ padding: '20px' }}>
              {/* Header inside card */}
              <SectionHeader
                title={selectedSubject.name}
                subtitle={`${selectedSubject.code ? `Course Code: ${selectedSubject.code} • ` : ''}Difficulty: ${selectedSubject.difficulty_rating}/5`}
                icon={Layers}
                iconColor={selectedSubject.color_code || 'var(--primary)'}
                iconBg={selectedSubject.color_code ? `${selectedSubject.color_code}22` : 'var(--primary-light)'}
                tag="Syllabus"
                compact
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={openEditSubjectModal}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '4px' }}
                      title="Edit Course Name & Settings"
                    >
                      <Edit3 size={14} />
                      <span>Edit Course</span>
                    </button>

                    <button
                      onClick={handleDeleteSubject}
                      className="btn btn-ghost"
                      style={{ padding: '6px', color: 'var(--text-muted)' }}
                      title="Delete Course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                }
              />

              {/* Action Toolbar for Materials */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '10px 12px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <Layers size={16} color="var(--primary)" />
                  <span>
                    {hierarchy ? `${hierarchy.total_chapters} Chapters • ${hierarchy.total_topics} Topics` : 'No Syllabus Mapped'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Edit Syllabus Outline Button */}
                  <button
                    onClick={openEditHierarchyModal}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '5px' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Outline</span>
                  </button>

                  {/* Upload / Replace PDF Button */}
                  <label className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', cursor: uploading ? 'wait' : 'pointer', gap: '5px' }}>
                    <Upload size={14} />
                    <span>{uploading ? 'Indexing...' : 'Upload PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Uploading progress indicator */}
              {uploading && (
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  <Sparkles size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                    Scanning & Indexing Full Document...
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Extracting Table of Contents, Chapters, and Subtopics across all pages
                  </p>
                </div>
              )}

              {/* Chapters & Topics List */}
              {hierarchy && hierarchy.structure_json?.chapters?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {hierarchy.structure_json.chapters.map((ch) => {
                    const isExpanded = !!expandedChapters[ch.chapter_number];
                    return (
                      <div
                        key={ch.chapter_number}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Chapter Header */}
                        <div
                          onClick={() => toggleChapter(ch.chapter_number)}
                          style={{
                            padding: '10px 14px',
                            backgroundColor: isExpanded ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {ch.chapter_title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span>pp. {ch.page_start}–{ch.page_end}</span>
                            <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>
                              {ch.topics?.length || 0} Topics
                            </span>
                          </div>
                        </div>

                        {/* Topics List */}
                        {isExpanded && (
                          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-main)', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {ch.topics?.map((top) => (
                                <div
                                  key={top.topic_id}
                                  style={{
                                    padding: '7px 10px',
                                    backgroundColor: 'var(--bg-card)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                      {top.topic_id} {top.title}
                                    </span>
                                    {top.subtopics?.length > 0 && (
                                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Subtopics: {top.subtopics.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)' }}>
                                    pp. {top.page_start}–{top.page_end} ({top.estimated_minutes || 45}m)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  border: '2px dashed var(--border)',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card-subtle)'
                }}>
                  <BookOpen size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No Syllabus Index Yet
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto 12px' }}>
                    Upload a textbook PDF to automatically extract chapters, or click "Edit Outline" to manually set up your coursework.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={openEditHierarchyModal} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                      Create Outline Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select a course or add a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', padding: '22px' }}>
            <SectionHeader
              title="Add New Course"
              subtitle="Define subject name, code, and difficulty"
              icon={Plus}
              iconColor="var(--primary)"
              iconBg="var(--primary-light)"
              tag="New Course"
              compact
            />
            <form onSubmit={handleSaveNewSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Course / Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems, Calculus III"
                  className="input-field"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Course Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS301"
                  className="input-field"
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Difficulty Rating
                </label>
                <select
                  className="input-field"
                  value={subjDifficulty}
                  onChange={(e) => setSubjDifficulty(Number(e.target.value))}
                >
                  <option value={1}>1 - Easy / Fast Pace</option>
                  <option value={2}>2 - Moderately Easy</option>
                  <option value={3}>3 - Standard Moderate</option>
                  <option value={4}>4 - Challenging</option>
                  <option value={5}>5 - Very Difficult / High Priority</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Theme Color
                </label>
                <input
                  type="color"
                  value={subjColor}
                  onChange={(e) => setSubjColor(e.target.value)}
                  style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditSubject && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', padding: '22px' }}>
            <SectionHeader
              title="Edit Course Details"
              subtitle="Update course properties and theme color"
              icon={Edit3}
              iconColor="var(--primary)"
              iconBg="var(--primary-light)"
              tag="Configuration"
              compact
            />
            <form onSubmit={handleUpdateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Course / Subject Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Course Code (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Difficulty Rating
                </label>
                <select
                  className="input-field"
                  value={subjDifficulty}
                  onChange={(e) => setSubjDifficulty(Number(e.target.value))}
                >
                  <option value={1}>1 - Easy</option>
                  <option value={2}>2 - Moderately Easy</option>
                  <option value={3}>3 - Standard Moderate</option>
                  <option value={4}>4 - Challenging</option>
                  <option value={5}>5 - High Priority</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Theme Color
                </label>
                <input
                  type="color"
                  value={subjColor}
                  onChange={(e) => setSubjColor(e.target.value)}
                  style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditSubject(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coursework / Hierarchy Modal */}
      {showEditHierarchy && (
        <div className="modal-overlay" style={{ zIndex: 90 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px 20px' }}>
            <SectionHeader
              title="Edit Syllabus & Chapters"
              subtitle={`Customize chapters, topics, and page ranges for ${selectedSubject?.name}`}
              icon={Layers}
              iconColor="var(--primary)"
              iconBg="var(--primary-light)"
              tag="Outline"
              compact
              action={
                <button
                  onClick={() => setShowEditHierarchy(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {editableChapters.map((ch, chIdx) => (
                <div 
                  key={chIdx}
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        Ch {ch.chapter_number}
                      </span>
                      <input
                        type="text"
                        className="input-field"
                        style={{ fontSize: '0.82rem', padding: '5px 8px', flex: 1 }}
                        value={ch.chapter_title}
                        onChange={(e) => handleChapterFieldChange(chIdx, 'chapter_title', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chIdx)}
                      className="btn btn-ghost"
                      style={{ padding: '4px', color: 'var(--danger)' }}
                      title="Delete Chapter"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Page ranges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Start Page:</span>
                      <input
                        type="number"
                        className="input-field"
                        style={{ width: '65px', fontSize: '0.75rem', padding: '3px 6px' }}
                        value={ch.page_start}
                        onChange={(e) => handleChapterFieldChange(chIdx, 'page_start', Number(e.target.value))}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>End Page:</span>
                      <input
                        type="number"
                        className="input-field"
                        style={{ width: '65px', fontSize: '0.75rem', padding: '3px 6px' }}
                        value={ch.page_end}
                        onChange={(e) => handleChapterFieldChange(chIdx, 'page_end', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Topics List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px', borderLeft: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Topics ({ch.topics?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddTopic(chIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Plus size={12} /> Add Topic
                      </button>
                    </div>

                    {ch.topics?.map((top, topIdx) => (
                      <div key={topIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '28px' }}>
                          {top.topic_id}
                        </span>
                        <input
                          type="text"
                          className="input-field"
                          style={{ fontSize: '0.75rem', padding: '4px 6px', flex: 1 }}
                          value={top.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setEditableChapters((prev) => {
                              const clone = [...prev];
                              const chapter = clone[chIdx];
                              const tps = [...chapter.topics];
                              tps[topIdx] = { ...tps[topIdx], title: newTitle };
                              clone[chIdx] = { ...chapter, topics: tps };
                              return clone;
                            });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(chIdx, topIdx)}
                          className="btn btn-ghost"
                          style={{ padding: '2px', color: 'var(--text-muted)' }}
                          title="Remove Topic"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddChapter}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '8px', fontSize: '0.82rem', gap: '6px' }}
              >
                <Plus size={15} />
                <span>Add Chapter</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowEditHierarchy(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHierarchy}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem', gap: '5px' }}
              >
                <Save size={14} />
                <span>Save Syllabus Outline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
