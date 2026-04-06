import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicalEvaluation, Patient } from '../types';

export const generateEvaluationPDF = async (evaluation: ClinicalEvaluation, patient: Patient) => {
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

  // --- Helper to Load Images Asynchronously for jsPDF ---
  const addImageAsync = (url: string, format: string, x: number, y: number, w: number, h: number) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        doc.addImage(img, format, x, y, w, h);
        resolve();
      };
      img.onerror = () => {
        resolve(); // resolve anyway to avoid hanging
      };
      img.src = url;
    });
  };

  // Logo (from Excel asset)
  try {
    await addImageAsync('/assets/image7.png', 'PNG', 15, 8, 30, 30);
  } catch (e) {
    // Fallback if image not found
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('MRS LAB', 15, 25);
  }

  // Professionals (from Excel assets)
  try {
     await addImageAsync('/assets/image4.png', 'PNG', 105, 8, 10, 10);
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(6);
     doc.text('Leandro Pisani\nLic. en Kinesiologia\nMat. 1664/2', 117, 11);

     await addImageAsync('/assets/image2.png', 'PNG', 140, 8, 10, 10);
     doc.text('Ezequiel Plaza\nLic. en Kinesiologia\nMat. 3269/2', 152, 11);
     
     await addImageAsync('/assets/image3.png', 'PNG', 175, 8, 10, 10);
     doc.text('Pedro Costamagna\nLic. en Kinesiologia\nMat. 3236/2', 187, 11);
  } catch(e) {}

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE EVALUACIÓN', 45, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Protocolo Clínico de Rendimiento y Funcionalidad', 45, 28);
  
  doc.setFontSize(8);
  doc.text(`${new Date(evaluation.date).toLocaleDateString('es-AR')}`, 45, 34);

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

  // --- 3. VALORES DE LOS RESULTADOS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADOS BRUTOS (VALORES):', 20, 105);

  const rawRows: string[][] = [];
  const addRow = (section: string, test: string, r: any, l: any, ref: string = '-') => {
      if (r !== undefined || l !== undefined) {
          rawRows.push([section, test, r !== undefined ? String(r) : '-', l !== undefined ? String(l) : '-', ref]);
      }
  }

  const { mobility, flexibility, strength, balance, jumps_vertical, jumps_horizontal, mcgill } = evaluation.measurements;

  if (mobility) {
      addRow('Movilidad (º)', 'RI Cadera', mobility.hip_ir_90_r, mobility.hip_ir_90_l);
      addRow('Movilidad (º)', 'RE Cadera', mobility.hip_er_90_r, mobility.hip_er_90_l);
      addRow('Movilidad (º)', 'Ext. Pasiva Rodilla', mobility.knee_ext_pass_r, mobility.knee_ext_pass_l, '0º');
      addRow('Movilidad (º)', 'Flex. Activa Rodilla', mobility.knee_flex_act_r, mobility.knee_flex_act_l);
      addRow('Movilidad (º)', 'Flex. Pasiva Rodilla', mobility.knee_flex_pass_r, mobility.knee_flex_pass_l);
      addRow('Movilidad (º)', 'Dorsiflexión Tobillo', mobility.ankle_dorsiflex_r, mobility.ankle_dorsiflex_l, '>= 39º');
      addRow('Movilidad (º)', 'RI Hombro', mobility.shoulder_ir_r, mobility.shoulder_ir_l);
      addRow('Movilidad (º)', 'RE Hombro', mobility.shoulder_er_r, mobility.shoulder_er_l);
  }

  if (flexibility) {
      addRow('Flexibilidad', 'Thomas Test (Psoas)', flexibility.thomas_test_psoas_r, flexibility.thomas_test_psoas_l, 'OK');
      addRow('Flexibilidad', 'Thomas Test (Recto)', flexibility.thomas_test_rectus_r, flexibility.thomas_test_rectus_l, 'OK');
      addRow('Flexibilidad', 'Thomas Test (Sartorio)', flexibility.thomas_test_sartorius_r, flexibility.thomas_test_sartorius_l, 'OK');
      addRow('Flexibilidad (º)', 'Isquiosurales (AKE)', flexibility.hams_r, flexibility.hams_l, '>= 70');
      addRow('Neuroortop.', 'Askling H-Test', flexibility.askling_h_r, flexibility.askling_h_l, 'OK');
      addRow('Neuroortop.', 'Slump Test', flexibility.slump_test_r, flexibility.slump_test_l, 'OK');
      addRow('Neuroortop.', 'Aductores (BKFO)', flexibility.bkfo_r, flexibility.bkfo_l, '<= 17.4cm');
  }

  if (balance) {
      addRow('Balance (Seg)', 'Ojos Abiertos', balance.eyes_open_r, balance.eyes_open_l, '>= 45');
      addRow('Balance (Seg)', 'Ojos Cerrados', balance.eyes_closed_r, balance.eyes_closed_l, '>= 9');
      addRow('Y-Balance (CM)', 'Anterior', balance.y_balance_ant_r, balance.y_balance_ant_l);
      addRow('Y-Balance (CM)', 'Post-Medial', balance.y_balance_pm_r, balance.y_balance_pm_l);
      addRow('Y-Balance (CM)', 'Post-Lateral', balance.y_balance_pl_r, balance.y_balance_pl_l);
  }

  if (mcgill) {
      addRow('McGill (Seg)', 'Puente Lateral D', mcgill.lateral_bridge_r, undefined, '>= 85');
      addRow('McGill (Seg)', 'Puente Lateral I', undefined, mcgill.lateral_bridge_l, '>= 85');
      addRow('McGill (Seg)', 'Flexores', mcgill.flexor_endurance, undefined, '>= 130');
      addRow('McGill (Seg)', 'Extensores', mcgill.extensor_endurance, undefined, '>= 170');
  }

  if (strength) {
      addRow('Fuerza (N)', 'Cuádriceps', strength.quads_r, strength.quads_l);
      addRow('Fuerza (N)', 'Isquiosurales', strength.hams_r, strength.hams_l);
      addRow('Fuerza (N)', 'Aductores', strength.adductor_r, strength.adductor_l);
      addRow('Fuerza (N)', 'Abductores', strength.abductor_r, strength.abductor_l);
  }

  if (jumps_vertical) {
      addRow('Saltos Vert.', 'CMJ 2p (Altura cm)', jumps_vertical.cmj_2p_height, undefined);
      addRow('Saltos Vert.', 'CMJ 2p RSI', jumps_vertical.cmj_2p_rsi, undefined);
      addRow('Saltos Vert. (N)', 'CMJ 2p Frenado', jumps_vertical.cmj_2p_brake_r, jumps_vertical.cmj_2p_brake_l);
      addRow('Saltos Vert. (N)', 'CMJ 2p Propulsión', jumps_vertical.cmj_2p_prop_r, jumps_vertical.cmj_2p_prop_l);
      addRow('Saltos Vert. (N)', 'CMJ 2p Aterrizaje', jumps_vertical.cmj_2p_land_r, jumps_vertical.cmj_2p_land_l);
      addRow('Saltos Vert.', 'CMJ 1p (Altura cm)', jumps_vertical.cmj_1p_height_r, jumps_vertical.cmj_1p_height_l);
  }
  
  if (jumps_horizontal) {
      addRow('Saltos Horizont.', 'Single Hop', (jumps_horizontal as any).single_hop_r, (jumps_horizontal as any).single_hop_l);
      addRow('Saltos Horizont.', 'Triple Hop', (jumps_horizontal as any).triple_hop_dist_r, (jumps_horizontal as any).triple_hop_dist_l);
  }

  autoTable(doc, {
    startY: 110,
    head: [['CATEGORÍA', 'TEST', 'DERECHA', 'IZQUIERDA', 'REFERENCIA']],
    body: rawRows,
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center', fontStyle: 'italic' }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- 4. CONCLUSIONES CLÍNICAS ---
  if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCLUSIONES CLÍNICAS:', 20, currentY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  currentY += 10;
  evaluation.results.conclusions.forEach(conclusion => {
    const splitText = doc.splitTextToSize(`• ${conclusion}`, pageWidth - 40);
    if (currentY + (splitText.length * 5) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
    }
    doc.text(splitText, 25, currentY);
    currentY += (splitText.length * 5);
  });

  // --- 5. MÉTRICAS (SIMETRÍAS LSI) ---
  if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
  } else {
      currentY += 10;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTRICAS Y SIMETRÍAS (LSI):', 20, currentY);

  const tableRows = evaluation.results.metrics.map(m => [
    m.category.toUpperCase(),
    m.label,
    `${m.value} ${m.unit || ''}`,
    (m.interpretation || 'NORMAL').toUpperCase()
  ]);

  autoTable(doc, {
    startY: currentY + 5,
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

  // --- 6. THOMAS TEST IMAGE (if available) ---
  const thomasImageUrl = evaluation.measurements.flexibility?.thomas_image_url;
  if (thomasImageUrl) {
    doc.addPage();
    // Left border accent
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 5, pageHeight, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('IMAGEN - THOMAS TEST:', 20, 20);
    
    try {
      // Image is base64 data URL
      const format = thomasImageUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const imgData = thomasImageUrl.split(',')[1] || thomasImageUrl;
      doc.addImage(imgData, format, 20, 30, pageWidth - 40, 0);
    } catch(e) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('(No se pudo procesar la imagen adjunta)', 20, 30);
    }
    
    // Re-add footer on this page
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('KineFlow Pro - Reporte generado automáticamente para uso clínico profesional.', pageWidth / 2, pageHeight - 7, { align: 'center' });
  }

  // Save the PDF
  doc.save(`Evaluacion_${patient.lastName}_${evaluation.date}.pdf`);
};
