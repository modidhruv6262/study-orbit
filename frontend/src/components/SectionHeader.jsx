import React from 'react';

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  tag,
  action,
  compact = false,
  style = {}
}) {
  return (
    <div
      className={`section-header-container ${compact ? 'compact' : ''}`}
      style={style}
    >
      <div className="section-header-content">
        <div className="section-title-row">
          {Icon && (
            <div
              className="section-icon-badge"
              style={{
                backgroundColor: iconBg || 'var(--primary-light)',
                color: iconColor || 'var(--primary)',
                boxShadow: iconColor
                  ? `0 0 16px ${iconColor}35`
                  : '0 0 16px var(--primary-glow)'
              }}
            >
              <Icon size={compact ? 16 : 18} strokeWidth={2.4} />
            </div>
          )}
          <div className="section-title-accent-bar" />
          <h2 className={`section-title-text ${compact ? 'compact' : ''}`}>
            {title}
          </h2>
          {tag && (
            <span className="section-tag-pill">
              {tag}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="section-subtitle-text">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="section-action-slot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
