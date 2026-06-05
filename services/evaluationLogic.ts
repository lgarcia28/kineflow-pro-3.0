import { EvaluationResult, ClinicalEvaluation } from '../types';

/**
 * Motor de Cálculo para Evaluaciones Clínicas KineFlow Pro
 * Replicando exactamente la lógica del archivo "Informe General 2026.xlsx".
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
  if (lsi >= threshold && lsi <= (100 + (100 - threshold))) return 'normal';
  return 'critical';
};

// Helper para verificar si un valor ha sido ingresado y evaluado
const hasVal = (val: any): boolean => {
  return val !== undefined && val !== null && val !== '' && val !== 'No evaluado';
};

const getSymmetry = (right: number, left: number, invert = false): number => {
  if (!right || !left) return 0;
  return Number((invert ? (left / right) * 100 : (right / left) * 100).toFixed(1));
};

const isSymmetric = (sym: number): boolean => sym >= 90 && sym <= 110;

export const processEvaluation = (measurements: any): { conclusions: string[], metrics: EvaluationResult[] } => {
  const conclusions: string[] = [];
  const metrics: EvaluationResult[] = [];
  
  const { 
    basic, mobility, flexibility, palpation, 
    balance, mcgill, functional, strength, 
    vbt, jumps_vertical, jumps_horizontal, motor_control, perimetry
  } = measurements;
  
  const injured = basic?.injuredLeg || 'ninguna';
  const dominant = basic?.dominantLeg || 'derecha';
  const weight = Number(basic?.weight) || 1; // Evita división por 0
  const legLength = Number(balance?.leg_length) || 1;

  // 1. DOLOR DURANTE LA EVALUACIÓN (B14)
  if (basic && hasVal(basic.pain_during_eval)) {
    if (basic.pain_during_eval === 'No') {
      conclusions.push("Todas las pruebas fueron realizadas sin dolor y a continuación se destacan los aspectos más relevantes.");
    } else {
      conclusions.push("El paciente presentó dolor a lo largo de las evaluaciones y a continuación se destacan los aspectos más relevantes.");
    }
  }

  // 2. MOVILIDAD
  if (mobility) {
    const hipRiR = Number(mobility.hip_ir_90_r);
    const hipReR = Number(mobility.hip_er_90_r);
    const hipRiL = Number(mobility.hip_ir_90_l);
    const hipReL = Number(mobility.hip_er_90_l);
    
    // Cadera Total (D19, E19) -> Resultados!B21
    if (hasVal(mobility.hip_ir_90_r) && hasVal(mobility.hip_er_90_r) && hasVal(mobility.hip_ir_90_l) && hasVal(mobility.hip_er_90_l)) {
      const hipTotalR = hipRiR + hipReR;
      const hipTotalL = hipRiL + hipReL;
      if (hipTotalR >= 85 && hipTotalL >= 85) {
        conclusions.push("El rango de movimiento total de cadera en ambas piernas se encuentra normal.");
      } else if (hipTotalR < 85 && hipTotalL >= 85) {
        conclusions.push("El rango de movimiento total de cadera en la pierna derecha se encuentra disminuido.");
      } else if (hipTotalR >= 85 && hipTotalL < 85) {
        conclusions.push("El rango de movimiento total de cadera en la pierna izquierda se encuentra disminuido.");
      } else {
        conclusions.push("El rango de movimiento total de cadera en ambas piernas se encuentra disminuido.");
      }
    }

    // Extensión Pasiva de Rodilla (Resultados!B30)
    if (hasVal(mobility.knee_ext_pass_r) && hasVal(mobility.knee_ext_pass_l)) {
      const extR = Number(mobility.knee_ext_pass_r);
      const extL = Number(mobility.knee_ext_pass_l);
      if (extR === 0 && extL === 0) {
        conclusions.push("No presenta déficit de extensión.");
      } else {
        conclusions.push("Se presenta déficit de extensión de la rodilla.");
      }
    }

    // Flexión Activa de Rodilla (F27) -> Resultados!B31
    if (hasVal(mobility.knee_flex_act_r) && hasVal(mobility.knee_flex_act_l)) {
      const actR = Number(mobility.knee_flex_act_r);
      const actL = Number(mobility.knee_flex_act_l);
      const diffAct = actL - actR;
      if (diffAct < -10 || diffAct > 10) {
        conclusions.push("Se presenta un déficit de flexión activa de la rodilla.");
      } else {
        conclusions.push("La flexión activa de rodilla se encuentra normal.");
      }
    }

    // Flexión Pasiva de Rodilla (F28) -> Resultados!B32
    if (hasVal(mobility.knee_flex_pass_r) && hasVal(mobility.knee_flex_pass_l)) {
      const passR = Number(mobility.knee_flex_pass_r);
      const passL = Number(mobility.knee_flex_pass_l);
      const diffPass = passL - passR;
      if (diffPass < -10 || diffPass > 10) {
        conclusions.push("Se presenta un déficit de flexión pasiva de la rodilla.");
      } else {
        conclusions.push("La flexión pasiva de rodilla se encuentra normal.");
      }
    }

    // Dorsiflexión Tobillo (Resultados!B37)
    if (hasVal(mobility.ankle_dorsiflex_r) && hasVal(mobility.ankle_dorsiflex_l)) {
      const dR = Number(mobility.ankle_dorsiflex_r);
      const dL = Number(mobility.ankle_dorsiflex_l);
      if (dR < 39 && dL < 39) {
        conclusions.push("Presenta un déficit de flexión dorsal del tobillo de ambas piernas.");
      } else if (dR < 39) {
        conclusions.push("Presenta un déficit de flexión dorsal del tobillo de la pierna derecha.");
      } else if (dL < 39) {
        conclusions.push("Presenta un déficit de flexión dorsal del tobillo de la pierna izquierda.");
      } else {
        conclusions.push("No presenta déficit en la flexión dorsal del tobillo.");
      }
    }

    // Hombro Rotación Interna (F40) -> Resultados!B44
    if (hasVal(mobility.shoulder_ir_r) && hasVal(mobility.shoulder_ir_l)) {
      const irR = Number(mobility.shoulder_ir_r);
      const irL = Number(mobility.shoulder_ir_l);
      const diffIr = irL - irR;
      if (diffIr < -18 || diffIr > 18) {
        conclusions.push("Se presenta un déficit de rotación interna del hombro.");
      } else {
        conclusions.push("No se presenta un déficit de rotación interna del hombro.");
      }
      
      // Hombro Arco Total (F42) -> Resultados!B45
      if (hasVal(mobility.shoulder_er_r) && hasVal(mobility.shoulder_er_l)) {
        const erR = Number(mobility.shoulder_er_r);
        const erL = Number(mobility.shoulder_er_l);
        const arcR = irR + erR;
        const arcL = irL + erL;
        const diffArc = arcL - arcR;
        if (diffArc >= -5 && diffArc <= 5) {
          conclusions.push("Se presenta un normal arco total del movimiento del hombro");
        } else {
          conclusions.push("Se presenta un déficit del arco total del movimiento del hombro");
        }
      }
    }
  }

  // 3. PERÍMETROS MUSCULARES (B51, B52)
  if (perimetry) {
    if (hasVal(perimetry.thigh_r) && hasVal(perimetry.thigh_l)) {
      const tR = Number(perimetry.thigh_r);
      const tL = Number(perimetry.thigh_l);
      const diffThigh = tL - tR;
      if (diffThigh === 0) {
        conclusions.push("No se presenta un déficit en el perímetro de muslo.");
      } else {
        conclusions.push(`Se presenta un déficit en el perímetro de muslo de ${Math.abs(diffThigh).toFixed(1)} cm.`);
      }
    }
    if (hasVal(perimetry.calf_r) && hasVal(perimetry.calf_l)) {
      const cR = Number(perimetry.calf_r);
      const cL = Number(perimetry.calf_l);
      const diffCalf = cL - cR;
      if (diffCalf === 0) {
        conclusions.push("No se presenta un déficit en el perímetro de pantorilla");
      } else {
        conclusions.push(`Se presenta un déficit en el perímetro de pantorilla de ${Math.abs(diffCalf).toFixed(1)} cm`);
      }
    }
  }

  // 4. FLEXIBILIDAD Y NEUROORTOPÉDICO
  if (flexibility) {
    // Thomas Test Right (E55, F55, G55) -> Resultados!B66
    const psoR = flexibility.thomas_test_psoas_r;
    const recR = flexibility.thomas_test_rectus_r;
    const sarR = flexibility.thomas_test_sartorius_r;
    if (hasVal(psoR) && hasVal(recR) && hasVal(sarR)) {
      if (psoR === 'X' && recR === 'OK' && sarR === 'OK') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco.");
      else if (psoR === 'X' && recR === 'X' && sarR === 'OK') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco y del Recto Anterior.");
      else if (psoR === 'X' && recR === 'X' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco, del Recto Anterior y del Sartorio.");
      else if (psoR === 'X' && recR === 'OK' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Psoas Ilíaco y del Sartorio.");
      else if (psoR === 'OK' && recR === 'X' && sarR === 'OK') conclusions.push("En la pierna derecha, se presenta un acortamiento del Recto Anterior.");
      else if (psoR === 'OK' && recR === 'X' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Recto Anterior y del Sartorio.");
      else if (psoR === 'OK' && recR === 'OK' && sarR === 'X') conclusions.push("En la pierna derecha, se presenta un acortamiento del Sartorio.");
      else if (psoR === 'OK' && recR === 'OK' && sarR === 'OK') conclusions.push("En la pierna derecha, no se presenta un acortamiento de los flexores de cadera.");
    }
    
    // Thomas Test Left (E56, F56, G56) -> Resultados!B67
    const psoL = flexibility.thomas_test_psoas_l;
    const recL = flexibility.thomas_test_rectus_l;
    const sarL = flexibility.thomas_test_sartorius_l;
    if (hasVal(psoL) && hasVal(recL) && hasVal(sarL)) {
      if (psoL === 'X' && recL === 'OK' && sarL === 'OK') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco.");
      else if (psoL === 'X' && recL === 'X' && sarL === 'OK') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco y del Recto Anterior.");
      else if (psoL === 'X' && recL === 'X' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco, del Recto Anterior y del Sartorio.");
      else if (psoL === 'X' && recL === 'OK' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Psoas Ilíaco y del Sartorio.");
      else if (psoL === 'OK' && recL === 'X' && sarL === 'OK') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Recto Anterior.");
      else if (psoL === 'OK' && recL === 'X' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Recto Anterior y del Sartorio.");
      else if (psoL === 'OK' && recL === 'OK' && sarL === 'X') conclusions.push("En la pierna izquierda, se presenta un acortamiento del Sartorio.");
      else if (psoL === 'OK' && recL === 'OK' && sarL === 'OK') conclusions.push("En la pierna izquierda, no se presenta un acortamiento de los flexores de cadera.");
    }

    // AKE Isquiotibiales (D59, E59) -> Resultados!B68
    if (hasVal(flexibility.hams_r) && hasVal(flexibility.hams_l)) {
      const hR = Number(flexibility.hams_r);
      const hL = Number(flexibility.hams_l);
      if (hR >= 70 && hL >= 70) conclusions.push("No se presenta acortamiento de los isquiotibiales.");
      else if (hR < 70 && hL >= 70) conclusions.push("Se presenta un acortamiento del isquiotibial de la pierna derecha.");
      else if (hR >= 70 && hL < 70) conclusions.push("Se presenta un acortamiento del isquiotibial de la pierna izquierda.");
      else conclusions.push("Se presenta un acortamiento de los isquiotibiales en ambas piernas.");
    }

    // Askling H-test (D60, E60) -> Resultados!B69
    if (hasVal(flexibility.askling_h_r) && hasVal(flexibility.askling_h_l)) {
      const askR = flexibility.askling_h_r;
      const askL = flexibility.askling_h_l;
      if (askR === 'OK' && askL === 'OK') conclusions.push("No se refiere dolor o inseguridad durante el Askling H-test en ninguna de las piernas.");
      else if (askR === 'X' && askL === 'OK') conclusions.push("Refiere dolor o inseguridad en la pierna derecha durante el Askling H-test.");
      else if (askR === 'OK' && askL === 'X') conclusions.push("Refiere dolor o inseguridad en la pierna izquierda durante el Askling H-test.");
      else conclusions.push("Refiere dolor o inseguridad en ambas piernas durante el Askling H-test.");
    }

    // Slump test (D61, E61) -> Resultados!B70
    if (hasVal(flexibility.slump_test_r) && hasVal(flexibility.slump_test_l)) {
      const slumpR = flexibility.slump_test_r;
      const slumpL = flexibility.slump_test_l;
      if (slumpR === 'OK' && slumpL === 'OK') conclusions.push("No se comprobó tensión neural mecánica del nervio ciático en ninguna de las piernas mediante la prueba de Slump test.");
      else if (slumpR === 'X' && slumpL === 'OK') conclusions.push("Se comprobó tensión neural mecánica del nervio ciático en la pierna derecha mediante la prueba de Slump test.");
      else if (slumpR === 'OK' && slumpL === 'X') conclusions.push("Se comprobó tensión neural mecánica del nervio ciático en la pierna izquierda mediante la prueba de Slump test.");
      else conclusions.push("Se comprobó tensión neural mecánica del nervio ciático en ambos miembros mediante la prueba de Slump test.");
    }

    // BKFO Test (D64, E64) -> Resultados!B71
    if (hasVal(flexibility.bkfo_r) && hasVal(flexibility.bkfo_l)) {
      const bkR = Number(flexibility.bkfo_r);
      const bkL = Number(flexibility.bkfo_l);
      if (bkR <= 17.4 && bkL <= 17.4) conclusions.push("No se presenta acortamiento de aductores");
      else if (bkR > 17.4 && bkL <= 17.4) conclusions.push("Se presenta acortamiento de aductor de la pierna derecha");
      else if (bkR <= 17.4 && bkL > 17.4) conclusions.push("Se presenta acortamiento de aductor de la pierna izquierda");
      else conclusions.push("Se presenta acortamiento de aductores de ambas piernas");
    }
  }

  // 5. EQUILIBRIO
  if (balance) {
    const antR = Number(balance.y_balance_ant_r);
    const antL = Number(balance.y_balance_ant_l);
    const pmR = Number(balance.y_balance_pm_r);
    const pmL = Number(balance.y_balance_pm_l);
    const plR = Number(balance.y_balance_pl_r);
    const plL = Number(balance.y_balance_pl_l);

    // Y-Balance Anterior (F89) -> Resultados!B100
    if (hasVal(balance.y_balance_ant_r) && hasVal(balance.y_balance_ant_l)) {
      const diffAnt = antL - antR;
      if (diffAnt >= -4 && diffAnt <= 4) {
        conclusions.push("El alcance anterior se encuentra normal.");
      } else {
        conclusions.push("El alcance anterior se encuentra en déficit.");
      }
    }

    // Y-Balance Posteromedial (F90) -> Resultados!B101
    if (hasVal(balance.y_balance_pm_r) && hasVal(balance.y_balance_pm_l)) {
      const diffPm = pmL - pmR;
      if (diffPm >= -4 && diffPm <= 4) {
        conclusions.push("El alcance posteromedial se encuentra normal.");
      } else {
        conclusions.push("El alcance posteromedial se encuentra en déficit.");
      }
    }

    // Y-Balance Posterolateral (F91) -> Resultados!B102
    if (hasVal(balance.y_balance_pl_r) && hasVal(balance.y_balance_pl_l)) {
      const diffPl = plL - plR;
      if (diffPl >= -4 && diffPl <= 4) {
        conclusions.push("El alcance posterolateral se encuentra normal.");
      } else {
        conclusions.push("El alcance posterolateral se encuentra en déficit.");
      }
    }

    // Y-Balance Composite (D92, E92) -> Resultados!B103
    if (legLength > 1 && hasVal(balance.y_balance_ant_r) && hasVal(balance.y_balance_pm_r) && hasVal(balance.y_balance_pl_r) &&
        hasVal(balance.y_balance_ant_l) && hasVal(balance.y_balance_pm_l) && hasVal(balance.y_balance_pl_l)) {
      const compR = ((antR + pmR + plR) / (3 * legLength)) * 100;
      const compL = ((antL + pmL + plL) / (3 * legLength)) * 100;
      
      if (compR >= 94 && compL >= 94) {
        conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) se encuentra dentro de los valores de referencia.");
      } else if (compR < 94 && compL >= 94) {
        conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) de la pierna derecha se encuentra por debajo de los valores de referencia.");
      } else if (compR >= 94 && compL < 94) {
        conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) de la pierna izquierda se encuentra por debajo de los valores de referencia.");
      } else {
        conclusions.push("El composite (relación entre la distancia alcanzada y la longitud de la pierna) de ambas piernas se encuentran por debajo de los valores de referencia.");
      }
    }

    // Balance Monopodal Ojos Abiertos (D95, F95) -> Resultados!B104
    if (hasVal(balance.eyes_open_r) && hasVal(balance.eyes_open_l)) {
      const eoR = Number(balance.eyes_open_r);
      const eoL = Number(balance.eyes_open_l);
      if (eoR >= 45 && eoL >= 45) {
        conclusions.push("Se presenta un correcto balance monopodal con ojos abiertos");
      } else if (eoR < 45 && eoL >= 45) {
        conclusions.push("Se presenta un déficit en el balance monopodal con ojos abiertos de la pierna derecha");
      } else if (eoR >= 45 && eoL < 45) {
        conclusions.push("Se presenta un déficit en el balance monopodal con ojos abiertos de la pierna izquierda");
      } else {
        conclusions.push("Se presenta un déficit en el balance monopodal con ojos abiertos de ambas piernas");
      }
    }

    // Balance Monopodal Ojos Cerrados (D96, F96) -> Resultados!B105
    if (hasVal(balance.eyes_closed_r) && hasVal(balance.eyes_closed_l)) {
      const ecR = Number(balance.eyes_closed_r);
      const ecL = Number(balance.eyes_closed_l);
      if (ecR >= 9 && ecL >= 9) {
        conclusions.push("Se presenta un correcto balance monopodal con ojos cerrados");
      } else if (ecR < 9 && ecL >= 9) {
        conclusions.push("Se presenta un déficit en el balance monopodal con ojos cerrados de la pierna derecha");
      } else if (ecR >= 9 && ecL < 9) {
        conclusions.push("Se presenta un déficit en el balance monopodal con ojos cerrados de la pierna izquierda");
      } else {
        conclusions.push("Se presenta un déficit en el balance monopodal con ojos cerrados de ambas piernas");
      }
    }

    // Vestibular Test (D97, D98, F97, F98) -> Resultados!B106
    const vestSideR = balance.vestibular_side_r;
    const vestUpR = balance.vestibular_up_r;
    const vestSideL = balance.vestibular_side_l;
    const vestUpL = balance.vestibular_up_l;
    if (hasVal(vestSideR) && hasVal(vestUpR) && hasVal(vestSideL) && hasVal(vestUpL)) {
      if (vestSideR === 'OK' && vestUpR === 'OK' && vestSideL === 'OK' && vestUpL === 'OK') {
        conclusions.push("La prueba de balance vestibular fue satisfactoria en ambas piernas en ambos movimientos.");
      } else if (vestSideR === 'X' && vestUpR === 'X' && vestSideL === 'OK' && vestUpL === 'OK') {
        conclusions.push("Se presenta un déficit vestibular en la pierna derecha en ambos movimientos.");
      } else if (vestSideL === 'X' && vestUpL === 'X' && vestSideR === 'OK' && vestUpR === 'OK') {
        conclusions.push("Se presenta un déficit vestibular en la pierna izquierda en ambos movimientos.");
      } else if (vestSideR === 'X' && vestSideL === 'X' && vestUpR === 'OK' && vestUpL === 'OK') {
        conclusions.push("Se presenta un déficit de balance vestibular en movimiento lateral en ambas piernas.");
      } else if (vestUpR === 'X' && vestUpL === 'X' && vestSideR === 'OK' && vestSideL === 'OK') {
        conclusions.push("Se presenta un déficit de balance vestibular en movimiento vertical en ambas piernas.");
      } else if (vestSideR === 'X' && vestUpR === 'OK' && vestSideL === 'OK' && vestUpL === 'OK') {
        conclusions.push("Se presenta un déficit vestibular en movimiento lateral de la pierna derecha.");
      } else if (vestSideR === 'OK' && vestUpR === 'X' && vestSideL === 'OK' && vestUpL === 'OK') {
        conclusions.push("Se presenta un déficit vestibular en movimiento vertical de la pierna derecha.");
      } else if (vestSideL === 'X' && vestUpL === 'OK' && vestSideR === 'OK' && vestUpR === 'OK') {
        conclusions.push("Se presenta un déficit vestibular en movimiento lateral de la pierna izquierda.");
      } else if (vestSideL === 'OK' && vestUpL === 'X' && vestSideR === 'OK' && vestUpR === 'OK') {
        conclusions.push("Se presenta un déficit vestibular en movimiento vertical de la pierna izquierda.");
      } else {
        conclusions.push("Se presenta déficit vestibular en múltiples combinaciones.");
      }
    }
  }

  // 6. CORE (McGill)
  if (mcgill) {
    const latR = Number(mcgill.lateral_bridge_r);
    const latL = Number(mcgill.lateral_bridge_l);
    const flex = Number(mcgill.flexor_endurance);
    const ext = Number(mcgill.extensor_endurance);

    // Lateral Bridge (Resultados!B120)
    if (hasVal(mcgill.lateral_bridge_r) && hasVal(mcgill.lateral_bridge_l)) {
      if (latR < 85 || latL < 85) {
        conclusions.push("Se presenta un déficit de fuerza resistencia en los inclinadores laterales de tronco.");
      } else {
        conclusions.push("Se presenta buena fuerza resistencia de inclinadores laterales de tronco alcanzando los valores de referencia.");
      }
    }

    // Flexores (Resultados!B121)
    if (hasVal(mcgill.flexor_endurance)) {
      if (flex < 130) {
        conclusions.push("Se presenta un déficit de fuerza resistencia en los flexores de tronco.");
      } else {
        conclusions.push("Se presenta buena fuerza resistencia de flexores de tronco alcanzando los valores de referencia.");
      }
    }

    // Extensores (Resultados!B122)
    if (hasVal(mcgill.extensor_endurance)) {
      if (ext < 170) {
        conclusions.push("Se presenta un déficit de fuerza resistencia en los extensores de tronco.");
      } else {
        conclusions.push("Se presenta buena fuerza resistencia de extensores de tronco alcanzando los valores de referencia.");
      }
    }

    // Relación flexores/extensores (Resultados!B123)
    if (hasVal(mcgill.flexor_endurance) && hasVal(mcgill.extensor_endurance) && ext > 0) {
      const ratio = flex / ext;
      if (ratio >= 0.75 && ratio <= 0.77) {
        conclusions.push("La relación flexores - extensores de tronco se encuentra normal.");
      } else {
        conclusions.push("La relación flexores - extensores de tronco se encuentra alterada.");
      }
    }
  }

  // 7. RESISTENCIA FUNCIONAL (B124, B125, B126)
  if (functional) {
    // Puente Glúteo a 1p (D113, E113) -> Resultados!B124
    if (hasVal(functional.glute_bridge_r) && hasVal(functional.glute_bridge_l)) {
      const gbR = Number(functional.glute_bridge_r);
      const gbL = Number(functional.glute_bridge_l);
      if (gbR < 20 && gbL >= 20) conclusions.push("Se presenta un déficit de fuerza resistencia de glúteo de la pierna derecha.");
      else if (gbR >= 20 && gbL < 20) conclusions.push("Se presenta un déficit de fuerza resistencia de glúteo de la pierna izquierda.");
      else if (gbR < 20 && gbL < 20) conclusions.push("Se presenta un déficit de fuerza resistencia de glúteo en ambas piernas.");
      else conclusions.push("Se presenta buena fuerza resistencia de glúteo alcanzando los valores de referencia.");
    }

    // Elevación Gemelo a 1p (D115, E115) -> Resultados!B125
    if (hasVal(functional.calf_raise_r) && hasVal(functional.calf_raise_l)) {
      const crR = Number(functional.calf_raise_r);
      const crL = Number(functional.calf_raise_l);
      if (crR < 20 && crL >= 20) conclusions.push("Se presenta un déficit de fuerza resistencia de gemelo de la pierna derecha.");
      else if (crR >= 20 && crL < 20) conclusions.push("Se presenta un déficit de fuerza resistencia de gemelo de la pierna izquierda.");
      else if (crR < 20 && crL < 20) conclusions.push("Se presenta un déficit de fuerza resistencia de los gemelos en ambas piernas.");
      else conclusions.push("Se presenta buena fuerza resistencia de los gemelos alcanzando los valores de referencia.");
    }

    // Sentadilla a 1p reps (D117, E117) -> Resultados!B126
    if (hasVal(functional.single_leg_squat_r) && hasVal(functional.single_leg_squat_l)) {
      const slsR = Number(functional.single_leg_squat_r);
      const slsL = Number(functional.single_leg_squat_l);
      if (slsR < 20 && slsL >= 20) conclusions.push("Se presenta un déficit de fuerza resistencia de cuádriceps de la pierna derecha.");
      else if (slsR >= 20 && slsL < 20) conclusions.push("Se presenta un déficit de fuerza resistencia de cuádriceps de la pierna izquierda.");
      else if (slsR < 20 && slsL < 20) conclusions.push("Se presenta un déficit de fuerza resistencia del cuádriceps en ambas piernas.");
      else conclusions.push("Se presenta buena fuerza resistencia del cuádriceps alcanzando los valores de referencia.");
    }

    // Press de hombro LSI (Resultados!B136)
    if (hasVal(functional.shoulder_press_r) && hasVal(functional.shoulder_press_l)) {
      const spR = Number(functional.shoulder_press_r);
      const spL = Number(functional.shoulder_press_l);
      const sym = getSymmetry(spR, spL);
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza resistencia en el ejercicio press de hombro");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza resistencia en el ejercicio press de hombro");
      }
    }
  }

  // 8. FUERZA ISOMÉTRICA (Dinamometría)
  if (strength) {
    const f0R = Number(strength.hip_flex_0_r);
    const f0L = Number(strength.hip_flex_0_l);
    const f90R = Number(strength.hip_flex_90_r);
    const f90L = Number(strength.hip_flex_90_l);
    const sq = Number(strength.squeeze_test);
    const addR = Number(strength.adductor_r);
    const addL = Number(strength.adductor_l);
    const abdR = Number(strength.abductor_r);
    const abdL = Number(strength.abductor_l);

    // Flexores cadera 0-0º LSI (Resultados!B151)
    if (hasVal(strength.hip_flex_0_r) && hasVal(strength.hip_flex_0_l)) {
      const sym = getSymmetry(f0R, f0L);
      metrics.push({ label: 'LSI Flexores Cadera 0-0º', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de flexores de cadera en la prueba de 0-0º.");
      } else {
        conclusions.push("Se presenta una asimetría de de flexores de cadera en la prueba de 0-0º.");
      }
    }

    // Flexores cadera 0-90º LSI (Resultados!B152)
    if (hasVal(strength.hip_flex_90_r) && hasVal(strength.hip_flex_90_l)) {
      const sym = getSymmetry(f90R, f90L);
      metrics.push({ label: 'LSI Flexores Cadera 0-90º', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de flexores de cadera en la prueba de 0-90º.");
      } else {
        conclusions.push("Se presenta una asimetría de de flexores de cadera en la prueba de 0-90º.");
      }
    }

    // Squeeze Test relative by weight (Resultados!B153)
    if (hasVal(strength.squeeze_test)) {
      const relSq = sq / weight;
      metrics.push({ label: 'Squeeze Test Relativo', value: Number(relSq.toFixed(2)), unit: 'N/Kg', category: 'Fuerza', interpretation: relSq >= 3.6 ? 'normal' : 'critical' });
      if (relSq < 3.6) {
        conclusions.push("Los valores de fuerza muscular de aductores en el Squeeze test están por debajo de los valores de referencia.");
      } else {
        conclusions.push("Los valores de fuerza muscular de aductores en el Squeeze test alcanzan los valores de referencia.");
      }
    }

    // Aductores LSI (Resultados!B154)
    if (hasVal(strength.adductor_r) && hasVal(strength.adductor_l)) {
      const sym = getSymmetry(addR, addL);
      metrics.push({ label: 'LSI Aductores', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de aductores.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de aductores.");
      }

      // Aductores relativos a peso (Resultados!B155)
      const relAddR = addR / weight;
      const relAddL = addL / weight;
      if (relAddR >= 2.99 && relAddL >= 2.99) {
        conclusions.push("Los valores de fuerza muscular unilateral de aductores alcanzan los valores de referencia.");
      } else if (relAddR < 2.99 && relAddL >= 2.99) {
        conclusions.push("Los valores de fuerza muscular unilateral de aductores del lado derecho están por debajo de los valores de referencia.");
      } else if (relAddR >= 2.99 && relAddL < 2.99) {
        conclusions.push("Los valores de fuerza muscular unilateral de aductores del lado izquierdo están por debajo de los valores de referencia.");
      } else {
        conclusions.push("Los valores de fuerza muscular unilateral de aductores de ambos lados están por debajo de los valores de referencia.");
      }
    }

    // Abductores LSI (Resultados!B156)
    if (hasVal(strength.abductor_r) && hasVal(strength.abductor_l)) {
      const sym = getSymmetry(abdR, abdL);
      metrics.push({ label: 'LSI Abductores', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de abductores.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de abductores.");
      }

      // Abductores relativos a peso (Resultados!B157) -> FIXED copy-paste bugs
      const relAbdR = abdR / weight;
      const relAbdL = abdL / weight;
      if (relAbdR >= 2.59 && relAbdL >= 2.59) {
        conclusions.push("Los valores de fuerza muscular unilateral de abductores alcanzan los valores de referencia.");
      } else if (relAbdR < 2.59 && relAbdL >= 2.59) {
        conclusions.push("Los valores de fuerza muscular unilateral de abductores del lado derecho están por debajo de los valores de referencia.");
      } else if (relAbdR >= 2.59 && relAbdL < 2.59) {
        conclusions.push("Los valores de fuerza muscular unilateral de abductores del lado izquierdo están por debajo de los valores de referencia.");
      } else {
        conclusions.push("Los valores de fuerza muscular unilateral de abductores de ambos lados están por debajo de los valores de referencia.");
      }
    }

    // Relación Aductor / Abductor (Resultados!B158, B159)
    if (hasVal(strength.adductor_r) && hasVal(strength.abductor_r) && abdR > 0) {
      const ratR = addR / abdR;
      if (ratR >= 1.16 && ratR <= 1.18) {
        conclusions.push("La relación aductores - abductores de la pierna derecha se encuentra normal.");
      } else {
        conclusions.push("La relación aductores - abductores de la pierna derecha se encuentra alterada.");
      }
    }
    if (hasVal(strength.adductor_l) && hasVal(strength.abductor_l) && abdL > 0) {
      const ratL = addL / abdL;
      if (ratL >= 1.16 && ratL <= 1.18) {
        conclusions.push("La relación aductores - abductores de la pierna izquierda se encuentra normal.");
      } else {
        conclusions.push("La relación aductores - abductores de la pierna izquierda se encuentra alterada.");
      }
    }

    // Cuádriceps LSI (Resultados!B168)
    if (hasVal(strength.quads_r) && hasVal(strength.quads_l)) {
      const qR = Number(strength.quads_r);
      const qL = Number(strength.quads_l);
      const sym = getSymmetry(qR, qL);
      metrics.push({ label: 'LSI Cuádriceps', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de cuádriceps.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de cuádriceps.");
      }
    }

    // Isquiotibiales LSI (Resultados!B169)
    if (hasVal(strength.hams_r) && hasVal(strength.hams_l)) {
      const hR = Number(strength.hams_r);
      const hL = Number(strength.hams_l);
      const sym = getSymmetry(hR, hL);
      metrics.push({ label: 'LSI Isquiotibiales', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de isquiotibiales.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de isquiotibiales.");
      }
    }

    // Tríceps Sural LSI (Resultados!B180)
    if (hasVal(strength.triceps_sural_r) && hasVal(strength.triceps_sural_l)) {
      const tsR = Number(strength.triceps_sural_r);
      const tsL = Number(strength.triceps_sural_l);
      const sym = getSymmetry(tsR, tsL);
      metrics.push({ label: 'LSI Tríceps Sural', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular del tríceps sural.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular del tríceps sural.");
      }
    }

    // Abductores Tobillo LSI (Resultados!B181)
    if (hasVal(strength.tobillo_abd_r) && hasVal(strength.tobillo_abd_l)) {
      const taR = Number(strength.tobillo_abd_r);
      const taL = Number(strength.tobillo_abd_l);
      const sym = getSymmetry(taR, taL);
      metrics.push({ label: 'LSI Abductores Tobillo', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de abductores de tobillo.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de abductores de tobillo.");
      }
    }

    // Aductores Tobillo LSI (Resultados!B182)
    if (hasVal(strength.tobillo_add_r) && hasVal(strength.tobillo_add_l)) {
      const tadR = Number(strength.tobillo_add_r);
      const tadL = Number(strength.tobillo_add_l);
      const sym = getSymmetry(tadR, tadL);
      metrics.push({ label: 'LSI Aductores Tobillo', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de aductores de tobillo.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de aductores de tobillo.");
      }
    }

    // IMTP Fuerza Pico LSI (Resultados!B189)
    if (hasVal(strength.imtp_r) && hasVal(strength.imtp_l)) {
      const imR = Number(strength.imtp_r);
      const imL = Number(strength.imtp_l);
      const sym = getSymmetry(imR, imL);
      metrics.push({ label: 'LSI IMTP Pico', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza pico unilateral.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza pico unilateral.");
      }
    }

    // Rotadores Internos Hombro LSI (Resultados!B204)
    if (hasVal(strength.shoulder_ri_r) && hasVal(strength.shoulder_ri_l)) {
      const riR = Number(strength.shoulder_ri_r);
      const riL = Number(strength.shoulder_ri_l);
      const sym = getSymmetry(riR, riL);
      metrics.push({ label: 'LSI Rotadores Internos Hombro', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de rotadores internos de hombro.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de rotadores internos de hombro.");
      }
    }

    // Rotadores Externos Hombro LSI (Resultados!B205)
    if (hasVal(strength.shoulder_re_r) && hasVal(strength.shoulder_re_l)) {
      const reR = Number(strength.shoulder_re_r);
      const reL = Number(strength.shoulder_re_l);
      const sym = getSymmetry(reR, reL);
      metrics.push({ label: 'LSI Rotadores Externos Hombro', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular de rotadores externos de hombro.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular de rotadores externos de hombro.");
      }
    }

    // Ash Test I LSI (Resultados!B206)
    if (hasVal(strength.ash_i_r) && hasVal(strength.ash_i_l)) {
      const ashIR = Number(strength.ash_i_r);
      const ashIL = Number(strength.ash_i_l);
      const sym = getSymmetry(ashIR, ashIL);
      metrics.push({ label: 'LSI Ash Test I', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular en el Ash Test I.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular en el Ash Test I.");
      }
    }

    // Ash Test Y LSI (Resultados!B207)
    if (hasVal(strength.ash_y_r) && hasVal(strength.ash_y_l)) {
      const ashYR = Number(strength.ash_y_r);
      const ashYL = Number(strength.ash_y_l);
      const sym = getSymmetry(ashYR, ashYL);
      metrics.push({ label: 'LSI Ash Test Y', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular en el Ash Test Y.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular en el Ash Test Y.");
      }
    }

    // Ash Test T LSI (Resultados!B208) -> FIXED H200 typo
    if (hasVal(strength.ash_t_r) && hasVal(strength.ash_t_l)) {
      const ashTR = Number(strength.ash_t_r);
      const ashTL = Number(strength.ash_t_l);
      const sym = getSymmetry(ashTR, ashTL);
      metrics.push({ label: 'LSI Ash Test T', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza muscular en el Ash Test T.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza muscular en el Ash Test T.");
      }
    }

    // Handgrip LSI (Resultados!B213)
    if (hasVal(strength.handgrip_r) && hasVal(strength.handgrip_l)) {
      const hgR = Number(strength.handgrip_r);
      const hgL = Number(strength.handgrip_l);
      const sym = getSymmetry(hgR, hgL);
      metrics.push({ label: 'LSI Handgrip', value: sym, unit: '%', category: 'Fuerza', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) {
        conclusions.push("Se presenta una correcta simetría de fuerza en el handrip.");
      } else {
        conclusions.push("Se presenta una asimetría de fuerza en el handrip.");
      }
    }

    // Evolución de Fuerza (Resultados!B221 a B224)
    if (hasVal(strength.quads_r_eval1) && hasVal(strength.quads_r_eval2) && Number(strength.quads_r_eval1) > 0) {
      const qe1 = Number(strength.quads_r_eval1);
      const qe2 = Number(strength.quads_r_eval2);
      const pct = ((qe2 - qe1) / qe1) * 100;
      conclusions.push(`Se presenta una mejora en Cuádriceps derecho de un ${Math.round(pct)}%`);
    }
    if (hasVal(strength.quads_l_eval1) && hasVal(strength.quads_l_eval2) && Number(strength.quads_l_eval1) > 0) {
      const qe1 = Number(strength.quads_l_eval1);
      const qe2 = Number(strength.quads_l_eval2);
      const pct = ((qe2 - qe1) / qe1) * 100;
      conclusions.push(`Se presenta una mejora en Cuádriceps izquierdo de un ${Math.round(pct)}%`);
    }
    if (hasVal(strength.hams_r_eval1) && hasVal(strength.hams_r_eval2) && Number(strength.hams_r_eval1) > 0) {
      const he1 = Number(strength.hams_r_eval1);
      const he2 = Number(strength.hams_r_eval2);
      const pct = ((he2 - he1) / he1) * 100;
      conclusions.push(`Se presenta una mejora en Isquiotibiales derecho de un ${Math.round(pct)}%`);
    }
    if (hasVal(strength.hams_l_eval1) && hasVal(strength.hams_l_eval2) && Number(strength.hams_l_eval1) > 0) {
      const he1 = Number(strength.hams_l_eval1);
      const he2 = Number(strength.hams_l_eval2);
      const pct = ((he2 - he1) / he1) * 100;
      conclusions.push(`Se presenta una mejora en Isquiotibiales izquierdo de un ${Math.round(pct)}%`);
    }
  }

  // 9. VBT (Velocidad Base de Entrenamiento)
  if (vbt) {
    // VBT Sentadilla LSI (Resultados!B232)
    if (hasVal(vbt.squat_r) && hasVal(vbt.squat_l)) {
      const sym = getSymmetry(Number(vbt.squat_r), Number(vbt.squat_l));
      metrics.push({ label: 'VBT Simetría Sentadilla', value: sym, unit: '%', category: 'Potencia', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En la Sentadilla, se presenta una correcta simetría en la velocidad de ejecución.");
      else conclusions.push("En la Sentadilla, se presenta una asimetría en la velocidad de ejecución.");
    }
    
    // VBT Peso Muerto LSI (Resultados!B233)
    if (hasVal(vbt.deadlift_r) && hasVal(vbt.deadlift_l)) {
      const sym = getSymmetry(Number(vbt.deadlift_r), Number(vbt.deadlift_l));
      metrics.push({ label: 'VBT Simetría Peso Muerto', value: sym, unit: '%', category: 'Potencia', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Peso Muerto, se presenta una correcta simetría en la velocidad de ejecución.");
      else conclusions.push("En el Peso Muerto, se presenta una asimetría en la velocidad de ejecución.");
    }

    // VBT Puente Glúteo LSI (Resultados!B234)
    if (hasVal(vbt.glute_bridge_r) && hasVal(vbt.glute_bridge_l)) {
      const sym = getSymmetry(Number(vbt.glute_bridge_r), Number(vbt.glute_bridge_l));
      metrics.push({ label: 'VBT Simetría Puente Glúteo', value: sym, unit: '%', category: 'Potencia', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Puente Glúteo, se presenta una correcta simetría en la velocidad de ejecución.");
      else conclusions.push("En el Puente Glúteo, se presenta una asimetría en la velocidad de ejecución.");
    }

    // VBT Sentadilla Búlgara LSI (Resultados!B235)
    if (hasVal(vbt.bulgarian_r) && hasVal(vbt.bulgarian_l)) {
      const sym = getSymmetry(Number(vbt.bulgarian_r), Number(vbt.bulgarian_l));
      metrics.push({ label: 'VBT Simetría Sentadilla Búlgara', value: sym, unit: '%', category: 'Potencia', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En la sentadilla búlgara, se presenta una correcta simetría en la velocidad de ejecución.");
      else conclusions.push("En la sentadilla búlgara, se presenta una asimetría en la velocidad de ejecución.");
    }
  }

  // 10. SALTOS VERTICALES
  if (jumps_vertical) {
    // CMJ 2p Fuerza Frenado LSI (Resultados!B255)
    if (hasVal(jumps_vertical.cmj_2p_brake_r) && hasVal(jumps_vertical.cmj_2p_brake_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_2p_brake_r), Number(jumps_vertical.cmj_2p_brake_l));
      metrics.push({ label: 'LSI CMJ 2p Frenado', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza de frenado.");
      else conclusions.push("En el CMJ a 2 piernas, se presenta una asimetría en la fuerza de frenado.");
    }

    // CMJ 2p Fuerza Propulsiva LSI (Resultados!B256)
    if (hasVal(jumps_vertical.cmj_2p_prop_r) && hasVal(jumps_vertical.cmj_2p_prop_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_2p_prop_r), Number(jumps_vertical.cmj_2p_prop_l));
      metrics.push({ label: 'LSI CMJ 2p Propulsión', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza propulsiva.");
      else conclusions.push("En el CMJ a 2 piernas, se presenta una asimetría en la fuerza propulsiva.");
    }

    // CMJ 2p Fuerza Aterrizaje LSI (Resultados!B257)
    if (hasVal(jumps_vertical.cmj_2p_land_r) && hasVal(jumps_vertical.cmj_2p_land_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_2p_land_r), Number(jumps_vertical.cmj_2p_land_l));
      metrics.push({ label: 'LSI CMJ 2p Aterrizaje', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 2 piernas, se presenta una correcta simetría en la fuerza de aterrizaje.");
      else conclusions.push("En el CMJ a 2 piernas, se presenta una asimetría en la fuerza de aterrizaje.");
    }

    // CMJ 1p Altura LSI (Resultados!B258)
    if (hasVal(jumps_vertical.cmj_1p_height_r) && hasVal(jumps_vertical.cmj_1p_height_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_1p_height_r), Number(jumps_vertical.cmj_1p_height_l));
      metrics.push({ label: 'LSI CMJ 1p Altura', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 1 pierna, se presenta una correcta simetría en la altura del salto.");
      else conclusions.push("En el CMJ a 1 pierna, se presenta una asimetría en la altura del salto.");
    }

    // CMJ 1p Fuerza Frenado LSI (Resultados!B259)
    if (hasVal(jumps_vertical.cmj_1p_brake_r) && hasVal(jumps_vertical.cmj_1p_brake_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_1p_brake_r), Number(jumps_vertical.cmj_1p_brake_l));
      metrics.push({ label: 'LSI CMJ 1p Frenado', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 1 pierna, se presenta una correcta simetría en la fuerza de frenado.");
      else conclusions.push("En el CMJ a 1 pierna, se presenta una asimetría en la fuerza de frenado.");
    }

    // CMJ 1p Fuerza Propulsiva LSI (Resultados!B260)
    if (hasVal(jumps_vertical.cmj_1p_prop_r) && hasVal(jumps_vertical.cmj_1p_prop_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_1p_prop_r), Number(jumps_vertical.cmj_1p_prop_l));
      metrics.push({ label: 'LSI CMJ 1p Propulsión', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 1 pierna, se presenta una correcta simetría en la fuerza propulsiva.");
      else conclusions.push("En el CMJ a 1 pierna, se presenta una asimetría en la fuerza propulsiva.");
    }

    // CMJ 1p Fuerza Aterrizaje LSI (Resultados!B261)
    if (hasVal(jumps_vertical.cmj_1p_land_r) && hasVal(jumps_vertical.cmj_1p_land_l)) {
      const sym = getSymmetry(Number(jumps_vertical.cmj_1p_land_r), Number(jumps_vertical.cmj_1p_land_l));
      metrics.push({ label: 'LSI CMJ 1p Aterrizaje', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el CMJ a 1 pierna, se presenta una correcta simetría en la fuerza de aterrizaje.");
      else conclusions.push("En el CMJ a 1 pierna, se presenta una asimetría en la fuerza de aterrizaje.");
    }

    // DJ 2p Fuerza Pico LSI (Resultados!B262)
    if (hasVal(jumps_vertical.dj_2p_peak_force_r) && hasVal(jumps_vertical.dj_2p_peak_force_l)) {
      const sym = getSymmetry(Number(jumps_vertical.dj_2p_peak_force_r), Number(jumps_vertical.dj_2p_peak_force_l));
      metrics.push({ label: 'LSI DJ 2p Fuerza Pico', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el DJ a 2 piernas, se presenta una correcta simetría en la fuerza pico de contacto.");
      else conclusions.push("En el DJ a 2 piernas, se presenta una asimetría en la fuerza pico de contacto.");
    }

    // DJ 1p Altura LSI (Resultados!B263)
    if (hasVal(jumps_vertical.dj_1p_height_r) && hasVal(jumps_vertical.dj_1p_height_l)) {
      const sym = getSymmetry(Number(jumps_vertical.dj_1p_height_r), Number(jumps_vertical.dj_1p_height_l));
      metrics.push({ label: 'LSI DJ 1p Altura', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el DJ a 1 pierna, se presenta una correcta simetría en la altura del salto.");
      else conclusions.push("En el DJ a 1 pierna, se presenta una asimetría en la altura del salto.");
    }

    // DJ 1p Tiempo de Contacto LSI (Resultados!B264) -> INVERTED (smaller is better)
    if (hasVal(jumps_vertical.dj_1p_contact_r) && hasVal(jumps_vertical.dj_1p_contact_l)) {
      const sym = getSymmetry(Number(jumps_vertical.dj_1p_contact_r), Number(jumps_vertical.dj_1p_contact_l), true);
      metrics.push({ label: 'LSI DJ 1p Contacto', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el DJ a 1 pierna, se presenta una correcta simetría en el tiempo de contacto.");
      else conclusions.push("En el DJ a 1 pierna, se presenta una asimetría en el tiempo de contacto.");
    }
  }

  // 11. SALTOS HORIZONTALES
  if (jumps_horizontal) {
    // Single Hop LSI (Resultados!B276)
    if (hasVal(jumps_horizontal.single_hop_r) && hasVal(jumps_horizontal.single_hop_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.single_hop_r), Number(jumps_horizontal.single_hop_l));
      metrics.push({ label: 'LSI Single Hop', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Single Hop Test, se presenta una correcta simetría en la distancia del salto alcanzada.");
      else conclusions.push("En el Single Hop Test, se presenta una asimetría en la distancia del salto alcanzada.");
    }

    // Triple Hop Distancia LSI (Resultados!B277)
    if (hasVal(jumps_horizontal.triple_hop_dist_r) && hasVal(jumps_horizontal.triple_hop_dist_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.triple_hop_dist_r), Number(jumps_horizontal.triple_hop_dist_l));
      metrics.push({ label: 'LSI Triple Hop Distancia', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Triple Hop Test, se presenta una correcta simetría en la distancia del salto alcanzada.");
      else conclusions.push("En el Triple Hop Test, se presenta una asimetría en la distancia del salto alcanzada.");
    }

    // Triple Hop Tiempo de Contacto LSI (Resultados!B278) -> INVERTED (smaller is better)
    if (hasVal(jumps_horizontal.triple_hop_contact_r) && hasVal(jumps_horizontal.triple_hop_contact_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.triple_hop_contact_r), Number(jumps_horizontal.triple_hop_contact_l), true);
      metrics.push({ label: 'LSI Triple Hop Contacto', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Triple Hop Test, se presenta una correcta simetría en el tiempo de contacto con el suelo.");
      else conclusions.push("En el Triple Hop Test, se presenta una asimetría en el tiempo de contacto con el suelo.");
    }

    // Crossover Hop Distancia LSI (Resultados!B279)
    if (hasVal(jumps_horizontal.crossover_hop_dist_r) && hasVal(jumps_horizontal.crossover_hop_dist_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.crossover_hop_dist_r), Number(jumps_horizontal.crossover_hop_dist_l));
      metrics.push({ label: 'LSI Crossover Hop Distancia', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Crossover Hop Test, se presenta una correcta simetría en la distancia del salto alcanzada.");
      else conclusions.push("En el Crossover Hop Test, se presenta una asimetría en la distancia del salto alcanzada.");
    }

    // Crossover Hop Tiempo de Contacto LSI (Resultados!B280) -> INVERTED (smaller is better)
    if (hasVal(jumps_horizontal.crossover_hop_contact_r) && hasVal(jumps_horizontal.crossover_hop_contact_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.crossover_hop_contact_r), Number(jumps_horizontal.crossover_hop_contact_l), true);
      metrics.push({ label: 'LSI Crossover Hop Contacto', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Crossover Hop Test, se presenta una correcta simetría en el tiempo de contacto con el suelo.");
      else conclusions.push("En el Crossover Hop Test, se presenta una asimetría en el tiempo de contacto con el suelo.");
    }

    // Medial Side Triple Hop Distancia LSI (Resultados!B281)
    if (hasVal(jumps_horizontal.medial_side_triple_hop_r) && hasVal(jumps_horizontal.medial_side_triple_hop_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.medial_side_triple_hop_r), Number(jumps_horizontal.medial_side_triple_hop_l));
      metrics.push({ label: 'LSI Medial Side Triple Hop', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Medial Side Triple Hop Test, se presenta una correcta simetría en la distancia del salto alcanzada.");
      else conclusions.push("En el Medial Side Triple Hop Test, se presenta una asimetría en la distancia del salto alcanzada.");
    }

    // 90 Medial Rotation Hop Distancia LSI (Resultados!B282)
    if (hasVal(jumps_horizontal.medial_rotation_hop_r) && hasVal(jumps_horizontal.medial_rotation_hop_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.medial_rotation_hop_r), Number(jumps_horizontal.medial_rotation_hop_l));
      metrics.push({ label: 'LSI Medial Rotation Hop', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el 90 Medial Rotation Hop Test, se presenta una correcta simetría en la distancia del salto alcanzada.");
      else conclusions.push("En el 90 Medial Rotation Hop Test, se presenta una asimetría en la distancia del salto alcanzada.");
    }

    // Side Hop Cantidad LSI (Resultados!B283)
    if (hasVal(jumps_horizontal.side_hop_r) && hasVal(jumps_horizontal.side_hop_l)) {
      const sym = getSymmetry(Number(jumps_horizontal.side_hop_r), Number(jumps_horizontal.side_hop_l));
      metrics.push({ label: 'LSI Side Hop', value: sym, unit: '%', category: 'Saltos', interpretation: getInterpretation(sym) });
      if (isSymmetric(sym)) conclusions.push("En el Side Hop Test, se presenta una correcta simetría en la cantidad de saltos.");
      else conclusions.push("En el Side Hop Test, se presenta una asimetría en la cantidad de saltos.");
    }
  }

  // 12. CONTROL MOTOR (Sentadilla frontal deficits B299, B300)
  if (motor_control) {
    const getFrontalDeficitText = (trunk: any, pelvis: any, hip: any, knee: any, legLabel: string) => {
      // Si todos son OK, no hay deficit
      if (trunk === 'OK' && pelvis === 'OK' && hip === 'OK' && knee === 'OK') {
        return `En la vista frontal, no se detectan déficits en la ${legLabel}.`;
      }
      
      const deficits: string[] = [];
      if (trunk === 'X') deficits.push('tronco');
      if (pelvis === 'X') deficits.push('pelvis');
      if (hip === 'X') deficits.push('cadera');
      if (knee === 'X') deficits.push('rodilla');
      
      if (deficits.length === 0) return '';
      
      return `En la vista frontal de la ${legLabel} presenta un déficit de ${deficits.join(', ')}.`;
    };

    // Obtenemos qué pierna es la lesionada y cuál la sana dinámicamente
    if (injured === 'derecha') {
      if (hasVal(motor_control.sls_frontal_trunk_r) && hasVal(motor_control.sls_frontal_pelvis_r) &&
          hasVal(motor_control.sls_frontal_hip_r) && hasVal(motor_control.sls_frontal_knee_r)) {
        const txt = getFrontalDeficitText(
          motor_control.sls_frontal_trunk_r,
          motor_control.sls_frontal_pelvis_r,
          motor_control.sls_frontal_hip_r,
          motor_control.sls_frontal_knee_r,
          'pierna lesionada'
        );
        if (txt) conclusions.push(txt);
      }
      if (hasVal(motor_control.sls_frontal_trunk_l) && hasVal(motor_control.sls_frontal_pelvis_l) &&
          hasVal(motor_control.sls_frontal_hip_l) && hasVal(motor_control.sls_frontal_knee_l)) {
        const txt = getFrontalDeficitText(
          motor_control.sls_frontal_trunk_l,
          motor_control.sls_frontal_pelvis_l,
          motor_control.sls_frontal_hip_l,
          motor_control.sls_frontal_knee_l,
          'pierna sana'
        );
        if (txt) conclusions.push(txt);
      }
    } else if (injured === 'izquierda') {
      if (hasVal(motor_control.sls_frontal_trunk_l) && hasVal(motor_control.sls_frontal_pelvis_l) &&
          hasVal(motor_control.sls_frontal_hip_l) && hasVal(motor_control.sls_frontal_knee_l)) {
        const txt = getFrontalDeficitText(
          motor_control.sls_frontal_trunk_l,
          motor_control.sls_frontal_pelvis_l,
          motor_control.sls_frontal_hip_l,
          motor_control.sls_frontal_knee_l,
          'pierna lesionada'
        );
        if (txt) conclusions.push(txt);
      }
      if (hasVal(motor_control.sls_frontal_trunk_r) && hasVal(motor_control.sls_frontal_pelvis_r) &&
          hasVal(motor_control.sls_frontal_hip_r) && hasVal(motor_control.sls_frontal_knee_r)) {
        const txt = getFrontalDeficitText(
          motor_control.sls_frontal_trunk_r,
          motor_control.sls_frontal_pelvis_r,
          motor_control.sls_frontal_hip_r,
          motor_control.sls_frontal_knee_r,
          'pierna sana'
        );
        if (txt) conclusions.push(txt);
      }
    } else {
      // Si no hay pierna lesionada cargada, evaluamos Derecha e Izquierda tal cual
      if (hasVal(motor_control.sls_frontal_trunk_r) && hasVal(motor_control.sls_frontal_pelvis_r) &&
          hasVal(motor_control.sls_frontal_hip_r) && hasVal(motor_control.sls_frontal_knee_r)) {
        const txt = getFrontalDeficitText(
          motor_control.sls_frontal_trunk_r,
          motor_control.sls_frontal_pelvis_r,
          motor_control.sls_frontal_hip_r,
          motor_control.sls_frontal_knee_r,
          'pierna derecha'
        );
        if (txt) conclusions.push(txt);
      }
      if (hasVal(motor_control.sls_frontal_trunk_l) && hasVal(motor_control.sls_frontal_pelvis_l) &&
          hasVal(motor_control.sls_frontal_hip_l) && hasVal(motor_control.sls_frontal_knee_l)) {
        const txt = getFrontalDeficitText(
          motor_control.sls_frontal_trunk_l,
          motor_control.sls_frontal_pelvis_l,
          motor_control.sls_frontal_hip_l,
          motor_control.sls_frontal_knee_l,
          'pierna izquierda'
        );
        if (txt) conclusions.push(txt);
      }
    }
  }

  // 13. OTROS TEST FUNCIONALES, AGILIDAD Y CUESTIONARIOS
  if (functional) {
    // Prueba de Frenado (Resultados!B309)
    if (hasVal(functional.braking_test)) {
      if (functional.braking_test === 'OK') {
        conclusions.push("Se realiza una correcta prueba de frenado.");
      } else if (functional.braking_test === 'X') {
        conclusions.push("Se presenta un déficit en la prueba de frenado.");
      }
    }

    // T-Test Agilidad (Resultados!B310)
    if (hasVal(functional.t_test)) {
      const tt = Number(functional.t_test);
      metrics.push({ label: 'T-Test Agilidad', value: tt, unit: 'seg', category: 'Funcional', interpretation: tt <= 9.5 ? 'normal' : 'critical' });
      if (tt <= 9.5) conclusions.push("Se presenta una correcta prueba de agilidad T Test.");
      else conclusions.push("Se presenta un déficit en la prueba de agilidad T Test.");
    }
    
    // CMAS 45º (Resultados!B311)
    if (hasVal(functional.cmas_45_r) && hasVal(functional.cmas_45_l)) {
      const c45R = Number(functional.cmas_45_r);
      const c45L = Number(functional.cmas_45_l);
      if (c45R <= 3 && c45L <= 3) conclusions.push("Se presenta un correcto cambio de dirección a 45º en ambas piernas.");
      else if (c45R > 3 && c45L <= 3) conclusions.push("Se presenta un déficit en el cambio de dirección a 45º en la pierna derecha.");
      else if (c45R <= 3 && c45L > 3) conclusions.push("Se presenta un déficit en el cambio de dirección a 45º en la pierna izquierda.");
      else conclusions.push("Se presenta un déficit en el cambio de dirección a 45º en ambas piernas.");
    }

    // CMAS 90º (Resultados!B312)
    if (hasVal(functional.cmas_90_r) && hasVal(functional.cmas_90_l)) {
      const c90R = Number(functional.cmas_90_r);
      const c90L = Number(functional.cmas_90_l);
      if (c90R <= 3 && c90L <= 3) conclusions.push("Se presenta un correcto cambio de dirección a 90º en ambas piernas.");
      else if (c90R > 3 && c90L <= 3) conclusions.push("Se presenta un déficit en el cambio de dirección a 90º en la pierna derecha.");
      else if (c90R <= 3 && c90L > 3) conclusions.push("Se presenta un déficit en el cambio de dirección a 90º en la pierna izquierda.");
      else conclusions.push("Se presenta un déficit en el cambio de dirección a 90º en ambas piernas.");
    }

    // Cuestionario HAGOS (Resultados!B319)
    if (hasVal(functional.hagos)) {
      const hg = Number(functional.hagos);
      if (hg >= 81) {
        conclusions.push("La puntuación del cuestionario auto reportado se encuentra normal, lo que demuestra una sensación de seguridad y confianza en la función de los isquiotibiales.");
      } else {
        conclusions.push("La puntuación del cuestionario auto reportado se encuentra disminuida, lo que demuestra una falta de seguridad y confianza en la función de los isquiotibiales.");
      }
    }

    // Cuestionarios IKDC / LCA RSI (Resultados!B320)
    if (hasVal(functional.ikdc) && hasVal(functional.lca_rsi)) {
      const ik = Number(functional.ikdc);
      const lr = Number(functional.lca_rsi);
      if (ik < 85 || lr < 65) {
        conclusions.push("La puntuación en los cuestionarios se encuentran bajos, esto se traduce a todavía falta sensación de seguridad, confianza y función de la rodilla.");
      } else {
        conclusions.push("La puntuación en los cuestionarios auto reportados se encuentran normales, lo que demuestra una sensación de seguridad y confianza en la función de la rodilla.");
      }
    }
  }

  // Fallback si no hay ninguna conclusión
  if (conclusions.length === 0) {
    conclusions.push('Evaluación completada. Todos los valores dentro de parámetros esperados.');
  }

  return { conclusions, metrics };
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
