import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicalEvaluation, Patient } from '../types';

export const generateEvaluationPDF = (evaluation: ClinicalEvaluation, patient: Patient) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // 1. Header & Branding
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KineFlow Pro', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INFORME DE EVALUACIÓN CLÍNICA', 20, 30);
  
  doc.text(`Fecha: ${new Date(evaluation.date).toLocaleDateString()}`, pageWidth - 60, 20);
  doc.text(`ID: ${evaluation.id?.substring(0, 8)}`, pageWidth - 60, 25);

  // 2. Patient Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PACIENTE', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${patient.firstName} ${patient.lastName}`, 20, 65);
  doc.text(`DNI: ${patient.dni}`, 20, 70);
  doc.text(`Condición: ${patient.condition}`, 20, 75);
  
  const age = evaluation.measurements.basic?.age || 'N/A';
  const weight = evaluation.measurements.basic?.weight || 'N/A';
  doc.text(`Edad: ${age} años`, 100, 65);
  doc.text(`Peso: ${weight} kg`, 100, 70);

  // 3. Clinical Conclusions
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCLUSIÓN CLÍNICA', 20, 95);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  let yPos = 105;
  evaluation.results.conclusions.forEach(conclusion => {
    const splitText = doc.splitTextToSize(`• ${conclusion}`, pageWidth - 40);
    doc.text(splitText, 25, yPos);
    yPos += (splitText.length * 5);
  });

  // 4. Detailed Metrics Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADOS DETALLADOS', 20, yPos + 10);

  const tableRows = evaluation.results.metrics.map(m => [
    m.category,
    m.label,
    `${m.value}${m.unit || ''}`,
    (m.interpretation || 'NORMAL').toUpperCase()
  ]);

  autoTable(doc, {
    startY: yPos + 15,
    head: [['Categoría', 'Test / Métrica', 'Resultado', 'Estado']],
    body: tableRows,
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      3: { fontStyle: 'bold' }
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

  // 5. Footer
  const finalY = (doc as any).lastAutoTable.cursor.y || 250;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este informe es de carácter profesional kinesiológico.', 20, finalY + 20);
  doc.text('KineFlow Pro - Sistema de Gestión de Rendimiento', pageWidth / 2, 285, { align: 'center' });

  // Save the PDF
  doc.save(`Evaluacion_${patient.lastName}_${evaluation.date}.pdf`);
};
