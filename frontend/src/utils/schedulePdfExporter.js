import { jsPDF } from 'jspdf';

// Convert hex color to RGB object
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
 * Generates a styled, multi-page Study Timetable PDF
 * matching StudyOrbit branding, theme, header, and footer.
 */
export function exportScheduleToPdf({ schedule, user, themeColor = 'indigo' }) {
  if (!schedule || !schedule.tasks || schedule.tasks.length === 0) {
    throw new Error('No study schedule tasks found to export.');
  }

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
  const bottomMargin = 20;

  let currentY = margin;

  // Helper: Draw Brand Header on first page
  const drawMainHeader = () => {
    // Top colored accent bar
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Logo Emblem
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(margin, 12, 10, 10, 2.5, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SO', margin + 2.2, 18.5);

    // App Name & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('StudyOrbit', margin + 13, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('AI Academic Companion & Master Study Timetable', margin + 13, 21.5);

    // Right-aligned Metadata
    const genDateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const studentName = user?.full_name || user?.email || 'StudyOrbit Student';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('PREPARED FOR:', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(studentName, pageWidth - margin, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${genDateStr}`, pageWidth - margin, 22, { align: 'right' });

    // Thin separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, 25, pageWidth - margin, 25);

    currentY = 30;
  };

  // Helper: Draw Plan Summary Strip
  const drawSummaryCard = () => {
    const totalTasks = schedule.tasks.length;
    const completedTasks = schedule.tasks.filter((t) => t.status === 'completed').length;
    const totalMinutes = schedule.tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const cardHeight = 22;
    // Card Background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'FD');

    // Left border accent
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.roundedRect(margin, currentY, 2.5, cardHeight, 1, 1, 'F');

    const colWidth = contentWidth / 4;
    const stats = [
      { label: 'SCHEDULE PLAN', value: schedule.title || 'Master Timetable' },
      { label: 'TOTAL STUDY BLOCKS', value: `${totalTasks} Tasks (${totalHours} hrs)` },
      { label: 'COMPLETION STATUS', value: `${completedTasks} / ${totalTasks} (${progressPct}%)` },
      { label: 'REVISION BUFFERS', value: `${schedule.buffer_days_total || 3} Days Reserved` },
    ];

    stats.forEach((st, idx) => {
      const colX = margin + 5 + idx * colWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(st.label, colX, currentY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // slate-900
      // Clip text to avoid overflow
      const valLines = doc.splitTextToSize(st.value, colWidth - 7);
      doc.text(valLines[0], colX, currentY + 13.5);
    });

    currentY += cardHeight + 8;
  };

  // Helper: Draw mini header on page 2+
  const drawSubHeader = () => {
    // Top colored accent bar
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('StudyOrbit • Daily Study Timetable', margin, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(schedule.title || 'Master Plan', pageWidth - margin, 9, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 11, pageWidth - margin, 11);

    currentY = 16;
  };

  // Check page overflow
  const ensureSpace = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawSubHeader();
      return true;
    }
    return false;
  };

  // Render initial Header & Summary
  drawMainHeader();
  drawSummaryCard();

  // Group tasks by scheduled_date
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

    let formattedDate = dateStr;
    try {
      if (dateStr !== 'Undated') {
        const dObj = new Date(dateStr + 'T00:00:00');
        formattedDate = dObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      formattedDate = dateStr;
    }

    // Ensure space for Date Ribbon + at least 1 task
    ensureSpace(28);

    // Date Header Ribbon
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY, contentWidth, 7.5, 1.5, 1.5, 'F');

    // Date icon bullet
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.circle(margin + 4, currentY + 3.75, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(formattedDate, margin + 8, currentY + 5.2);

    // Right badge with task count & duration
    const dayStatText = `${tasks.length} ${tasks.length === 1 ? 'block' : 'blocks'} • ${totalDayMins} mins`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(dayStatText, pageWidth - margin - 3, currentY + 5.2, { align: 'right' });

    currentY += 10;

    // Render each task under this date
    tasks.forEach((task) => {
      const isDone = task.status === 'completed';
      const subjColor = hexToRgb(task.subject_color || primaryHex, primaryRgb);

      // Estimate height needed for this task card
      const taskTitle = `${task.chapter_title ? task.chapter_title + ': ' : ''}${task.topic_title || 'Study Topic'}`;
      const titleLines = doc.splitTextToSize(taskTitle, contentWidth - 46);
      const hasSubtopic = Boolean(task.subtopic_title);
      const cardHeight = Math.max(14, 10 + titleLines.length * 4.2 + (hasSubtopic ? 4 : 0));

      ensureSpace(cardHeight + 3);

      // Task Card Container
      doc.setFillColor(isDone ? 250 : 255, isDone ? 250 : 255, isDone ? 250 : 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'FD');

      // Left subject color strip
      doc.setFillColor(subjColor.r, subjColor.g, subjColor.b);
      doc.roundedRect(margin, currentY, 2, cardHeight, 0.8, 0.8, 'F');

      // Status Checkbox
      const boxX = margin + 5;
      const boxY = currentY + 3.5;
      if (isDone) {
        doc.setFillColor(16, 185, 129); // emerald-500
        doc.roundedRect(boxX, boxY, 3.8, 3.8, 0.8, 0.8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text('✓', boxX + 0.8, boxY + 2.8);
      } else {
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(0.3);
        doc.roundedRect(boxX, boxY, 3.8, 3.8, 0.8, 0.8, 'FD');
      }

      // Subject Name Pill/Text
      const textStartX = margin + 12;
      let textCursorY = currentY + 4.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(subjColor.r, subjColor.g, subjColor.b);
      const subjectLabel = (task.subject_name || 'GENERAL').toUpperCase();
      doc.text(subjectLabel, textStartX, textCursorY);

      let badgeOffset = textStartX + doc.getTextWidth(subjectLabel) + 2.5;

      if (task.is_revision) {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(badgeOffset, textCursorY - 2.5, 13, 3.3, 0.7, 0.7, 'F');
        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text('REVISION', badgeOffset + 1.2, textCursorY - 0.2);
        badgeOffset += 15.5;
      }

      if (task.page_start) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        const pageStr = `•  pp. ${task.page_start}${task.page_end ? '–' + task.page_end : ''}`;
        doc.text(pageStr, badgeOffset, textCursorY);
      }

      // Title & Topic
      textCursorY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      if (isDone) {
        doc.setTextColor(148, 163, 184); // muted slate if done
      } else {
        doc.setTextColor(15, 23, 42); // slate-900
      }
      titleLines.forEach((line) => {
        doc.text(line, textStartX, textCursorY);
        textCursorY += 3.8;
      });

      // Subtopic if available
      if (hasSubtopic) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(100, 116, 139);
        const subtopicLine = doc.splitTextToSize(task.subtopic_title, contentWidth - 46)[0];
        doc.text(subtopicLine, textStartX, textCursorY);
      }

      // Duration & Status Badge (Right aligned)
      const durationX = pageWidth - margin - 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`${task.estimated_minutes || 30}m`, durationX, currentY + 5.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      if (isDone) {
        doc.setTextColor(16, 185, 129);
        doc.text('Completed', durationX, currentY + 9.5, { align: 'right' });
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('Pending', durationX, currentY + 9.5, { align: 'right' });
      }

      currentY += cardHeight + 2.5;
    });

    currentY += 3;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Thin footer separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Left brand note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'StudyOrbit  •  AI Academic Companion  •  study-orbit-zeta.vercel.app',
      margin,
      pageHeight - 7.5
    );

    // Right page count
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, {
      align: 'right',
    });
  }

  // Trigger browser download
  const cleanTitle = (schedule.title || 'StudyOrbit_Schedule').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}.pdf`);
}
