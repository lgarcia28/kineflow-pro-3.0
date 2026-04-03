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
  const { basic, mobility, strength, jumps, functional, mcgill } = measurements;
  const injured = basic?.injuredLeg || 'ninguna';
  const dominant = basic?.dominantLeg || 'derecha';

  // 1. ANÁLISIS DE MOVILIDAD
  if (mobility) {
    // Rotación Interna Cadera
    if (mobility.hip_ir_90_r && mobility.hip_ir_90_l) {
      const lsi = calculateLSI(mobility.hip_ir_90_r, mobility.hip_ir_90_l, dominant, injured);
      metrics.push({
        label: 'LSI Rotación Interna Cadera',
        value: lsi,
        unit: '%',
        category: 'Movilidad',
        interpretation: getInterpretation(lsi)
      });
      if (lsi < 90) conclusions.push(`Asimetría en la rotación interna de cadera (${getDeficit(lsi)}% de déficit).`);
    }

    // Dorsiflexión Tobillo
    if (mobility.ankle_dorsiflex_r && mobility.ankle_dorsiflex_l) {
        const diff = Math.abs(mobility.ankle_dorsiflex_r - mobility.ankle_dorsiflex_l);
        metrics.push({
          label: 'Diferencia Dorsiflexión Tobillo',
          value: diff,
          unit: 'cm',
          category: 'Movilidad',
          interpretation: diff > 2 ? 'warning' : 'normal'
        });
        if (diff > 2) conclusions.push(`Diferencia mecánica en la dorsiflexión de tobillo: ${diff} cm.`);
    }
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
          if (ratio < 0.7) conclusions.push('Predominio excesivo de extensores lumbares sobre flexores de tronco (Riesgo).');
      }
      if (mcgill.lateral_bridge_r && mcgill.lateral_bridge_l) {
          const lsi = calculateLSI(mcgill.lateral_bridge_r, mcgill.lateral_bridge_l);
          metrics.push({
              label: 'LSI Puente Lateral',
              value: lsi,
              unit: '%',
              category: 'Core',
              interpretation: getInterpretation(lsi, 95)
          });
          if (lsi < 95) conclusions.push(`Asimetría en la resistencia lateral del Core (${getDeficit(lsi)}%).`);
      }
  }

  // 3. FUERZA ISOMÉTRICA
  if (strength) {
      const categories = [
          { key: 'quads', label: 'Cuádriceps' },
          { key: 'hams', label: 'Isquiosurales' },
          { key: 'adductor', label: 'Aductores' },
          { key: 'abductor', label: 'Abductores' }
      ];

      categories.forEach(cat => {
          const r = strength[`${cat.key}_r`];
          const l = strength[`${cat.key}_l`];
          if (r && l) {
              const lsi = calculateLSI(r, l, dominant, injured);
              metrics.push({
                  label: `LSI ${cat.label}`,
                  value: lsi,
                  unit: '%',
                  category: 'Fuerza',
                  interpretation: getInterpretation(lsi)
              });
              if (lsi < 90) conclusions.push(`Déficit de fuerza en ${cat.label}: ${getDeficit(lsi)}% respecto al lado contralateral.`);
          }
      });
  }

  // 4. SALTOS & POTENCIA
  if (jumps) {
      if (jumps.triple_hop_r && jumps.triple_hop_l) {
          const lsi = calculateLSI(jumps.triple_hop_r, jumps.triple_hop_l, dominant, injured);
          metrics.push({
              label: 'LSI Triple Hop (Distancia)',
              value: lsi,
              unit: '%',
              category: 'Potencia',
              interpretation: getInterpretation(lsi, 90)
          });
          if (lsi < 90) conclusions.push(`Asimetría en la estabilidad dinámica (Triple Hop): ${getDeficit(lsi)}%.`);
      }
      if (jumps.cmj_rsi) {
          metrics.push({
              label: 'RSI (Reactive Strength Index)',
              value: jumps.cmj_rsi,
              category: 'Potencia',
              interpretation: jumps.cmj_rsi > 1.5 ? 'normal' : 'warning'
          });
      }
  }

  return { 
      conclusions: conclusions.length > 0 ? conclusions : ['Evaluación completada sin hallazgos críticos significativos.'], 
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
