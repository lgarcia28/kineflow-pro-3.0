import React, { useState } from 'react';
import { ExerciseDefinition, MetricType } from '../types';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  BODY_REGIONS, 
  SUB_REGIONS_BY_REGION, 
  MOVEMENT_TYPES, 
  inferExerciseCategories, 
  formatCategoryString, 
  getRegionColorBadge 
} from '../utils/exerciseCategories';
import { convertFileToWebp } from '../utils/videoToWebp';
import { X, Search, Plus, Trash2, Edit2, Save, Dumbbell, Timer, Image as ImageIcon, Upload, Loader2, Link, Maximize2, Activity, Filter, RotateCcw } from 'lucide-react';

interface ExerciseLibraryProps {
  exercises: ExerciseDefinition[];
  onAddExercise: (ex: ExerciseDefinition) => void;
  onUpdateExercise: (ex: ExerciseDefinition) => void;
  onDeleteExercise: (id: string) => void;
  onClose: () => void;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  exercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedSubRegion, setSelectedSubRegion] = useState<string>('');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<{url: string, name: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    bodyRegion: string;
    subRegion: string;
    movementType: string;
    videoUrl: string;
    metricType: MetricType;
    difficulty: number;
  }>({
    name: '',
    bodyRegion: '',
    subRegion: '',
    movementType: '',
    videoUrl: '',
    metricType: 'kg',
    difficulty: 1
  });

  const availableSubRegions = formData.bodyRegion 
    ? SUB_REGIONS_BY_REGION[formData.bodyRegion] || [] 
    : [];

  const availableFilterSubRegions = selectedRegion 
    ? SUB_REGIONS_BY_REGION[selectedRegion] || [] 
    : [];

  // Filter exercises by Region, SubRegion, MovementType, and SearchTerm
  const filtered = exercises.filter(ex => {
    const inferred = inferExerciseCategories(ex);
    
    if (selectedRegion && inferred.region !== selectedRegion) {
      return false;
    }
    if (selectedSubRegion && inferred.subRegion !== selectedSubRegion) {
      return false;
    }
    if (selectedMovementType && inferred.movementType !== selectedMovementType) {
      return false;
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchName = ex.name.toLowerCase().includes(query);
      const matchCategory = (ex.category || '').toLowerCase().includes(query);
      const matchRegion = inferred.region.toLowerCase().includes(query);
      const matchSub = inferred.subRegion.toLowerCase().includes(query);
      const matchMovement = inferred.movementType.toLowerCase().includes(query);
      return matchName || matchCategory || matchRegion || matchSub || matchMovement;
    }

    return true;
  });

  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedSubRegion('');
    setSelectedMovementType('');
    setSearchTerm('');
  };

  const startCreating = () => {
    setFormData({
      name: '',
      bodyRegion: '',
      subRegion: '',
      movementType: '',
      videoUrl: '',
      metricType: 'kg',
      difficulty: 1
    });
    setIsCreating(true);
    setEditingId(null);
  };

  const startEditing = (ex: ExerciseDefinition) => {
    const inferred = inferExerciseCategories(ex);
    setFormData({
      name: ex.name,
      bodyRegion: ex.bodyRegion || inferred.region,
      subRegion: ex.subRegion || inferred.subRegion,
      movementType: ex.movementType || inferred.movementType,
      videoUrl: ex.videoUrl || '',
      metricType: ex.metricType || 'kg',
      difficulty: ex.difficulty || 1
    });
    setEditingId(ex.id);
    setIsCreating(false);
  };

  const handleRegionChange = (newRegion: string) => {
    setFormData(prev => ({
      ...prev,
      bodyRegion: newRegion,
      subRegion: ''
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.name.endsWith('.mov')) {
        alert("Por favor selecciona una imagen, GIF o video.");
        return;
    }

    if (!storage) {
        alert("El almacenamiento no está configurado correctamente. Verifica tu conexión.");
        return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Conversión automática o fallback seguro de 2s
      const convertedBlob = await convertFileToWebp(file);
      const isWebp = convertedBlob.type === 'image/webp';
      const fileExt = isWebp ? 'webp' : (file.name.split('.').pop() || 'mp4');
      const mimeType = isWebp ? 'image/webp' : (file.type || 'video/mp4');

      const fileName = `exercises/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, convertedBlob, { contentType: mimeType });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.max(10, Math.round(progress)));
        },
        (error) => {
          console.error("Error uploading file:", error);
          alert("Error al subir el archivo. Verifica tu conexión a internet.");
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, videoUrl: downloadURL }));
          setIsUploading(false);
        }
      );
    } catch (err) {
      console.error("Exception during upload:", err);
      alert("Error al procesar la subida del archivo.");
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Ingresa el nombre del ejercicio.");
      return;
    }

    if (!formData.bodyRegion || !formData.subRegion || !formData.movementType) {
      alert("Por favor selecciona la Parte del Cuerpo, Subcategoría y Tipo de Trabajo.");
      return;
    }

    const fullCategory = formatCategoryString(formData.bodyRegion, formData.subRegion, formData.movementType);

    if (isCreating) {
      const newEx: ExerciseDefinition = {
        id: `custom-ex-${Date.now()}`,
        name: formData.name.trim(),
        category: fullCategory,
        bodyRegion: formData.bodyRegion,
        subRegion: formData.subRegion,
        movementType: formData.movementType,
        videoUrl: formData.videoUrl || '',
        metricType: formData.metricType,
        difficulty: formData.difficulty || 1
      };
      onAddExercise(newEx);
      setIsCreating(false);
    } else if (editingId) {
      onUpdateExercise({
        id: editingId,
        name: formData.name.trim(),
        category: fullCategory,
        bodyRegion: formData.bodyRegion,
        subRegion: formData.subRegion,
        movementType: formData.movementType,
        videoUrl: formData.videoUrl || '',
        metricType: formData.metricType,
        difficulty: formData.difficulty || 1
      });
      setEditingId(null);
    }
  };

  const hasActiveFilters = Boolean(selectedRegion || selectedSubRegion || selectedMovementType || searchTerm);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full max-w-5xl h-[92vh] md:h-[88vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 md:animate-none">
        
        {/* Header */}
        <div className="px-6 md:px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Biblioteca de Ejercicios</h2>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">Gestión y Filtros por Zona & Categoría</p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Panel Principal: Lista & Filtros Jerárquicos */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
            
            {/* Buscador y Botón de Nuevo Ejercicio */}
            <div className="p-4 border-b border-slate-100 bg-white shrink-0 space-y-3">
               <div className="flex gap-2">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:bg-white focus:border-primary-200 transition-all text-slate-800" 
                      placeholder="Buscar por nombre, zona o movimiento..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <button onClick={startCreating} className="px-5 py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 shrink-0 active:scale-95">
                    <Plus size={16} /> <span>Nuevo Ejercicio</span>
                 </button>
               </div>

               {/* NIVEL 1: Zona Corporal Principal */}
               <div>
                 <div className="flex items-center justify-between mb-1.5 px-1">
                   <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                     <Filter size={12} /> Zona Corporal
                   </span>
                   {hasActiveFilters && (
                     <button onClick={clearFilters} className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                       <RotateCcw size={10} /> Limpiar Filtros
                     </button>
                   )}
                 </div>
                 <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                   <button
                     onClick={() => { setSelectedRegion(''); setSelectedSubRegion(''); }}
                     className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${!selectedRegion ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   >
                     Todas ({exercises.length})
                   </button>
                   {BODY_REGIONS.map(reg => {
                     const count = exercises.filter(e => inferExerciseCategories(e).region === reg).length;
                     const isSelected = selectedRegion === reg;
                     return (
                       <button
                         key={reg}
                         onClick={() => {
                           if (isSelected) {
                             setSelectedRegion('');
                             setSelectedSubRegion('');
                           } else {
                             setSelectedRegion(reg);
                             setSelectedSubRegion('');
                           }
                         }}
                         className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${isSelected ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                       >
                         {reg}
                         <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>{count}</span>
                       </button>
                     );
                   })}
                 </div>
               </div>

               {/* NIVEL 2: Subzona / Articulación (Si hay región elegida) */}
               {selectedRegion && availableFilterSubRegions.length > 0 && (
                 <div className="pt-1 border-t border-slate-100">
                   <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block px-1">
                     Subzona / Articulación
                   </span>
                   <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                     <button
                       onClick={() => setSelectedSubRegion('')}
                       className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${!selectedSubRegion ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                     >
                       Todas en {selectedRegion}
                     </button>
                     {availableFilterSubRegions.map(sub => {
                       const isSubSelected = selectedSubRegion === sub;
                       return (
                         <button
                           key={sub}
                           onClick={() => setSelectedSubRegion(isSubSelected ? '' : sub)}
                           className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${isSubSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                         >
                           {sub}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}

               {/* NIVEL 3: Modalidad / Tipo de Trabajo */}
               <div className="pt-1 border-t border-slate-100">
                 <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block px-1">
                   Tipo de Trabajo / Modalidad
                 </span>
                 <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                   <button
                     onClick={() => setSelectedMovementType('')}
                     className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${!selectedMovementType ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}
                   >
                     Todos los tipos
                   </button>
                   {MOVEMENT_TYPES.map(mov => {
                     const isMovSelected = selectedMovementType === mov;
                     return (
                       <button
                         key={mov}
                         onClick={() => setSelectedMovementType(isMovSelected ? '' : mov)}
                         className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${isMovSelected ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}
                       >
                         {mov}
                       </button>
                     );
                   })}
                 </div>
               </div>

            </div>
            
            {/* Lista de Ejercicios Filtrados */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-container">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Dumbbell size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-extrabold text-sm text-slate-600">No se encontraron ejercicios con los filtros seleccionados.</p>
                  <button onClick={clearFilters} className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 transition-colors">
                    Limpiar Filtros
                  </button>
                </div>
              ) : (
                filtered.map(ex => {
                  const inferred = inferExerciseCategories(ex);
                  const badgeStyle = getRegionColorBadge(inferred.region);
                  const isEditingThis = editingId === ex.id;

                  return (
                    <div 
                      key={ex.id} 
                      className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 bg-white ${isEditingThis ? 'border-primary-500 ring-2 ring-primary-50' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                    >
                       {ex.videoUrl ? (
                         <button 
                           onClick={() => setZoomedImage({ url: ex.videoUrl || '', name: ex.name })}
                           className="w-14 h-14 rounded-xl object-cover bg-slate-100 overflow-hidden relative group cursor-zoom-in shrink-0"
                         >
                            <img src={ex.videoUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <Maximize2 size={14} className="text-white" />
                            </div>
                         </button>
                       ) : (
                         <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            {ex.metricType === 'time' ? <Timer size={22}/> : ex.metricType === 'tension' ? <Activity size={22}/> : <Dumbbell size={22}/>}
                         </div>
                       )}

                       <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">{ex.name}</h4>
                          
                          {/* Badges de Categoría */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                              {inferred.region}
                            </span>
                            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {inferred.subRegion}
                            </span>
                            <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                              {inferred.movementType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5">
                            {ex.metricType === 'time' && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-bold uppercase">Tiempo</span>}
                            {ex.metricType === 'tension' && <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.2 rounded font-bold uppercase">Banda Elástica</span>}
                            {ex.metricType === 'kg' && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase">Peso (Kg)</span>}
                            <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded font-bold uppercase">Dif: {ex.difficulty || 1}</span>
                          </div>
                       </div>

                       <div className="flex items-center gap-1 shrink-0">
                         <button onClick={() => startEditing(ex)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" title="Editar Ejercicio"><Edit2 size={16}/></button>
                         <button onClick={() => { if(window.confirm('¿Borrar este ejercicio permanentemente?')) onDeleteExercise(ex.id) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar Ejercicio"><Trash2 size={16}/></button>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ventana Emergente (Modal Overlay) para Crear / Editar Ejercicio */}
      {(isCreating || editingId) && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] border border-slate-100 relative overflow-hidden">
              
              {/* Header Fijo (Sticky Top) */}
              <div className="px-6 md:px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-10">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{isCreating ? 'Crear Nuevo Ejercicio' : 'Editar Ejercicio'}</h3>
                 <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              {/* Cuerpo del Formulario Scrolleable */}
              <div className="p-6 md:p-8 space-y-4 flex-1 overflow-y-auto scroll-container">
                 {/* Nombre */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Nombre del Ejercicio</label>
                   <input autoFocus className="w-full p-3.5 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all border border-slate-200/60" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Sentadilla con carga..." />
                 </div>

                 {/* NIVEL 1: Zona Corporal */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">1. Parte del Cuerpo / Zona Principal</label>
                   <select 
                     className={`w-full p-3.5 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary-500 border border-slate-200/60 transition-colors ${!formData.bodyRegion ? 'text-slate-400 font-medium' : 'text-slate-800 font-bold'}`}
                     value={formData.bodyRegion}
                     onChange={e => handleRegionChange(e.target.value)}
                   >
                     <option value="" disabled hidden style={{ display: 'none' }}>Seleccionar Parte del Cuerpo...</option>
                     {BODY_REGIONS.map(reg => (
                       <option key={reg} value={reg} className="text-slate-800 font-bold">{reg}</option>
                     ))}
                   </select>
                 </div>

                 {/* NIVEL 2: Subzona / Articulación */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">2. Subcategoría / Articulación</label>
                   <select 
                     className={`w-full p-3.5 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary-500 border border-slate-200/60 transition-colors ${!formData.subRegion ? 'text-slate-400 font-medium' : 'text-slate-800 font-bold'}`}
                     value={formData.subRegion}
                     onChange={e => setFormData({ ...formData, subRegion: e.target.value })}
                     disabled={!formData.bodyRegion}
                   >
                     <option value="" disabled hidden style={{ display: 'none' }}>{formData.bodyRegion ? 'Seleccionar Subcategoría...' : 'Primero selecciona una parte del cuerpo'}</option>
                     {availableSubRegions.map(sub => (
                       <option key={sub} value={sub} className="text-slate-800 font-bold">{sub}</option>
                     ))}
                   </select>
                 </div>

                 {/* NIVEL 3: Tipo de Trabajo */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">3. Tipo de Trabajo / Modalidad</label>
                   <select 
                     className={`w-full p-3.5 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary-500 border border-slate-200/60 transition-colors ${!formData.movementType ? 'text-slate-400 font-medium' : 'text-slate-800 font-bold'}`}
                     value={formData.movementType}
                     onChange={e => setFormData({ ...formData, movementType: e.target.value })}
                   >
                     <option value="" disabled hidden style={{ display: 'none' }}>Seleccionar Tipo de Trabajo...</option>
                     {MOVEMENT_TYPES.map(mov => (
                       <option key={mov} value={mov} className="text-slate-800 font-bold">{mov}</option>
                     ))}
                   </select>
                 </div>

                 {/* Tipo de Medición */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Tipo de Medición</label>
                   <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200/60">
                      <button onClick={() => setFormData({...formData, metricType: 'kg'})} className={`py-2.5 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 ${formData.metricType === 'kg' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                         <Dumbbell size={14}/> Peso
                      </button>
                      <button onClick={() => setFormData({...formData, metricType: 'time'})} className={`py-2.5 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 ${formData.metricType === 'time' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                         <Timer size={14}/> Tiempo
                      </button>
                      <button onClick={() => setFormData({...formData, metricType: 'tension'})} className={`py-2.5 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 ${formData.metricType === 'tension' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                         <Activity size={14}/> Banda
                      </button>
                   </div>
                 </div>

                 {/* Dificultad */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Dificultad (1-5)</label>
                   <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200/60">
                     {[1, 2, 3, 4, 5].map((num) => (
                       <button
                         key={num}
                         type="button"
                         onClick={() => setFormData({...formData, difficulty: num})}
                         className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${formData.difficulty === num ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                       >
                         {num}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Archivo o Video URL */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Visual / Video</label>
                   
                   <div className="flex gap-2 mb-2">
                       <label className="flex-1 cursor-pointer bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all text-center flex items-center justify-center gap-2 shadow-md">
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {isUploading ? 'Subiendo...' : 'Subir desde dispositivo'}
                          <input type="file" className="hidden" accept="image/*,video/*,.mov,.MOV,.mp4,.webm" onChange={handleFileUpload} disabled={isUploading} />
                       </label>
                   </div>

                   {isUploading && (
                       <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                           <div className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                       </div>
                   )}

                   <div className="relative">
                       <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary-500 border border-slate-200/60 text-slate-700" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="Pega un link (https://...)" />
                   </div>

                   {formData.videoUrl && (
                       <div className="mt-2 rounded-2xl overflow-hidden border border-slate-100 h-28 flex items-center justify-center bg-slate-50 relative group">
                           <button 
                             type="button"
                             onClick={() => setZoomedImage({ url: formData.videoUrl || '', name: formData.name || 'Vista Previa' })}
                             className="h-full w-full flex items-center justify-center cursor-zoom-in relative"
                           >
                               <img src={formData.videoUrl} className="h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                               <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Maximize2 size={18} className="text-white" />
                               </div>
                           </button>
                           <button 
                             type="button"
                             onClick={() => setFormData({...formData, videoUrl: ''})} 
                             className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                           >
                               <Trash2 size={14} />
                           </button>
                       </div>
                   )}
                 </div>
              </div>

              {/* Footer Fijo (Sticky Bottom) */}
              <div className="px-6 md:px-8 py-4 bg-white border-t border-slate-100 flex gap-3 shrink-0 z-10">
                 <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="flex-1 py-3.5 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                 <button onClick={handleSave} disabled={isUploading} className="flex-[2] py-3.5 bg-primary-600 text-white rounded-xl text-xs font-black uppercase shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={16} /> Guardar Ejercicio
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md hover:bg-white rounded-full text-slate-900 transition-all shadow-lg active:scale-95"
            >
              <X size={24} />
            </button>
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              <img src={zoomedImage.url} alt={zoomedImage.name} className="max-w-full max-h-full object-contain block" />
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{zoomedImage.name}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Biblioteca Global de Kineflow Pro</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
