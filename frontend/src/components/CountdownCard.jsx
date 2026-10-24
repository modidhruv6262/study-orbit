import React from 'react';
import { Calendar, CheckCircle2, AlertTriangle, BookCheck, Award, Layers, Trash2, Edit3, CheckSquare, Square } from 'lucide-react';

export const CountdownCard = ({ exam, onSelectExam, onEdit, onToggleComplete, onDelete }) => {
  const daysLeft = exam.days_left;
  const isCompleted = Boolean(exam.is_completed);

  let badgeClass = 'badge-normal';
  let urgencyText = `${daysLeft} Days Left`;

  if (isCompleted) {
    badgeClass = 'badge-success';
    urgencyText = 'Completed ✓';
  } else if (daysLeft < 0) {
    badgeClass = 'badge-urgent';
    urgencyText = 'Exam Passed';
  } else if (daysLeft === 0) {
    badgeClass = 'badge-urgent';
    urgencyText = 'TODAY!';
  } else if (daysLeft <= 5) {
    badgeClass = 'badge-urgent';
    urgencyText = `${daysLeft} Days Left!`;
  } else if (daysLeft <= 14) {
    badgeClass = 'badge-warning';
  }

  const progress = Math.min(100, Math.max(0, exam.progress_percentage || 0));
  const subjectsList = exam.subjects_info || [];
  const primaryColor = isCompleted 
    ? 'var(--success)' 
    : (subjectsList.length > 0 ? subjectsList[0].color : (exam.subject_color || 'var(--primary)'));

  return (
    <div 
      className="glass-card" 
      style={{
        padding: '18px 20px',
        borderLeft: `5px solid ${primaryColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onSelectExam ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '165px',
        opacity: isCompleted ? 0.8 : 1
      }}
      onClick={() => onSelectExam && onSelectExam(exam)}
    >
      <div>
        {/* Top line: Marks Badge + Urgency Countdown + Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {exam.total_marks && (
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isCompleted ? 'var(--success)' : 'var(--primary)',
                backgroundColor: isCompleted ? '#dcfce7' : 'var(--primary-light)',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Award size={12} />
                {exam.total_marks} Marks
              </span>
            )}
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              • {exam.exam_type}
            </span>
          </div>

          {/* Action buttons (Cleanly separated, not merged) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`badge ${badgeClass}`}>
              {urgencyText}
            </span>

            {/* Toggle Complete */}
            {onToggleComplete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(exam);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
              >
                {isCompleted ? <CheckSquare size={16} color="var(--success)" /> : <Square size={16} />}
              </button>
            )}

            {/* Edit */}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(exam);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Edit Exam"
              >
                <Edit3 size={15} />
              </button>
            )}

            {/* Delete (Cleanly unmerged) */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(exam);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Delete Exam"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 800,
          color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
          marginBottom: '8px'
        }}>
          {exam.title}
        </h3>

        {/* Subject pills list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {subjectsList.length > 0 ? (
            subjectsList.map((s) => (
              <span
                key={s.id}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-card-subtle)',
                  color: s.color || 'var(--primary)',
                  border: `1px solid ${s.color || '#cbd5e1'}40`,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                ● {s.name}
              </span>
            ))
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {exam.subject_name || 'All Enrolled Subjects'}
            </span>
          )}
        </div>

        {/* Date & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            {new Date(exam.exam_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {exam.total_target_chapters > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={13} />
              {exam.total_target_chapters} Chapters in Scope
            </span>
          )}
        </div>

        {/* Detailed Subject Scope Breakdown (Scrollable if multiple) */}
        {subjectsList.length > 0 && (
          <div style={{
            margin: '8px 0 14px 0',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <span>Exam Scope Subjects ({subjectsList.length})</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Target Outline
              </span>
            </div>

            {/* Scrollable list of subjects */}
            <div style={{
              maxHeight: '135px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '4px'
            }}>
              {subjectsList.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: s.color || 'var(--primary)',
                      flexShrink: 0
                    }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.name}
                    </span>
                    {s.code && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        ({s.code})
                      </span>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}>
                    {s.target_chapters && s.target_chapters.length > 0
                      ? `${s.target_chapters.length} Ch. (Ch. ${s.target_chapters.join(', ')})`
                      : 'All Syllabus'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
          <span>{isCompleted ? 'Target Achieved' : 'Prepared Syllabus'}</span>
          <span>{isCompleted ? '100%' : `${progress}%`}</span>
        </div>
        <div style={{
          width: '100%',
          height: '7px',
          backgroundColor: 'var(--bg-card-subtle)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${isCompleted ? 100 : progress}%`,
            height: '100%',
            backgroundColor: isCompleted ? 'var(--success)' : (progress >= 80 ? 'var(--success)' : primaryColor),
            borderRadius: '4px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>
    </div>
  );
};
