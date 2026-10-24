import { jsPDF } from 'jspdf';

// Helper: Convert hex color string to RGB object
function hexToRgb(hex, fallback = { r: 79, g: 70, b: 229 }) {
  if (!hex || typeof hex !== 'string') return fallback;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return fallback;
}

const THEME_HEX = {
  indigo: '#4f46e5',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  emerald: '#10b981',
  rose: '#f43f5e',
};

/**
 * Renders the official StudyOrbit SVG logo onto an offscreen canvas
 * and returns a crisp 256x256 PNG Data URL.
 */
function renderLogoToDataUrl() {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(null);
      }
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">
        <defs>
          <linearGradient id="orbitBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="50%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#7c3aed" />
          </linearGradient>
          <linearGradient id="orbitRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
            <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#818cf8" stop-opacity="0.4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#orbitBg)" />
        <ellipse cx="32" cy="33" rx="25" ry="9" transform="rotate(-24 32 33)" stroke="url(#orbitRing)" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <circle cx="53" cy="24" r="3" fill="#38bdf8" />
        <circle cx="11" cy="42" r="1.8" fill="#a5b4fc" opacity="0.8" />
        <polygon points="32,18 51,27 32,36 13,27" fill="#ffffff" />
        <polygon points="32,36 51,27 49,29 32,37.5 15,29 13,27" fill="#e0e7ff" opacity="0.85" />
        <path d="M21,31.5 L21,40 C21,44.5 43,44.5 43,40 L43,31.5 C39.5,33.5 35.8,34.5 32,34.5 C28.2,34.5 24.5,33.5 21,31.5 Z" fill="#f8fafc" />
        <path d="M44,28.5 L44,38.5 C44,40 46.5,40 46.5,38.5 L46.5,37" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" fill="none" />
        <circle cx="44" cy="28.5" r="1.3" fill="#f59e0b" />
      </svg>`;
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 256, 256);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generates an executive, highly decorated, informative Study Timetable PDF
 * complete with official app logo, subject distribution matrix, pacing metrics,
 * detailed task blocks (WITHOUT checkboxes), and verified app header/footer.
 */
export async function exportScheduleToPdf({ schedule, user, themeColor = 'indigo' }) {
  if (!schedule || !schedule.tasks || schedule.tasks.length === 0) {
    throw new Error('No study schedule tasks available to export.');
  }

  // Pre-render logo
  const logoDataUrl = await renderLogoToDataUrl();

  const primaryHex = THEME_HEX[themeColor] || THEME_HEX.indigo;
  const primaryRgb = hexToRgb(primaryHex);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  const bottomMargin = 18;

  let currentY = margin;

  // 1. App Header with Official Logo & Student Metadata
  const drawMainHeader = () => {
    // Top dual-tone decorative ribbon
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, 4.5, 'F');
    doc.setFillColor(56, 189, 248); // sky-400 accent stripe
    doc.rect(0, 4.5, pageWidth, 1.2, 'F');

    // Logo (App logo image or styled fallback)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, 10, 15, 15);
      } catch {
        drawFallbackLogo(margin, 10);
      }
    } else {
      drawFallbackLogo(margin, 10);
    }

    // App Branding & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('StudyOrbit', margin + 18, 17);

    // Official Verification Pill
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(margin + 54, 12.5, 33, 5, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(255, 255, 255);
    doc.text('MASTER STUDY TIMETABLE', margin + 55.5, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('AI Academic Companion & Strategic Exam Syllabus Plan', margin + 18, 22.5);

    // Student Metadata Card (Top Right)
    const metaCardWidth = 62;
    const metaCardHeight = 16;
    const metaCardX = pageWidth - margin - metaCardWidth;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(metaCardX, 9.5, metaCardWidth, metaCardHeight, 2, 2, 'FD');

    const studentName = user?.full_name || 'Academic Scholar';
    const studentEmail = user?.email || 'StudyOrbit Account';
    const genDateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('STUDENT PROFILE', metaCardX + 3.5, 13.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const clippedName = doc.splitTextToSize(studentName, metaCardWidth - 7)[0];
    doc.text(clippedName, metaCardX + 3.5, 17.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${studentEmail}  •  ${genDateStr}`, metaCardX + 3.5, 22);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, 28, pageWidth - margin, 28);

    currentY = 32;
  };

  const drawFallbackLogo = (x, y) => {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(x, y, 14, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SO', x + 3.5, y + 9.5);
  };

  // 2. Executive Analytics & Strategic Pacing Strip
  const drawSummaryCard = () => {
    const totalTasks = schedule.tasks.length;
    const totalMinutes = schedule.tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Count unique dates
    const dateSet = new Set(schedule.tasks.map((t) => t.scheduled_date || ''));
    const totalDays = Math.max(1, dateSet.size);
    const avgDailyHours = (totalHours / totalDays).toFixed(1);

    const cardHeight = 22;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'FD');

    // Left border primary accent
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(margin, currentY, 3, cardHeight, 1, 1, 'F');

    const colWidth = contentWidth / 4;
    const stats = [
      { label: 'PLAN TITLE', value: schedule.title || 'Master Timetable' },
      { label: 'TOTAL STUDY LOAD', value: `${totalHours} Hours (${totalTasks} Blocks)` },
      { label: 'DAILY AVERAGE PACE', value: `${avgDailyHours} hrs/day (${totalDays} Days)` },
      { label: 'REVISION BUFFERS', value: `${schedule.buffer_days_total || 3} Days Reserved` },
    ];

    stats.forEach((st, idx) => {
      const colX = margin + 6 + idx * colWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(st.label, colX, currentY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // slate-900
      const valLines = doc.splitTextToSize(st.value, colWidth - 8);
      doc.text(valLines[0], colX, currentY + 14);
    });

    currentY += cardHeight + 6;
  };

  // 3. Subject Distribution Matrix Table (More Information on Page 1)
  const drawSubjectDistributionTable = () => {
    // Aggregate subject statistics
    const subjectMap = new Map();
    schedule.tasks.forEach((task) => {
      const name = task.subject_name || 'General';
      const color = task.subject_color || primaryHex;
      if (!subjectMap.has(name)) {
        subjectMap.set(name, {
          name,
          color,
          taskCount: 0,
          totalMinutes: 0,
          chapters: new Set(),
        });
      }
      const item = subjectMap.get(name);
      item.taskCount += 1;
      item.totalMinutes += task.estimated_minutes || 30;
      if (task.chapter_title) item.chapters.add(task.chapter_title);
    });

    const subjects = Array.from(subjectMap.values());
    if (subjects.length === 0) return;

    // Header label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('COURSE & SUBJECT ALLOCATION BREAKDOWN', margin, currentY);

    currentY += 3.5;

    // Table Header Row
    const tableHeaderHeight = 6.5;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, tableHeaderHeight, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('SUBJECT', margin + 5, currentY + 4.5);
    doc.text('STUDY SESSIONS', margin + 65, currentY + 4.5);
    doc.text('TIME ALLOCATED', margin + 105, currentY + 4.5);
    doc.text('CHAPTERS', margin + 145, currentY + 4.5);
    doc.text('SHARE', pageWidth - margin - 4, currentY + 4.5, { align: 'right' });

    currentY += tableHeaderHeight + 1.5;

    const grandTotalMins = schedule.tasks.reduce(
      (acc, t) => acc + (t.estimated_minutes || 0),
      0
    ) || 1;

    subjects.forEach((subj) => {
      const rowHeight = 7.5;
      const rgb = hexToRgb(subj.color, primaryRgb);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, rowHeight, 1, 1, 'FD');

      // Subject dot indicator
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(margin + 6, currentY + 3.8, 1.5, 'F');

      // Subject Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(subj.name, margin + 11, currentY + 4.8);

      // Tasks count
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text(`${subj.taskCount} Blocks`, margin + 65, currentY + 4.8);

      // Total Time
      const hrs = (subj.totalMinutes / 60).toFixed(1);
      doc.text(`${hrs} hrs (${subj.totalMinutes}m)`, margin + 105, currentY + 4.8);

      // Chapters count
      doc.text(`${subj.chapters.size} Chapters`, margin + 145, currentY + 4.8);

      // Share %
      const pct = Math.round((subj.totalMinutes / grandTotalMins) * 100);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(`${pct}%`, pageWidth - margin - 4, currentY + 4.8, { align: 'right' });

      currentY += rowHeight + 1.2;
    });

    currentY += 6;
  };

  // Sub-header for subsequent pages
  const drawSubHeader = () => {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, 3, 'F');
    doc.setFillColor(56, 189, 248);
    doc.rect(0, 3, pageWidth, 0.8, 'F');

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, 6.5, 7, 7);
      } catch {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('StudyOrbit • Daily Study Timetable', margin + 9, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(schedule.title || 'Master Plan', pageWidth - margin, 11, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 15, pageWidth - margin, 15);

    currentY = 20;
  };

  const ensureSpace = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawSubHeader();
      return true;
    }
    return false;
  };

  // Draw Page 1 Visual Structure
  drawMainHeader();
  drawSummaryCard();
  drawSubjectDistributionTable();

  // 4. Chronological Daily Study Schedule
  const groupedTasks = {};
  schedule.tasks.forEach((task) => {
    const d = task.scheduled_date || 'Undated';
    if (!groupedTasks[d]) groupedTasks[d] = [];
    groupedTasks[d].push(task);
  });

  const sortedDates = Object.keys(groupedTasks).sort();

  sortedDates.forEach((dateStr) => {
    const tasks = groupedTasks[dateStr];
    const totalDayMins = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const dayHours = (totalDayMins / 60).toFixed(1);

    let formattedDate = dateStr;
    let dayOfWeek = '';
    try {
      if (dateStr !== 'Undated') {
        const dObj = new Date(dateStr + 'T00:00:00');
        dayOfWeek = dObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        formattedDate = dObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      formattedDate = dateStr;
    }

    // Ensure space for Date Ribbon + at least 1 task
    ensureSpace(32);

    // Date Ribbon (High-end decorated banner)
    const ribbonHeight = 8.5;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY, contentWidth, ribbonHeight, 2, 2, 'F');

    // Calendar Day Chip (Primary theme block)
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(margin + 1.2, currentY + 1.2, 17, ribbonHeight - 2.4, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(255, 255, 255);
    doc.text(dayOfWeek.substring(0, 3) || 'DAY', margin + 9.7, currentY + 5.2, { align: 'center' });

    // Date Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${formattedDate}`, margin + 22, currentY + 5.8);

    // Right Badges (Task count & duration)
    const dayStatText = `${tasks.length} ${tasks.length === 1 ? 'Session' : 'Sessions'}  •  ${totalDayMins} mins (${dayHours} hrs)`;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - margin - 52, currentY + 1.8, 50, 5, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(dayStatText, pageWidth - margin - 27, currentY + 5.2, { align: 'center' });

    currentY += ribbonHeight + 3.5;

    // Render individual task cards (WITHOUT checkbox)
    tasks.forEach((task, index) => {
      const subjColor = hexToRgb(task.subject_color || primaryHex, primaryRgb);

      // Title & subtopic lines calculation
      const taskTitle = `${task.chapter_title ? task.chapter_title + ': ' : ''}${task.topic_title || 'Core Study Block'}`;
      const titleLines = doc.splitTextToSize(taskTitle, contentWidth - 48);
      const hasSubtopic = Boolean(task.subtopic_title);

      const hasPageInfo = Boolean(task.page_start && task.page_end);
      const pageCount = hasPageInfo ? task.page_end - task.page_start + 1 : 0;

      const cardHeight = Math.max(16, 12 + titleLines.length * 4.2 + (hasSubtopic ? 4.5 : 0));

      ensureSpace(cardHeight + 4);

      // Task Card Container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'FD');

      // Left subject color accent stripe
      doc.setFillColor(subjColor.r, subjColor.g, subjColor.b);
      doc.roundedRect(margin, currentY, 2.8, cardHeight, 1, 1, 'F');

      // Session Sequence Index Pill (e.g. 01, 02) - Replacing checkmark box
      const indexPillX = margin + 5.5;
      const indexPillY = currentY + 4;
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(indexPillX, indexPillY, 8.5, 6.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const sessionNum = String(index + 1).padStart(2, '0');
      doc.text(sessionNum, indexPillX + 4.25, indexPillY + 4.5, { align: 'center' });

      // Details Start X
      const contentStartX = margin + 17;
      let textCursorY = currentY + 5;

      // Subject Badge Pill
      const subjectName = (task.subject_name || 'GENERAL').toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      const badgeTextWidth = doc.getTextWidth(subjectName);

      // Subject Pill Background
      doc.setFillColor(
        Math.min(255, subjColor.r + 170),
        Math.min(255, subjColor.g + 170),
        Math.min(255, subjColor.b + 170)
      );
      doc.roundedRect(contentStartX, textCursorY - 2.5, badgeTextWidth + 4, 4, 1, 1, 'F');

      doc.setTextColor(subjColor.r, subjColor.g, subjColor.b);
      doc.text(subjectName, contentStartX + 2, textCursorY + 0.4);

      let badgeOffset = contentStartX + badgeTextWidth + 6.5;

      // Revision Focus Badge if applicable
      if (task.is_revision) {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(badgeOffset, textCursorY - 2.5, 17, 4, 1, 1, 'F');
        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.text('REVISION FOCUS', badgeOffset + 1.5, textCursorY + 0.4);
        badgeOffset += 19.5;
      }

      // Textbook Pages & Estimated Pace Scope
      if (hasPageInfo) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        const paceStr = `pp. ${task.page_start}–${task.page_end} (${pageCount} pages)`;
        doc.text(paceStr, badgeOffset, textCursorY + 0.4);
      }

      // Title & Topic
      textCursorY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.4);
      doc.setTextColor(15, 23, 42); // slate-900

      titleLines.forEach((line) => {
        doc.text(line, contentStartX, textCursorY);
        textCursorY += 4;
      });

      // Subtopics / Learning Objective breakdown
      if (hasSubtopic) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(100, 116, 139);
        const subtopicText = `Key Concepts: ${task.subtopic_title}`;
        const subtopicLine = doc.splitTextToSize(subtopicText, contentWidth - 48)[0];
        doc.text(subtopicLine, contentStartX, textCursorY);
      }

      // Right-aligned Duration & Focus Mode Badge
      const rightBadgeX = pageWidth - margin - 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`${task.estimated_minutes || 45} mins`, rightBadgeX, currentY + 6.2, {
        align: 'right',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      const studyMode = task.is_revision ? 'Active Recall' : 'Deep Study';
      doc.text(studyMode, rightBadgeX, currentY + 10.5, { align: 'right' });

      currentY += cardHeight + 2.8;
    });

    currentY += 4;
  });

  // 5. Verified Multi-Page Footers (on every page)
  const totalPages = doc.getNumberOfPages();
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Double-line footer separator
    doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12.2, pageWidth - margin, pageHeight - 12.2);

    // Left brand note & URL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text('StudyOrbit', margin, pageHeight - 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `  •  AI Academic Companion & Strategic Planner  •  study-orbit-zeta.vercel.app  •  Printed ${timeStr}`,
      margin + 14,
      pageHeight - 7.5
    );

    // Right page count
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`PAGE ${i} OF ${totalPages}`, pageWidth - margin, pageHeight - 7.5, {
      align: 'right',
    });
  }

  // Trigger instant browser download
  const cleanTitle = (schedule.title || 'StudyOrbit_Timetable').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}.pdf`);
}
