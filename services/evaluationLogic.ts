import { EvaluationResult, ClinicalEvaluation } from '../types';

/**
 * Motor de Cálculo para Evaluaciones Clínicas KineFlow Pro
 * Replicando la lógica del archivo "Informe General 2026.xlsx"
 */

export const calculateLSI = (r: number, l: number, dominant: 'derecha' | 'izquierda' = 'derecha', injured: 'derecha' | 'izquierda' | 'ninguna' = 'ninguna'): number => {
  if (!r || !l) return 0;
  
  // Si hay pierna lesionada, el LSI es (Lesionada / Sana) * 100
  if (injured !== 'ninguna') {
      const lesionada = injured === 'derecha' ? r : l;
      const sana = injured === 'derecha' ? l : r;
      return Number(((lesionada / sana) * 100).toFixed(1));
  }
  
  // Si no hay lesión, comparamos Menor / Mayor * 100
  const menor = Math.min(r, l);
  const mayor = Math.max(r, l);
  return Number(((menor / mayor) * 100).toFixed(1));
};

export const getDeficit = (lsi: number): number => {
  return Number((Math.abs(100 - lsi)).toFixed(1));
};

export const getInterpretation = (lsi: number, threshold: number = 90): 'normal' | 'warning' | 'critical' => {
  if (lsi >= threshold) return 'normal';
  if (lsi >= threshold - 10) return 'warning';
  return 'critical';
};

/**
 * Procesa los datos crudos para generar resultados estructurados
 */
