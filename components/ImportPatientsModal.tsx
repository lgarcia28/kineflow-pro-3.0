import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  ArrowRight, 
  Users, 
  Check, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Patient, PlanType, CheckInStatus, Stage } from '../types';

interface ImportPatientsModalProps {
  existingPatients: Patient[];
  onClose: () => void;
  onImport: (patients: Patient[]) => Promise<void> | void;
}

interface MappedFields {
  firstName: string;
  lastName: string;
  dni: string;
  condition: string;
  sessionsPerWeek: string;
  planType: string;
  paymentDate: string;
  notes: string;
}

export const ImportPatientsModal: React.FC<ImportPatientsModalProps> = ({
  existingPatients,
  onClose,
  onImport
}) => {
  const [step, setStep] = useState<'UPLOAD' | 'MAP' | 'PREVIEW' | 'IMPORTING' | 'SUCCESS'>('UPLOAD');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // Field mappings
  const [fieldMapping, setFieldMapping] = useState<MappedFields>({
    firstName: '',
    lastName: '',
    dni: '',
    condition: '',
    sessionsPerWeek: '',
    planType: '',
    paymentDate: '',
    notes: ''
  });

  const [parsedPatients, setParsedPatients] = useState<(Patient & { isDuplicate?: boolean; selected?: boolean })[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Nombre': 'Carlos',
        'Apellido': 'Fernández',
        'DNI': '32456789',
        'Diagnóstico / Condición': 'Esguince de tobillo grado 2',
        'Sesiones Semanales': 2,
        'Tipo de Plan': 'Mensual',
        'Fecha de Pago': '2026-07-01',
        'Notas / Historial': 'Antecedente de esguince en 2024'
      },
      {
        'Nombre': 'María',
        'Apellido': 'González',
        'DNI': '28901234',
        'Diagnóstico / Condición': 'Tendinitis rotuliana',
        'Sesiones Semanales': 3,
        'Tipo de Plan': 'Paquete',
        'Fecha de Pago': '2026-07-15',
        'Notas / Historial': 'Deportista de alto rendimiento'
      },
      {
        'Nombre': 'Juan',
        'Apellido': 'Pérez',
        'DNI': '19876543',
        'Diagnóstico / Condición': 'Postoperatorio LCA rodilla derecha',
        'Sesiones Semanales': 2,
        'Tipo de Plan': 'Mensual',
        'Fecha de Pago': '2026-07-10',
        'Notas / Historial': 'Cirugía realizada en Junio 2026'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Pacientes');
    XLSX.writeFile(workbook, 'Plantilla_Importacion_Pacientes_Kineflow.xlsx');
  };

  // Process File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON objects
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (json.length === 0) {
          alert('El archivo cargado está vacío o no contiene datos válidos.');
          return;
        }

        // Extract column headers
        const headers = Object.keys(json[0]);
        setRawHeaders(headers);
        setRawRows(json);

        // Auto detect mappings
        const autoMapping: MappedFields = {
          firstName: headers.find(h => /nombre|first|nombres/i.test(h)) || '',
          lastName: headers.find(h => /apellido|last|apellidos/i.test(h)) || '',
          dni: headers.find(h => /dni|documento|cedula|identificaci/i.test(h)) || '',
          condition: headers.find(h => /condici|diagnostico|diagnóstico|patolog|motivo|observaci/i.test(h)) || '',
          sessionsPerWeek: headers.find(h => /frecuencia|sesiones.*semana|semanales/i.test(h)) || '',
          planType: headers.find(h => /plan|tipo.*plan|abono/i.test(h)) || '',
          paymentDate: headers.find(h => /pago|fecha.*pago|ingreso/i.test(h)) || '',
          notes: headers.find(h => /nota|historial|antecedente|comentario/i.test(h)) || ''
        };

        setFieldMapping(autoMapping);
        setStep('MAP');
      } catch (err) {
        console.error('Error leyendo el archivo Excel/CSV:', err);
        alert('Ocurrió un error al leer el archivo. Asegúrate de que sea un Excel (.xlsx, .xls) o CSV válido.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Helper to parse Excel dates (serial numbers or string dates)
  const parseAnyExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    const num = Number(str);
    if (!isNaN(num) && num > 1000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return str;
  };

  // Helper to extract values from row matching key regexes or trimmed names
  const extractRowValue = (row: Record<string, any>, pattern: RegExp): string => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim();
      if (pattern.test(cleanKey) || pattern.test(key)) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
    return '';
  };

  // Generate Patients from Mapped Rows
  const handleProceedToPreview = () => {
    if (!fieldMapping.firstName && !fieldMapping.lastName) {
      alert('Debes mapear al menos la columna Nombre o Apellido.');
      return;
    }

    const generated: (Patient & { isDuplicate?: boolean; selected?: boolean })[] = rawRows.map((row, index) => {
      let firstName = String(row[fieldMapping.firstName] || '').trim();
      let lastName = String(row[fieldMapping.lastName] || '').trim();

      // If full name is in firstName and lastName is empty, split intelligently
      if (firstName && !lastName) {
        const parts = firstName.split(' ').filter(Boolean);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        }
      }

      if (!firstName) firstName = `Paciente ${index + 1}`;

      const dni = String(row[fieldMapping.dni] || extractRowValue(row, /^dni/i)).trim();
      
      const condition = String(
        row[fieldMapping.condition] || 
        extractRowValue(row, /motivo.*rehabilitac|diagnostico|condici/i)
      ).trim() || 'Ingreso Ficha RTP';
      
      const rawSessions = Number(row[fieldMapping.sessionsPerWeek]);
      const sessionsPerWeek = !isNaN(rawSessions) && rawSessions > 0 ? rawSessions : 2;

      const rawPlan = String(row[fieldMapping.planType] || '').toLowerCase();
      let planType = PlanType.TIME;
      if (rawPlan.includes('paq') || rawPlan.includes('sesion') || rawPlan.includes('sesión') || rawPlan.includes('pack')) {
        planType = PlanType.SESSIONS;
      }

      const rawNotes = String(row[fieldMapping.notes] || '').trim();
      const history = rawNotes ? [rawNotes] : ['Paciente importado desde Ficha de Ingreso RTP'];

      const todayStr = new Date().toISOString().split('T')[0];
      const rawTimestamp = extractRowValue(row, /marca.*temporal|fecha.*lesi|fecha.*ingreso/i);
      const parsedDate = parseAnyExcelDate(rawTimestamp);

      const paymentDate = row[fieldMapping.paymentDate] 
        ? parseAnyExcelDate(row[fieldMapping.paymentDate])
        : (parsedDate || todayStr);

      const injuryDate = parsedDate || paymentDate || todayStr;

      // Extract specific intake fields from Ficha de Ingreso RTP
      const birthDateRaw = extractRowValue(row, /fecha.*nacimiento/i);
      const birthDate = parseAnyExcelDate(birthDateRaw);

      const ageRaw = Number(extractRowValue(row, /^edad/i));
      const age = !isNaN(ageRaw) && ageRaw > 0 ? ageRaw : undefined;

      const gender = extractRowValue(row, /^sexo/i);
      const address = extractRowValue(row, /^direcci/i);
      const phone = extractRowValue(row, /teléfono.*contacto|telefono.*contacto|celular/i);
      const email = extractRowValue(row, /correo.*electrónico|correo|email/i);
      const instagram = extractRowValue(row, /instagram/i);
      
      const healthInsurance = extractRowValue(row, /^obra.*social|^prepaga|^mutual|^nombre$/i);
      const affiliateNumber = extractRowValue(row, /número.*socio|numero.*socio|afiliado/i);
      
      const emergencyContactName = extractRowValue(row, /contacto.*emergencia/i);
      const emergencyContactPhone = extractRowValue(row, /teléfono.*contacto.*2|tel.*emergencia/i);
      
      const diseaseCardiovascular = extractRowValue(row, /cardiovascular/i);
      const diseaseDiabetes = extractRowValue(row, /diabetes/i);
      const diseaseHypertension = extractRowValue(row, /hipertensi/i);
      const diseaseOther = extractRowValue(row, /otra$/i);
      
      const surgeriesHistory = extractRowValue(row, /quirúrgic|cirug/i);
      const allergies = extractRowValue(row, /alergia/i);
      const currentMedication = extractRowValue(row, /medicaci/i);
      const hasFitnessCertificate = extractRowValue(row, /certificado.*aptitud|aptitud.*física/i);
      const referralSource = extractRowValue(row, /conoci.*clínica|referencia/i);

      // Check duplicates against existing patients
      const isDuplicate = existingPatients.some(ep => {
        if (dni && ep.dni && ep.dni.trim() === dni) return true;
        const existingName = `${ep.firstName} ${ep.lastName}`.toLowerCase().trim();
        const importedName = `${firstName} ${lastName}`.toLowerCase().trim();
        return existingName === importedName;
      });

      const uniqueId = `pat_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`;

      return {
        id: uniqueId,
        firstName,
        lastName,
        dni,
        condition,
        injuryDate: injuryDate || todayStr,
        sessionsPerWeek,
        planType,
        totalSessionsPaid: planType === PlanType.SESSIONS ? 10 : 0,
        remainingSessions: planType === PlanType.SESSIONS ? 10 : 0,
        paymentDate,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        hasHomePlan: false,
        checkInStatus: CheckInStatus.IDLE,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=0D9488&color=fff`,
        lastVisit: todayStr,
        history,

        // Ficha de Ingreso RTP Fields
        birthDate,
        age,
        gender,
        address,
        phone,
        email,
        instagram,
        healthInsurance,
        affiliateNumber,
        emergencyContactName,
        emergencyContactPhone,
        diseaseCardiovascular,
        diseaseDiabetes,
        diseaseHypertension,
        diseaseOther,
        surgeriesHistory,
        allergies,
        currentMedication,
        hasFitnessCertificate,
        referralSource,

        routine: {
          id: `rot_${Date.now()}_${index}`,
          stage: Stage.KINESIOLOGY,
          days: [
            { id: `day_1_${Date.now()}_${index}`, name: 'Día 1', exercises: [] },
            { id: `day_2_${Date.now()}_${index}`, name: 'Día 2', exercises: [] }
          ],
          currentWeek: 1
        },
        isDuplicate,
        selected: !isDuplicate // Default: select non-duplicates
      };
    });

    setParsedPatients(generated);
    setStep('PREVIEW');
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedPatients(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const togglePatientSelected = (id: string) => {
    setParsedPatients(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  // Perform Final Import
  const handleConfirmImport = async () => {
    const toImport = parsedPatients.filter(p => p.selected);
    if (toImport.length === 0) {
      alert('Selecciona al menos un paciente para importar.');
      return;
    }

    setIsImporting(true);
    setStep('IMPORTING');

    try {
      // Clean temporary properties
      const cleanedPatients: Patient[] = toImport.map(({ isDuplicate, selected, ...p }) => p);
      await onImport(cleanedPatients);
      setImportCount(cleanedPatients.length);
      setIsImporting(false);
      setStep('SUCCESS');
    } catch (error) {
      console.error('Error durante la importación:', error);
      setIsImporting(false);
      alert('Ocurrió un error al importar algunos pacientes.');
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">Importar Base de Pacientes</h2>
              <p className="text-xs font-bold text-slate-400">Soporta archivos Excel (.xlsx, .xls) y CSV</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-container">
          
          {/* STEP 1: UPLOAD */}
          {step === 'UPLOAD' && (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary-200 hover:border-primary-500 bg-primary-50/40 hover:bg-primary-50 p-10 rounded-[2rem] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 bg-white text-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/10 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 mb-1">
                    Haz clic aquí o arrastra tu archivo Excel / CSV
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    Formatos soportados: .xlsx, .xls, .csv
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
              </div>

              {/* Template Download Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">¿No sabes cómo estructurar el archivo?</h4>
                    <p className="text-xs text-slate-500 font-medium">Descarga nuestra plantilla modelo con las columnas requeridas.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
                >
                  <Download size={16} /> Descargar Plantilla Modelo
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MAP FIELDS */}
          {step === 'MAP' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-primary-50 p-4 rounded-2xl border border-primary-100">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-primary-600" size={20} />
                  <span className="font-bold text-sm text-slate-800">{fileName}</span>
                </div>
                <span className="text-xs font-black bg-primary-200/60 text-primary-800 px-3 py-1 rounded-lg">
                  {rawRows.length} filas detectadas
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-base mb-1">Mapeo de Columnas</h3>
                <p className="text-xs font-medium text-slate-500 mb-4">
                  Asocia las columnas de tu archivo Excel a los campos de Kineflow:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre <span className="text-red-500">*</span></label>
                    <select
                      value={fieldMapping.firstName}
                      onChange={e => setFieldMapping({ ...fieldMapping, firstName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Seleccionar Columna --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                    <select
                      value={fieldMapping.lastName}
                      onChange={e => setFieldMapping({ ...fieldMapping, lastName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Seleccionar Columna --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">DNI / Documento</label>
                    <select
                      value={fieldMapping.dni}
                      onChange={e => setFieldMapping({ ...fieldMapping, dni: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Seleccionar Columna --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Diagnóstico / Condición</label>
                    <select
                      value={fieldMapping.condition}
                      onChange={e => setFieldMapping({ ...fieldMapping, condition: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Seleccionar Columna --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Frecuencia Semanal</label>
                    <select
                      value={fieldMapping.sessionsPerWeek}
                      onChange={e => setFieldMapping({ ...fieldMapping, sessionsPerWeek: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Seleccionar Columna (Por defecto: 2) --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Plan</label>
                    <select
                      value={fieldMapping.planType}
                      onChange={e => setFieldMapping({ ...fieldMapping, planType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Seleccionar Columna (Por defecto: Mensual) --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas / Historial</label>
                    <select
                      value={fieldMapping.notes}
                      onChange={e => setFieldMapping({ ...fieldMapping, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                    >
                      <option value="">-- Opcional --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('UPLOAD')}
                  className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 transition-all text-sm flex items-center gap-2"
                >
                  Ver Vista Previa <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & SELECTION */}
          {step === 'PREVIEW' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Vista Previa de Pacientes</h3>
                  <p className="text-xs font-bold text-slate-500">
                    Se encontraron {parsedPatients.length} pacientes. Selecciona los que deseas importar.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-xs text-slate-700 transition-colors"
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-xs text-slate-700 transition-colors"
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              {/* Duplicates Warning */}
              {parsedPatients.some(p => p.isDuplicate) && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-800">
                  <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-xs font-medium">
                    <p className="font-bold">Atención con duplicados:</p>
                    <p>Algunos pacientes ya existen en tu sistema (coincidencia de DNI o Nombre). Por defecto están desmarcados para no duplicarlos.</p>
                  </div>
                </div>
              )}

              {/* Patients List Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 pl-4">Importar</th>
                      <th className="p-3">Paciente</th>
                      <th className="p-3">DNI</th>
                      <th className="p-3">Diagnóstico</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                    {parsedPatients.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.selected ? 'bg-white' : 'bg-slate-50/50 opacity-60'}`}>
                        <td className="p-3 pl-4">
                          <input 
                            type="checkbox"
                            checked={p.selected}
                            onChange={() => togglePatientSelected(p.id)}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="p-3 text-slate-500">
                          {p.dni || '-'}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {p.condition}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px]">
                            {p.planType === PlanType.SESSIONS ? 'Paquete' : 'Mensual'}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.isDuplicate ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                              Existente
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                              Nuevo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('MAP')}
                  className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  Atrás
                </button>
                
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedPatients.filter(p => p.selected).length === 0}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Confirmar e Importar ({parsedPatients.filter(p => p.selected).length})
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORTING */}
          {step === 'IMPORTING' && (
            <div className="p-12 text-center space-y-4">
              <RefreshCw size={48} className="animate-spin text-primary-600 mx-auto" />
              <h3 className="text-xl font-black text-slate-900">Importando Pacientes...</h3>
              <p className="text-sm font-medium text-slate-500">Guardando datos en la plataforma y base de datos.</p>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="p-8 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¡Importación Exitosa!</h3>
                <p className="text-sm font-bold text-slate-500">
                  Se importaron correctamente <span className="text-emerald-600 font-black text-base">{importCount}</span> pacientes a tu sistema.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-base transition-all shadow-xl"
              >
                Finalizar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
