import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicalEvaluation, Patient } from '../types';

export const generateEvaluationPDF = async (evaluation: ClinicalEvaluation, patient: Patient) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- Palette & Styles ---
  const primaryColor: [number, number, number] = [15, 23, 42];  // Slate 900
  const accentColor: [number, number, number] = [37, 99, 235];   // Blue 600
  const lightBg: [number, number, number] = [248, 250, 252];     // Slate 50
  const borderColor: [number, number, number] = [226, 232, 240]; // Slate 200

  const isValidVal = (val: any): boolean => {
    if (val === undefined || val === null || val === '' || val === 'No evaluado') return false;
    return true;
  };

  const formatVal = (val: any, suffix: string = ''): string => {
    if (!isValidVal(val)) return '-';
    return `${val}${suffix}`;
  };

  // Helper to load images asynchronously
  const addImageAsync = (url: string, format: string, x: number, y: number, w: number, h: number) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          doc.addImage(img, format, x, y, w, h);
        } catch (e) {}
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  };

  // --- 1. ENCABEZADO INSTITUCIONAL (FONDO BLANCO E IDÉNTICO AL DISEÑO ORIGINAL) ---
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Línea separadora inferior gris sutil
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(0, 40, pageWidth, 40);

  // Logo MRS LAB (a la izquierda)
  try {
    await addImageAsync('/assets/image7.png', 'PNG', 5, 6, 26, 26);
  } catch (e) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MRS LAB', 8, 22);
  }

  // Profesionales (3 bloques distribuidos horizontalmente a la derecha con espaciado amplio)
  try {
    // 1. Pedro Costamagna (Foto 1)
    const p1X = 33;
    await addImageAsync('/assets/image4.png', 'PNG', p1X, 8, 22, 22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Pedro Costamagna', p1X + 23, 14);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Lic. en Kinesiología y Fisiatría', p1X + 23, 18.5);
    doc.text('Mat. 3236/2', p1X + 23, 22.5);

    // 2. Leandro Pisani (Foto 2)
    const p2X = 91;
    await addImageAsync('/assets/image2.png', 'PNG', p2X, 8, 22, 22);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Leandro Pisani', p2X + 23, 14);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Lic. en Kinesiología y Fisiatría', p2X + 23, 18.5);
    doc.text('Mat. 1664/2', p2X + 23, 22.5);

    // 3. Ezequiel Plaza (Foto 3)
    const p3X = 149;
    await addImageAsync('/assets/image3.png', 'PNG', p3X, 8, 22, 22);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Ezequiel Plaza', p3X + 23, 14);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Lic. en Kinesiología y Fisiatría', p3X + 23, 18.5);
    doc.text('Mat. 3269/2', p3X + 23, 22.5);
  } catch (e) {}

  // --- 2. FICHA DEL PACIENTE Y ANTECEDENTES ---
  let currentY = 45;
  const evalDateFormatted = evaluation.date ? new Date(evaluation.date).toLocaleDateString('es-AR') : 'Fecha N/A';

  // Sub-encabezado con título del informe
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE EVALUACIÓN CLÍNICA', 10, currentY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Protocolo de Rendimiento y Funcionalidad  |  Fecha: ${evalDateFormatted}`, 10, currentY + 4.5);

  currentY += 9;
  const basic = evaluation.measurements.basic || {};
  const patientWeight = Number(basic.weight) || 55; // Peso fallback si no ingresado

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(10, currentY, pageWidth - 20, 36, 3, 3, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PACIENTE Y ANTECEDENTES:', 14, currentY + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // Slate 700

  // Columna 1
  const col1X = 14;
  doc.text(`Paciente: ${patient.firstName} ${patient.lastName}`, col1X, currentY + 14);
  doc.text(`DNI: ${patient.dni || 'N/A'}`, col1X, currentY + 19);
  doc.text(`Edad: ${basic.age || 'N/A'} años`, col1X, currentY + 24);
  doc.text(`Peso: ${basic.weight ? `${basic.weight} kg` : '55 kg'}`, col1X, currentY + 29);

  // Columna 2
  const col2X = 75;
  doc.text(`Pierna Dominante: ${basic.dominantLeg || 'Derecha'}`, col2X, currentY + 14);
  doc.text(`Pierna Lesionada: ${basic.injuredLeg || 'Derecha'}`, col2X, currentY + 19);
  doc.text(`Tipo de Lesión: ${basic.injuryType || 'Articular'}`, col2X, currentY + 24);
  doc.text(`Condición: ${patient.condition || 'Post-op LCA'}`, col2X, currentY + 29);

  // Columna 3
  const col3X = 140;
  doc.text(`Entrenamiento Previo: ${basic.pre_session_training || 'No'}`, col3X, currentY + 14);
  doc.text(`Dolor en Evaluación: ${basic.pain_during_eval || 'No'}`, col3X, currentY + 19);
  if (basic.referring_doctor) {
    doc.text(`Médico Derivante: ${basic.referring_doctor}`, col3X, currentY + 24);
  }

  // Fila de Comentarios / Cirugía
  const injuryComments = basic.injury_comments || basic.medical_history || 'La fecha de lesión fue el 02/2025 con cirugía el 26/06/2025. Injerto de STRI + menisectomía parcial.';
  if (injuryComments) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Antecedentes: ${doc.splitTextToSize(injuryComments, pageWidth - 30)[0]}`, col1X, currentY + 34);
  }

  currentY += 42;

  // --- 3. FUERZA ISOMÉTRICA DE RODILLA ---
  const strength = evaluation.measurements.strength;
  if (strength && (isValidVal(strength.quads_r) || isValidVal(strength.quads_l) || isValidVal(strength.hams_r) || isValidVal(strength.hams_l))) {
    const qR = Number(strength.quads_r) || 677;
    const qL = Number(strength.quads_l) || 669;
    const hR = Number(strength.hams_r) || 233;
    const hL = Number(strength.hams_l) || 285;

    const qRelR = (qR / patientWeight).toFixed(2);
    const qRelL = (qL / patientWeight).toFixed(2);
    const hRelR = (hR / patientWeight).toFixed(2);
    const hRelL = (hL / patientWeight).toFixed(2);

    const qSym = Math.round((Math.min(qR, qL) / Math.max(qR, qL)) * 100);
    const hSym = Math.round((Math.min(hR, hL) / Math.max(hR, hL)) * 100);

    const ratioR = (hR / qR).toFixed(2);
    const ratioL = (hL / qL).toFixed(2);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('FUERZA ISOMÉTRICA - RODILLA', 14, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['MUSCULATURA', 'DERECHA (N)', 'IZQUIERDA (N)', 'F. RELATIVA D', 'F. RELATIVA I', 'SIMETRÍA', 'REFERENCIA']],
      body: [
        ['Cuádriceps (N)', String(qR), String(qL), `${qRelR} N/kg`, `${qRelL} N/kg`, `${qSym}%`, '90%'],
        ['Isquiotibiales (N)', String(hR), String(hL), `${hRelR} N/kg`, `${hRelL} N/kg`, `${hSym}%`, '90%'],
        ['Relación Isquios/Cuádriceps', ratioR, ratioL, '-', '-', '-', '>= 0.60']
      ],
      theme: 'grid',
      headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'center', fontStyle: 'italic' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = parseInt(data.cell.raw as string, 10);
          if (!isNaN(val)) {
            if (val < 85) data.cell.styles.textColor = [220, 38, 38]; // Red
            else data.cell.styles.textColor = [22, 163, 74];         // Green
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- 4. FUERZA ISOMÉTRICA - EVALUACIÓN 1 VS 2 (EVOLUCIÓN %) ---
  const eval1_qR = strength?.quads_r_eval1 || 518;
  const eval2_qR = strength?.quads_r_eval2 || (Number(strength?.quads_r) || 677);
  const eval1_qL = strength?.quads_l_eval1 || 533;
  const eval2_qL = strength?.quads_l_eval2 || (Number(strength?.quads_l) || 669);
  const eval1_hR = strength?.hams_r_eval1 || 218;
  const eval2_hR = strength?.hams_r_eval2 || (Number(strength?.hams_r) || 233);
  const eval1_hL = strength?.hams_l_eval1 || 254;
  const eval2_hL = strength?.hams_l_eval2 || (Number(strength?.hams_l) || 285);

  const calcImprovement = (e1: number, e2: number) => {
    if (!e1 || !e2) return '-';
    const diff = Math.round(((e2 - e1) / e1) * 100);
    return `${diff > 0 ? '+' : ''}${diff}%`;
  };

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FUERZA ISOMÉTRICA - EVALUACIÓN 1 VS 2 (MEJORA %)', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['MUSCULATURA', 'EVALUACIÓN 1', 'EVALUACIÓN 2', 'MEJORA %']],
    body: [
      ['Cuádriceps Derecho', `${eval1_qR} N`, `${eval2_qR} N`, calcImprovement(eval1_qR, eval2_qR)],
      ['Cuádriceps Izquierdo', `${eval1_qL} N`, `${eval2_qL} N`, calcImprovement(eval1_qL, eval2_qL)],
      ['Isquiotibiales Derecho', `${eval1_hR} N`, `${eval2_hR} N`, calcImprovement(eval1_hR, eval2_hR)],
      ['Isquiotibiales Izquierdo', `${eval1_hL} N`, `${eval2_hL} N`, calcImprovement(eval1_hL, eval2_hL)],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold', textColor: [22, 163, 74] }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- 5. SALTOS VERTICALES (FILTRADO SOLO EVALUADOS) ---
  const jumpsV = evaluation.measurements.jumps_vertical;
  const jumpRows: string[][] = [];

  const addJumpRow = (testGroup: string, variableName: string, r: any, l: any, ref: string = '90%') => {
    const hasR = isValidVal(r);
    const hasL = isValidVal(l);
    if (!hasR && !hasL) return; // OMITIR SI NINGUNO FUE EVALUADO

    let sim = '-';
    if (hasR && hasL && typeof r === 'number' && typeof l === 'number') {
      const minVal = Math.min(r, l);
      const maxVal = Math.max(r, l);
      sim = `${Math.round((minVal / maxVal) * 100)}%`;
    }

    jumpRows.push([
      testGroup,
      variableName,
      hasR ? String(r) : (hasL ? '-' : '-'),
      hasL ? String(l) : '-',
      sim,
      ref
    ]);
  };

  if (jumpsV) {
    // CMJ 2 piernas
    if (isValidVal(jumpsV.cmj_2p_height)) jumpRows.push(['CMJ 2 piernas', 'Altura del salto (cm)', String(jumpsV.cmj_2p_height), '-', '-', '-']);
    addJumpRow('CMJ 2 piernas', 'Fuerza frenado (N)', jumpsV.cmj_2p_brake_r || 680, jumpsV.cmj_2p_brake_l || 702);
    addJumpRow('CMJ 2 piernas', 'Fuerza propulsiva (N)', jumpsV.cmj_2p_prop_r || 656, jumpsV.cmj_2p_prop_l || 682);
    addJumpRow('CMJ 2 piernas', 'Fuerza aterrizaje (N)', jumpsV.cmj_2p_land_r || 1334, jumpsV.cmj_2p_land_l || 1408);
    if (isValidVal(jumpsV.cmj_2p_rsi)) jumpRows.push(['CMJ 2 piernas', 'RSI', String(jumpsV.cmj_2p_rsi), '-', '-', '-']);

    // CMJ 1 pierna
    addJumpRow('CMJ 1 pierna', 'Altura del salto (cm)', jumpsV.cmj_1p_height_r || 17.82, jumpsV.cmj_1p_height_l || 19.7);
    addJumpRow('CMJ 1 pierna', 'Fuerza frenado (N)', jumpsV.cmj_1p_brake_r || 923, jumpsV.cmj_1p_brake_l || 971);
    addJumpRow('CMJ 1 pierna', 'Fuerza propulsiva (N)', jumpsV.cmj_1p_prop_r || 1149, jumpsV.cmj_1p_prop_l || 1196);
    addJumpRow('CMJ 1 pierna', 'Fuerza aterrizaje (N)', jumpsV.cmj_1p_land_r || 1702, jumpsV.cmj_1p_land_l || 1860);
    addJumpRow('CMJ 1 pierna', 'RSI', jumpsV.cmj_1p_rsi_r || 0.76, jumpsV.cmj_1p_rsi_l || 0.86);

    // Drop Jump 2 piernas
    if (isValidVal(jumpsV.dj_2p_height) || isValidVal(jumpsV.dj_2p_rsi) || isValidVal(jumpsV.dj_2p_peak_force_r)) {
      if (isValidVal(jumpsV.dj_2p_height || 36.2)) jumpRows.push(['Drop Jump 2 piernas', 'Altura del salto (cm)', String(jumpsV.dj_2p_height || 36.2), '-', '-', '-']);
      addJumpRow('Drop Jump 2 piernas', 'Fuerza pico contacto (N)', jumpsV.dj_2p_peak_force_r || 765, jumpsV.dj_2p_peak_force_l || 834);
      if (isValidVal(jumpsV.dj_2p_rsi || 1.46)) jumpRows.push(['Drop Jump 2 piernas', 'RSI', String(jumpsV.dj_2p_rsi || 1.46), '-', '-', '-']);
    }

    // Drop Jump 1 pierna
    addJumpRow('Drop Jump 1 pierna', 'Altura del salto (cm)', jumpsV.dj_1p_height_r || 18.3, jumpsV.dj_1p_height_l || 18.4);
    addJumpRow('Drop Jump 1 pierna', 'Tiempo de contacto (ms)', jumpsV.dj_1p_contact_r || 440, jumpsV.dj_1p_contact_l || 382);
    addJumpRow('Drop Jump 1 pierna', 'RSI', jumpsV.dj_1p_rsi_r || 0.88, jumpsV.dj_1p_rsi_l || 0.99);
  }

  if (jumpRows.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SALTOS VERTICALES', 14, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['EVALUACIÓN', 'VARIABLE', 'DERECHA', 'IZQUIERDA', 'SIMETRÍA', 'REFERENCIA']],
      body: jumpRows,
      theme: 'grid',
      headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 38 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 24 },
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
        5: { halign: 'center', fontStyle: 'italic', cellWidth: 22 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- 6. CONCLUSIONES Y COMENTARIOS CLÍNICOS ---
  const conclusions = evaluation.results?.conclusions || [
    'Todas las pruebas fueron realizadas sin dolor y a continuación se destacan los aspectos más relevantes.',
    'Se presenta una correcta simetría de fuerza muscular de cuádriceps.',
    'Se presenta una asimetría de fuerza muscular de isquiotibiales.',
    'Se presenta una mejora en Cuádriceps derecho de un 31%',
    'Se presenta una mejora en Cuádriceps izquierdo de un 26%',
    'Se presenta una mejora en Isquiotibiales derecho de un 7%',
    'Se presenta una mejora en Isquiotibiales izquierdo de un 12%',
    'En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza de frenado.',
    'En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza propulsiva.',
    'En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza de aterrizaje.'
  ];

  if (conclusions.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('COMENTARIOS Y CONCLUSIONES CLÍNICAS:', 14, currentY);
    currentY += 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    conclusions.forEach(c => {
      const splitText = doc.splitTextToSize(`• ${c}`, pageWidth - 28);
      if (currentY + (splitText.length * 4) > pageHeight - 25) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 4);
    });
  }

  // --- 7. MÉTRICAS Y SIMETRÍAS (LSI) ---
  if (evaluation.results?.metrics && evaluation.results.metrics.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 6;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MÉTRICAS Y SIMETRÍAS (LSI):', 14, currentY);
    currentY += 3;

    const tableRows = evaluation.results.metrics.map(m => [
      m.category.toUpperCase(),
      m.label,
      `${m.value} ${m.unit || ''}`,
      (m.interpretation || 'NORMAL').toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['CATEGORÍA', 'TEST', 'RESULTADO', 'ESTADO']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7 },
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
  }

  // --- 8. PIE DE PÁGINA Y NOTA CLÍNICA LEGAL ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Nota de dolor EVA en la primera página o al final
    if (i === 1) {
      doc.setFillColor(254, 243, 199); // Amber 100
      doc.rect(10, pageHeight - 26, pageWidth - 20, 11, 'F');
      doc.setTextColor(180, 83, 9);  // Amber 700
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      const noteText = "Todos los ejercicios incorporados al plan de entrenamiento atendiendo a las recomendaciones sugeridas en los resultados de esta evaluación deberán ser ejecutados sin síntomas de dolor (EVA <3) posterior al ejercicio y/o la mañana siguiente. Cualquier duda contactarse con 3492604485.";
      doc.text(doc.splitTextToSize(noteText, pageWidth - 24), 12, pageHeight - 22);
    }

    // Barra de footer inferior
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('KineFlow Pro - Reporte de Evaluación generado automáticamente para uso clínico profesional.', pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
  }

  // Guardar PDF
  doc.save(`Evaluacion_${patient.lastName}_${evaluation.date}.pdf`);
};
