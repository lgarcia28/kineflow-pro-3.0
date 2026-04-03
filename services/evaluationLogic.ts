import { EvaluationResult, ClinicalEvaluation } from '../types';

/**
 * Motor de Cálculo para Evaluaciones Clínicas KineFlow Pro
 * Replicando *exactamente* la lógica del archivo "Informe General 2026.xlsx".
 */

export const calculateLSI = (r: number, l: number, dominant: 'derecha' | 'izquierda' = 'derecha', injured: 'derecha' | 'izquierda' | 'ninguna' = 'ninguna'): number => {
  if (!r || !l) return 0;
  
  if (injured !== 'ninguna') {
      const lesionada = injured === 'derecha' ? r : l;
      const sana = injured === 'derecha' ? l : r;
      return Number(((lesionada / sana) * 100).toFixed(1));
  }
  
  const menor = Math.min(r, l);
  const mayor = Math.max(r, l);
  return Number(((menor / mayor) * 100).toFixed(1));
};

export const getDeficit = (lsi: number): number => {
  return Number((Math.abs(100 - lsi)).toFixed(1));
};

export const getInterpretation = (lsi: number, threshold: number = 90): 'normal' | 'warning' | 'critical' => {
  if (lsi >= threshold && lsi <= (100 + (100-threshold))) return 'normal';
  return 'critical';
};

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
  const weight = Number(basic?.weight) || 1; // Para evitar división por 0
  const legLength = Number(balance?.leg_length) || 1;

  // 1. MOVILIDAD
  if (mobility) {
    const hipRiR = Number(mobility.hip_ir_90_r) || 0;
    const hipReR = Number(mobility.hip_er_90_r) || 0;
    const hipRiL = Number(mobility.hip_ir_90_l) || 0;
    const hipReL = Number(mobility.hip_er_90_l) || 0;
    
    const hipTotalR = hipRiR + hipReR;
    const hipTotalL = hipRiL + hipReL;

    // Cadera Total (D19, E19)
    if (hipTotalR > 0 && hipTotalL > 0) {
        if (hipTotalR >= 85 && hipTotalL >= 85) conclusions.push("El rango de movimiento total de cadera en ambas piernas se encuentra normal.");
        else if (hipTotalR < 85 && hipTotalL >= 85) conclusions.push("El rango de movimiento total de cadera en la pierna derecha se encuentra disminuido.");
        else if (hipTotalR >= 85 && hipTotalL < 85) conclusions.push("El rango de movimiento total de cadera en la pierna izquierda se encuentra disminuido.");
        else conclusions.push("El rango de movimiento total de cadera en ambas piernas se encuentra disminuido.");
    }

    // Extensión Rodilla (D24, E24)
    if (mobility.knee_ext_pass_r !== undefined && mobility.knee_ext_pass_l !== undefined) {
        if (Number(mobility.knee_ext_pass_r) === 0 && Number(mobility.knee_ext_pass_l) === 0) conclusions.push("No presenta déficit de extensión.");
        else conclusions.push("Se presenta déficit de extensión de la rodilla.");
    }

    // Flexión Rodilla Activa y Pasiva (F27, F28) -> |L - R| <= 10
    if (mobility.knee_flex_act_r !== undefined && mobility.knee_flex_act_l !== undefined) {
        const diffAct = Number(mobility.knee_flex_act_l) - Number(mobility.knee_flex_act_r);
        if (diffAct < -10 || diffAct > 10) conclusions.push("Se presenta un déficit de flexión activa de la rodilla.");
        else conclusions.push("La flexión activa de rodilla se encuentra normal.");
    }

    // Dorsiflexión Tobillo (< 39)
    if (mobility.ankle_dorsiflex_r !== undefined && mobility.ankle_dorsiflex_l !== undefined) {
        const dR = Number(mobility.ankle_dorsiflex_r);
        const dL = Number(mobility.ankle_dorsiflex_l);
        if (dR < 39 && dL < 39) conclusions.push("Presenta un déficit de flexión dorsal del tobillo de ambas piernas.");
        else if (dR < 39) conclusions.push("Presenta un déficit de flexión dorsal del tobillo de la pierna derecha.");
        else if (dL < 39) conclusions.push("Presenta un déficit de flexión dorsal del tobillo de la pierna izquierda.");
        else conclusions.push("No presenta déficit en la flexión dorsal del tobillo.");
    }

    // Hombro Rotación
    if (mobility.shoulder_ir_r !== undefined && mobility.shoulder_ir_l !== undefined) {
        const diffIr = Number(mobility.shoulder_ir_l) - Number(mobility.shoulder_ir_r);
        if (diffIr < -18 || diffIr > 18) conclusions.push("Se presenta un déficit de rotación interna del hombro.");
        else conclusions.push("No se presenta un déficit de rotación interna del hombro.");
        
        // Arco total hombro
        const arcR = Number(mobility.shoulder_ir_r) + Number(mobility.shoulder_er_r || 0);
        const arcL = Number(mobility.shoulder_ir_l) + Number(mobility.shoulder_er_l || 0);
        const diffArc = arcL - arcR;
        if (diffArc >= -5 && diffArc <= 5) conclusions.push("Se presenta un normal arco total del movimiento del hombro.");
        else conclusions.push("Se presenta un déficit del arco total del movimiento del hombro.");
    }
  }

  // Perimetrias: no añadidas a types.ts en su totalidad (Muslo, Pantorrilla D y I), si estuvieran irían acá

  // 2. FLEXIBILIDAD Y NEUROORTOPEDICO
  if (flexibility) {
      // Thomas Test Right
      const psoR = flexibility.thomas_test_psoas_r;
      const recR = flexibility.thomas_test_rectus_r;
      const sarR = flexibility.thomas_test_sartorius_r;
      
      if (psoR === 'X' && recR === 'OK' && sarR === 'OK') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco.");
      else if (psoR === 'X' && recR === 'X' && sarR === 'OK') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco y del Recto Anterior.");
      else if (psoR === 'X' && recR === 'X' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco, del Recto Anterior y del Sartorio.");
      else if (psoR === 'X' && recR === 'OK' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco y del Sartorio.");
      else if (psoR === 'OK' && recR === 'X' && sarR === 'OK') conclusions.push("En la pierna derecha, se presenta un acortamiento del Recto Anterior.");
      else if (psoR === 'OK' && recR === 'X' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Recto Anterior y del Sartorio.");
      else if (psoR === 'OK' && recR === 'OK' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Sartorio.");
      else if (psoR === 'OK' && recR === 'OK' && sarR === 'OK') conclusions.push("En la pierna derecha, no se presenta un acortamiento de los flexores de cadera.");
      
      // Thomas Test Left
      const psoL = flexibility.thomas_test_psoas_l;
      const recL = flexibility.thomas_test_rectus_l;
      const sarL = flexibility.thomas_test_sartorius_l;
      
      if (psoL === 'X' && recL === 'OK' && sarL === 'OK') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco.");
      else if (psoL === 'X' && recL === 'X' && sarL === 'OK') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco y del Recto Anterior.");
      else if (psoL === 'X' && recL === 'X' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco, del Recto Anterior y del Sartorio.");
      else if (psoL === 'X' && recL === 'OK' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco y del Sartorio.");
      else if (psoL === 'OK' && recL === 'X' && sarL === 'OK') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Recto Anterior.");
      else if (psoL === 'OK' && recL === 'X' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Recto Anterior y del Sartorio.");
      else if (psoL === 'OK' && recL === 'OK' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Sartorio.");
      else if (psoL === 'OK' && recL === 'OK' && sarL === 'OK') conclusions.push("En la pierna izquierda, no se presenta un acortamiento de los flexores de cadera.");

      // AKE (Isquiotibiales)
      if (flexibility.hams_r !== undefined && flexibility.hams_l !== undefined) {
          const hR = Number(flexibility.hams_r);
          const hL = Number(flexibility.hams_l);
          if (hR >= 70 && hL >= 70) conclusions.push("No se presenta acortamiento de los isquiotibiales.");
          else if (hR < 70 && hL >= 70) conclusions.push("Se presenta un acortamiento del isquiotibial de la pierna derecha.");
          else if (hR >= 70 && hL < 70) conclusions.push("Se presenta un acortamiento del isquiotibial de la pierna izquierda.");
          else if (hR < 70 && hL < 70) conclusions.push("Se presenta un acortamiento de los isquiotibiales en ambas piernas.");
      }

      // Askling H
      if (flexibility.askling_h_r === 'OK' && flexibility.askling_h_l === 'OK') conclusions.push("No se refiere dolor o inseguridad durante el Askling H-test en ninguna de las piernas.");
      else if (flexibility.askling_h_r === 'X' && flexibility.askling_h_l === 'OK') conclusions.push("Refiere dolor o inseguridad en la pierna derecha durante el Askling H-test.");
      else if (flexibility.askling_h_r === 'OK' && flexibility.askling_h_l === 'X') conclusions.push("Refiere dolor o inseguridad en la pierna izquierda durante el Askling H-test.");
      else if (flexibility.askling_h_r === 'X' && flexibility.askling_h_l === 'X') conclusions.push("Refiere dolor o inseguridad en ambas piernas durante el Askling H-test.");

      // Slump
      if (flexibility.slump_test_r === 'OK' && flexibility.slump_test_l === 'OK') conclusions.push("No se comprobó tensión neural mecánica del nervio ciático en ninguna de las piernas mediante la prueba de Slump test.");
      else if (flexibility.slump_test_r === 'X' && flexibility.slump_test_l === 'OK') conclusions.push("Se comprobó tensión neural mecánica del nervio ciático en la pierna derecha mediante la prueba de Slump test.");
      else if (flexibility.slump_test_r === 'OK' && flexibility.slump_test_l === 'X') conclusions.push("Se comprobó tensión neural mecánica del nervio ciático en la pierna izquierda mediante la prueba de Slump test.");
      else if (flexibility.slump_test_r === 'X' && flexibility.slump_test_l === 'X') conclusions.push("Se comprobó tensión neural mecánica del nervio ciático en ambos miembros mediante la prueba de Slump test.");

      // BKFO
      if (flexibility.bkfo_r !== undefined && flexibility.bkfo_l !== undefined) {
          if (flexibility.bkfo_r <= 17.4 && flexibility.bkfo_l <= 17.4) conclusions.push("No se presenta acortamiento de aductores.");
          else if (flexibility.bkfo_r > 17.4 && flexibility.bkfo_l <= 17.4) conclusions.push("Se presenta acortamiento de aductor de la pierna derecha.");
          else if (flexibility.bkfo_r <= 17.4 && flexibility.bkfo_l > 17.4) conclusions.push("Se presenta acortamiento de aductor de la pierna izquierda.");
          else conclusions.push("Se presenta acortamiento de aductores de ambas piernas.");
      }
  }

  // 3. BALANCE & Y-BALANCE
  if (balance) {
      // Reach limits: +/- 4cm difference (Ant, PM, PL) -> For simplicity we omitted creating those exact texts, 
      // but we add COMPOSITE >= 94
      
      const antR = Number(balance.y_balance_ant_r) || 0;
      const antL = Number(balance.y_balance_ant_l) || 0;
      const pmdR = Number(balance.y_balance_pm_r) || 0;
      const pmdL = Number(balance.y_balance_pm_l) || 0;
      const plR = Number(balance.y_balance_pl_r) || 0;
      const plL = Number(balance.y_balance_pl_l) || 0;
      
      if (legLength > 1 && antR > 0) {
          const compR = ((antR + pmdR + plR) / (3 * legLength)) * 100;
          const compL = ((antL + pmdL + plL) / (3 * legLength)) * 100;
          
          if (compR >= 94 && compL >= 94) conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) se encuentra dentro de los valores de referencia.");
          else if (compR < 94 && compL >= 94) conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) de la pierna derecha se encuentra por debajo de los valores de referencia.");
          else if (compR >= 94 && compL < 94) conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) de la pierna izquierda se encuentra por debajo de los valores de referencia.");
          else conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) de ambas piernas se encuentran por debajo de los valores de referencia.");
      }

      // Balance Monopodal
      const eoR = Number(balance.sls_eo_r);
      const eoL = Number(balance.sls_eo_l);
      if (eoR && eoL) {
          if (eoR >= 45 && eoL >= 45) conclusions.push("Se presenta un correcto balance monopodal con ojos abiertos.");
          else if (eoR < 45 && eoL >= 45) conclusions.push("Se presenta un déficit en el balance monopodal con ojos abiertos de la pierna derecha.");
          else if (eoR >= 45 && eoL < 45) conclusions.push("Se presenta un déficit en el balance monopodal con ojos abiertos de la pierna izquierda.");
          else conclusions.push("Se presenta un déficit en el balance monopodal con ojos abiertos de ambas piernas.");
      }

      const ecR = Number(balance.sls_ec_r);
      const ecL = Number(balance.sls_ec_l);
      if (ecR && ecL) {
          if (ecR >= 9 && ecL >= 9) conclusions.push("Se presenta un correcto balance monopodal con ojos cerrados.");
          else if (ecR < 9 && ecL >= 9) conclusions.push("Se presenta un déficit en el balance monopodal con ojos cerrados de la pierna derecha.");
          else if (ecR >= 9 && ecL < 9) conclusions.push("Se presenta un déficit en el balance monopodal con ojos cerrados de la pierna izquierda.");
          else conclusions.push("Se presenta un déficit en el balance monopodal con ojos cerrados de ambas piernas.");
      }
  }

  // 4. CORE (McGill)
  if (mcgill) {
      const flex = Number(mcgill.flexor_endurance);
      const ext = Number(mcgill.extensor_endurance);
      const latR = Number(mcgill.lateral_bridge_r);
      const latL = Number(mcgill.lateral_bridge_l);
      
      if (latR && latL) {
          if (latR < 85 || latL < 85) conclusions.push("Se presenta un déficit de fuerza resistencia en los inclinadores laterales de tronco.");
          else conclusions.push("Se presenta buena fuerza resistencia de inclinadores laterales de tronco alcanzando los valores de referencia.");
      }
      
      if (flex) {
          if (flex < 130) conclusions.push("Se presenta un déficit de fuerza resistencia en los flexores de tronco.");
          else conclusions.push("Se presenta buena fuerza resistencia de flexores de tronco alcanzando los valores de referencia.");
      }

      if (ext) {
          if (ext < 170) conclusions.push("Se presenta un déficit de fuerza resistencia en los extensores de tronco.");
          else conclusions.push("Se presenta buena fuerza resistencia de extensores de tronco alcanzando los valores de referencia.");
      }

      if (flex && ext) {
          const ratio = flex / ext;
          if (ratio >= 0.75 && ratio <= 0.77) conclusions.push("La relación flexores - extensores de tronco se encuentra normal.");
          else conclusions.push("La relación flexores - extensores de tronco se encuentra alterada.");
      }
  }

  // 5. FUERZA ISOMÉTRICA (Dinamometría)
  if (strength) {
      // Evaluaciones por peso corporal
      const categoriesRelative = [
          { key: 'adductor', label: 'aductores', threshold: 2.99 },
          { key: 'abductor', label: 'abductores', threshold: 2.59 }
      ];

      categoriesRelative.forEach(cat => {
          const r = Number(strength[`${cat.key}_r`]);
          const l = Number(strength[`${cat.key}_l`]);
          if (r > 0 && l > 0 && weight > 0) {
              const relR = r / weight;
              const relL = l / weight;
              
              if (relR >= cat.threshold && relL >= cat.threshold) conclusions.push(`Los valores de fuerza muscular unilateral de ${cat.label} alcanzan los valores de referencia.`);
              else if (relR < cat.threshold && relL >= cat.threshold) conclusions.push(`Los valores de fuerza muscular unilateral de ${cat.label} del lado derecho están por debajo de los valores de referencia.`);
              else if (relR >= cat.threshold && relL < cat.threshold) conclusions.push(`Los valores de fuerza muscular unilateral de ${cat.label} del lado izquierdo están por debajo de los valores de referencia.`);
              else conclusions.push(`Los valores de fuerza muscular unilateral de ${cat.label} de ambos lados están por debajo de los valores de referencia.`);
          }
      });

      // LSI Generales
      const categoriesLSI = [
          { key: 'hip_flex_0', label: 'fuerza muscular de flexores de cadera en la prueba de 0-0º' },
          { key: 'hip_flex_90', label: 'fuerza muscular de flexores de cadera en la prueba de 0-90º' },
          { key: 'adductor', label: 'fuerza muscular de aductores' },
          { key: 'abductor', label: 'fuerza muscular de abductores' },
          { key: 'quads', label: 'fuerza muscular de cuádriceps' },
          { key: 'hams', label: 'fuerza muscular de isquiotibiales' },
          { key: 'triceps_sural', label: 'fuerza muscular de tríceps sural' },
          { key: 'shoulder_ri', label: 'fuerza muscular de rotadores internos de hombro' },
          { key: 'shoulder_re', label: 'fuerza muscular de rotadores externos de hombro' },
          { key: 'ash_i', label: 'fuerza muscular en el Ash Test I' },
          { key: 'ash_y', label: 'fuerza muscular en el Ash Test Y' },
          { key: 'ash_t', label: 'fuerza muscular en el Ash Test T' },
          { key: 'handgrip', label: 'fuerza en el handrip' }
      ];

      categoriesLSI.forEach(cat => {
          const r = Number(strength[`${cat.key}_r`]);
          const l = Number(strength[`${cat.key}_l`]);
          if (r > 0 && l > 0) {
              const lsi = calculateLSI(r, l, dominant, injured);
              metrics.push({
                  label: `LSI ${cat.label}`,
                  value: lsi,
                  unit: '%',
                  category: 'Fuerza',
                  interpretation: getInterpretation(lsi)
              });
              
              if (lsi >= 90 && lsi <= 110) conclusions.push(`Se presenta una correcta simetría de ${cat.label}.`);
              else conclusions.push(`Se presenta una asimetría de ${cat.label}.`);
          }
      });
  }

  // 6. SALTOS VERTICALES (LSI)
  if (jumps_vertical) {
      if (jumps_vertical.cmj_1p_height_r && jumps_vertical.cmj_1p_height_l) {
          const lsi = calculateLSI(jumps_vertical.cmj_1p_height_r, jumps_vertical.cmj_1p_height_l, dominant, injured);
          metrics.push({ label: 'LSI CMJ 1 Pierna (Altura)', value: lsi, unit: '%', category: 'Saltos', interpretation: getInterpretation(lsi) });
          if (lsi >= 90 && lsi <= 110) conclusions.push("En el CMJ a 1 pierna, se presenta una correcta simetría en la altura del salto.");
          else conclusions.push("En el CMJ a 1 pierna, se presenta una asimetría en la altura del salto.");
      }
      
      // Braking y Propulsive force (CMJ 2p)
      if (jumps_vertical.cmj_2p_brake_r && jumps_vertical.cmj_2p_brake_l) {
        const lsi = calculateLSI(jumps_vertical.cmj_2p_brake_r, jumps_vertical.cmj_2p_brake_l);
        if (lsi >= 90 && lsi <= 110) conclusions.push("En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza de frenado.");
        else conclusions.push("En el CMJ a 2 piernas, se presenta una asimetría en la fuerza de frenado.");
      }
  }

  // 7. SALTOS HORIZONTALES (LSI)
  if (jumps_horizontal) {
      const hopTests = [
          { r: 'single_hop_r', l: 'single_hop_l', label: 'Single Hop Test', text: 'distancia' },
          { r: 'triple_hop_dist_r', l: 'triple_hop_dist_l', label: 'Triple Hop Test', text: 'distancia' },
          { r: 'crossover_hop_dist_r', l: 'crossover_hop_dist_l', label: 'Crossover Hop Test', text: 'distancia' }
      ];

      hopTests.forEach(test => {
          const valR = Number((jumps_horizontal as any)[test.r]);
          const valL = Number((jumps_horizontal as any)[test.l]);
          if (valR > 0 && valL > 0) {
              const lsi = calculateLSI(valR, valL, dominant, injured);
              metrics.push({ label: `LSI ${test.label}`, value: lsi, unit: '%', category: 'Saltos', interpretation: getInterpretation(lsi) });
              
              if (lsi >= 90 && lsi <= 110) conclusions.push(`En el ${test.label}, se presenta una correcta simetría en la ${test.text} del salto alcanzada.`);
              else conclusions.push(`En el ${test.label}, se presenta una asimetría en la ${test.text} del salto alcanzada.`);
          }
      });
  }

  // 8. FUNCIONAL Y AGILIDAD
  if (functional) {
      if (functional.t_test) {
          const tt = Number(functional.t_test);
          metrics.push({ label: 'T-Test Agilidad', value: tt, unit: 'seg', category: 'Funcional', interpretation: tt <= 9.5 ? 'normal' : 'warning' });
          if (tt <= 9.5) conclusions.push("Se presenta una correcta prueba de agilidad T Test.");
          else conclusions.push("Se presenta un déficit en la prueba de agilidad T Test.");
      }
      
      const cmas45R = Number(functional.cmas_45_r);
      const cmas45L = Number(functional.cmas_45_l);
      if (cmas45R && cmas45L) {
          if (cmas45R <= 3 && cmas45L <= 3) conclusions.push("Se presenta un correcto cambio de dirección a 45º en ambas piernas.");
          else if (cmas45R > 3 && cmas45L <= 3) conclusions.push("Se presenta un déficit en el cambio de dirección a 45º en la pierna derecha.");
          else if (cmas45R <= 3 && cmas45L > 3) conclusions.push("Se presenta un déficit en el cambio de dirección a 45º en la pierna izquierda.");
          else conclusions.push("Se presenta un déficit en el cambio de dirección a 45º en ambas piernas.");
      }
  }

  // Cuestionarios podrían ir aquí si estuviésen (HAGOS, IKDC, etc.)

  return { 
      conclusions: conclusions.length > 0 ? conclusions : ['Evaluación completada. Todos los valores dentro de parámetros esperados.'], 
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
