import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Slide {
  title: string;
  content: string;
  type?: string;
  videoUrl?: string;
  exerciseInstructions?: string;
  resourceLinks?: string[];
}

interface Quiz {
  question: string;
  options: string[];
  correct: number;
}

interface ModuleExportData {
  title: string;
  description: string;
  duration_hours: number;
  skills_covered: string[];
  slides: Slide[];
  quiz: Quiz[];
  script?: string;
}

export const exportModuleToPDF = (data: ModuleExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 275) {
      doc.addPage();
      yPos = 20;
    }
  };

  const addSectionTitle = (title: string) => {
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.setTextColor(41, 98, 255);
    doc.text(title, 20, yPos);
    yPos += 4;
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
  };

  // ── Cover ──
  doc.setFontSize(28);
  doc.setTextColor(41, 98, 255);
  const titleLines = doc.splitTextToSize(data.title, pageWidth - 40);
  doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += titleLines.length * 12 + 8;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Training Module · ${data.duration_hours}h`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.text(`Generated on ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  if (data.description) {
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const descLines = doc.splitTextToSize(data.description, pageWidth - 50);
    doc.text(descLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += descLines.length * 6 + 10;
  }

  if (data.skills_covered.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Skills: ${data.skills_covered.join(' · ')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }

  // ── Table of Contents ──
  if (data.slides.length > 0) {
    addSectionTitle('Table of Contents');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    data.slides.forEach((slide, i) => {
      checkPageBreak(7);
      const typeLabel = slide.type && slide.type !== 'text' ? ` [${slide.type}]` : '';
      doc.text(`${i + 1}. ${slide.title}${typeLabel}`, 25, yPos);
      yPos += 6;
    });
    yPos += 10;
  }

  // ── Slides ──
  if (data.slides.length > 0) {
    data.slides.forEach((slide, i) => {
      doc.addPage();
      yPos = 20;

      // Slide number badge
      doc.setFillColor(41, 98, 255);
      doc.roundedRect(20, yPos - 5, 30, 10, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Slide ${i + 1}/${data.slides.length}`, 35, yPos + 1, { align: 'center' });

      // Type badge
      if (slide.type && slide.type !== 'text') {
        const typeColor: Record<string, [number, number, number]> = {
          video: [234, 88, 12],
          exercise: [217, 119, 6],
          resource: [22, 163, 74],
        };
        const color = typeColor[slide.type] || [100, 100, 100];
        doc.setFillColor(...color);
        doc.roundedRect(55, yPos - 5, 25, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(slide.type, 67.5, yPos + 1, { align: 'center' });
      }

      yPos += 15;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      const slideTitleLines = doc.splitTextToSize(slide.title, pageWidth - 40);
      doc.text(slideTitleLines, 20, yPos);
      yPos += slideTitleLines.length * 8 + 8;

      // Content
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const contentLines = doc.splitTextToSize(slide.content, pageWidth - 40);
      contentLines.forEach((line: string) => {
        checkPageBreak(7);
        doc.text(line, 20, yPos);
        yPos += 6;
      });
      yPos += 8;

      // Video URL
      if (slide.type === 'video' && slide.videoUrl) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setTextColor(41, 98, 255);
        doc.text(`▶ Video: ${slide.videoUrl}`, 20, yPos);
        yPos += 8;
      }

      // Exercise instructions
      if (slide.type === 'exercise' && slide.exerciseInstructions) {
        checkPageBreak(20);
        doc.setFillColor(245, 245, 245);
        const instrLines = doc.splitTextToSize(slide.exerciseInstructions, pageWidth - 50);
        const boxHeight = instrLines.length * 6 + 14;
        doc.roundedRect(20, yPos - 4, pageWidth - 40, boxHeight, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(41, 98, 255);
        doc.text('Instructions:', 25, yPos + 3);
        yPos += 10;
        doc.setTextColor(60, 60, 60);
        instrLines.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 6;
        });
        yPos += 8;
      }

      // Resource links
      if (slide.resourceLinks && slide.resourceLinks.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Resources:', 20, yPos);
        yPos += 5;
        slide.resourceLinks.forEach(link => {
          checkPageBreak(6);
          doc.setTextColor(41, 98, 255);
          doc.text(`  → ${link}`, 22, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
    });
  }

  // ── Quiz ──
  if (data.quiz.length > 0) {
    doc.addPage();
    yPos = 20;
    addSectionTitle(`Quiz — ${data.quiz.length} Questions`);

    data.quiz.forEach((q, i) => {
      checkPageBreak(35);
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const qLines = doc.splitTextToSize(`Q${i + 1}. ${q.question}`, pageWidth - 40);
      doc.text(qLines, 20, yPos);
      yPos += qLines.length * 6 + 4;

      doc.setFontSize(10);
      q.options.forEach((opt, j) => {
        checkPageBreak(7);
        const isCorrect = j === q.correct;
        doc.setTextColor(isCorrect ? 22 : 80, isCorrect ? 163 : 80, isCorrect ? 74 : 80);
        doc.text(`${isCorrect ? '✓' : '○'} ${opt}`, 28, yPos);
        yPos += 6;
      });
      yPos += 8;
    });
  }

  // ── Training Script ──
  if (data.script) {
    doc.addPage();
    yPos = 20;
    addSectionTitle('Training Script — Instructor Guide');

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const scriptLines = doc.splitTextToSize(data.script, pageWidth - 40);
    scriptLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, 20, yPos);
      yPos += 5.5;
    });
  }

  // ── Footer on every page ──
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i}/${pageCount} — ${data.title} — SkillsWave`,
      pageWidth / 2, 290, { align: 'center' }
    );
  }

  const fileName = `${data.title.replace(/[^a-z0-9]/gi, '_')}_module_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
};