export const processEvaluation = (measurements: any): { conclusions: string[], metrics: EvaluationResult[] } => {
  const conclusions: string[] = [];
  const metrics: EvaluationResult[] = [];
  const { 
    basic, mobility, flexibility, palpation, 
    balance, mcgill, functional, strength, 
    vbt, jumps_vertical, jumps_horizontal, motor_control 
  } = measurements;
  
  const injured = basic?.injuredLeg || 'ninguna';
  const dominant = basic?.dominantLeg || 'derecha';

  // 1. ANÁLISIS DE MOVILIDAD
  if (mobility) {
    const mobilityMetrics = [
      { r: 'hip_ir_90_r', l: 'hip_ir_90_l', label: 'RI Cadera 90º' },
      { r: 'hip_er_90_r', l: 'hip_er_90_l', label: 'RE Cadera 90º' },
      { r: 'knee_ext_pass_r', l: 'knee_ext_pass_l', label: 'Ext Pasiva Rodilla' },
      { r: 'knee_flex_act_r', l: 'knee_flex_act_l', label: 'Flex Activa Rodilla' },
      { r: 'ankle_dorsiflex_r', l: 'ankle_dorsiflex_l', label: 'Dorsiflexión Tobillo', unit: 'cm' },
      { r: 'shoulder_ir_r', l: 'shoulder_ir_l', label: 'RI Hombro' },
      { r: 'shoulder_er_r', l: 'shoulder_er_l', label: 'RE Hombro' },
    ];

    mobilityMetrics.forEach(m => {
        const r = mobility[m.r];
        const l = mobility[m.l];
        if (r !== undefined && l !== undefined) {
            const lsi = calculateLSI(r, l, dominant, injured);
            metrics.push({
                label: `LSI ${m.label}`,
                value: lsi,
                unit: '%',
                category: 'Movilidad',
                interpretation: getInterpretation(lsi)
            });
            if (lsi < 85) conclusions.push(`Asimetría marcada en ${m.label} (${getDeficit(lsi)}% déficit).`);
        }
    });
  }

  // 2. CORE (McGill)
  if (mcgill) {
      if (mcgill.flexor_endurance && mcgill.extensor_endurance) {
          const ratio = Number(mcgill.flexor_endurance) / Number(mcgill.extensor_endurance);
          metrics.push({
              label: 'Ratio Flexores/Extensores (McGill)',
              value: ratio.toFixed(2),
              category: 'Core',
              interpretation: ratio > 1.05 || ratio < 0.95 ? 'warning' : 'normal'
          });
      }
      if (mcgill.lateral_bridge_r && mcgill.lateral_bridge_l) {
          const lsi = calculateLSI(mcgill.lateral_bridge_r, mcgill.lateral_bridge_l);
          metrics.push({
              label: 'LSI Puente Lateral (Core)',
              value: lsi,
              unit: '%',
              category: 'Core',
              interpretation: getInterpretation(lsi, 95)
          });
      }
  }

  // 3. FUERZA ISOMÉTRICA (Dinamometría)
  if (strength) {
      const categories = [
          { key: 'hip_flex_0', label: 'Flexores Cadera 0º' },
          { key: 'hip_flex_90', label: 'Flexores Cadera 90º' },
          { key: 'adductor', label: 'Aductores' },
          { key: 'abductor', label: 'Abductores' },
          { key: 'quads', label: 'Cuádriceps' },
          { key: 'hams', label: 'Isquiosurales' },
          { key: 'triceps_sural', label: 'Tríceps Sural' },
          { key: 'shoulder_ri', label: 'RI Hombro' },
          { key: 'shoulder_re', label: 'RE Hombro' },
          { key: 'ash_i', label: 'Ash I' },
          { key: 'ash_y', label: 'Ash Y' },
          { key: 'ash_t', label: 'Ash T' },
      ];

      categories.forEach(cat => {
          const r = strength[`${cat.key}_r`];
          const l = strength[`${cat.key}_l`];
          if (r !== undefined && l !== undefined) {
              const lsi = calculateLSI(r, l, dominant, injured);
              metrics.push({
                  label: `LSI ${cat.label}`,
                  value: lsi,
                  unit: '%',
                  category: 'Fuerza',
                  interpretation: getInterpretation(lsi)
              });
              if (lsi < 90) conclusions.push(`Déficit de fuerza en ${cat.label}: ${getDeficit(lsi)}%.`);
          }
      });
  }

  // 4. SALTOS (LSI & RSI)
  if (jumps_vertical) {
      if (jumps_vertical.cmj_1p_height_r && jumps_vertical.cmj_1p_height_l) {
          const lsi = calculateLSI(jumps_vertical.cmj_1p_height_r, jumps_vertical.cmj_1p_height_l, dominant, injured);
          metrics.push({
              label: 'LSI CMJ Unipodal (Altura)',
              value: lsi,
              unit: '%',
              category: 'Saltos',
              interpretation: getInterpretation(lsi, 90)
          });
      }
  }

  if (jumps_horizontal) {
      const hopTests = [
          { r: 'single_hop_r', l: 'single_hop_l', label: 'Single Hop' },
          { r: 'triple_hop_dist_r', l: 'triple_hop_dist_l', label: 'Triple Hop Dist' },
          { r: 'crossover_hop_dist_r', l: 'crossover_hop_dist_l', label: 'Crossover Hop' },
          { r: 'side_hop_r', l: 'side_hop_l', label: 'Side Hop' },
      ];

      hopTests.forEach(test => {
          if (jumps_horizontal[test.r] && jumps_horizontal[test.l]) {
              const lsi = calculateLSI(jumps_horizontal[test.r], jumps_horizontal[test.l], dominant, injured);
              metrics.push({
                  label: `LSI ${test.label}`,
                  value: lsi,
                  unit: '%',
                  category: 'Saltos',
                  interpretation: getInterpretation(lsi, 90)
              });
              if (lsi < 90) conclusions.push(`Asimetría en saltos horizontales (${test.label}): ${getDeficit(lsi)}%.`);
          }
      });
  }

  return { 
      conclusions: conclusions.length > 0 ? conclusions : ['Evaluación completada. Se observa buen equilibrio muscular general.'], 
      metrics 
  };
};


/**
 * Formatea un historial de evaluaciones para gráficas de evolución
 */
export const prepareEvolutionData = (evaluations: ClinicalEvaluation[], metricKey: string) => {
  return evaluations
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(ev => ({
      date: ev.date,
      value: ev.summaryMetrics[metricKey as keyof typeof ev.summaryMetrics] || 0
    }));
};
