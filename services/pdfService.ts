import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicalEvaluation, Patient } from '../types';

export const generateEvaluationPDF = (evaluation: ClinicalEvaluation, patient: Patient) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- Helpers for Styling ---
  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600

  // --- 1. THE FRAME / BACKGROUND ---
  // Left border accent
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 5, pageHeight, 'F');

  // Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo (from Excel asset)
  try {
    // image7.png was identified as a possible logo candidate by size
    doc.addImage('/assets/image7.png', 'PNG', 15, 8, 30, 30);
  } catch (e) {
    // Fallback if image not found
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('KINEFLOW', 15, 25);
  }

  // Professionals (from Excel assets)
  try {
     // image2 and image3 likely professional photos
     doc.addImage('/assets/image2.png', 'PNG', pageWidth - 45, 8, 15, 15);
     doc.addImage('/assets/image3.png', 'PNG', pageWidth - 25, 8, 15, 15);
  } catch(e) {}

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE EVALUACIÓN', 55, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Protocolo Clínico de Rendimiento y Funcionalidad', 55, 30);
  doc.text(`${new Date(evaluation.date).toLocaleDateString('es-AR')}`, pageWidth - 45, 35, { align: 'right' });

  // --- 2. PACIENT INFO ---
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(15, 55, pageWidth - 30, 35, 'F');
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PACIENTE:', 20, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${patient.firstName} ${patient.lastName}`, 20, 75);
  doc.text(`DNI: ${patient.dni}`, 20, 82);
  doc.text(`Edad: ${evaluation.measurements.basic?.age || 'N/A'} años`, 100, 75);
  doc.text(`Condición: ${patient.condition}`, 100, 82);

  // --- 3. RESULTS SUMMARY ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCLUSIONES CLÍNICAS:', 20, 105);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  let yPos = 115;
  evaluation.results.conclusions.forEach(conclusion => {
    const splitText = doc.splitTextToSize(`• ${conclusion}`, pageWidth - 40);
    doc.text(splitText, 25, yPos);
    yPos += (splitText.length * 5);
  });

  // --- 4. DATA TABLES ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTRICAS Y RESULTADOS:', 20, yPos + 10);

  const tableRows = evaluation.results.metrics.map(m => [
    m.category.toUpperCase(),
    m.label,
    `${m.value} ${m.unit || ''}`,
    (m.interpretation || 'NORMAL').toUpperCase()
  ]);

  autoTable(doc, {
    startY: yPos + 15,
    head: [['CATEGORÍA', 'TEST', 'RESULTADO', 'ESTADO']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
            const val = data.cell.raw as string;
            if (val === 'CRITICAL') data.cell.styles.textColor = [220, 38, 38];
            if (val === 'WARNING') data.cell.styles.textColor = [217, 119, 6];
            if (val === 'NORMAL') data.cell.styles.textColor = [22, 163, 74];
        }
    }
  });

  // --- 5. FOOTER ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('KineFlow Pro - Reporte generado automáticamente para uso clínico profesional.', pageWidth / 2, pageHeight - 7, { align: 'center' });
  }

  // Save the PDF
  doc.save(`Evaluacion_${patient.lastName}_${evaluation.date}.pdf`);
};
