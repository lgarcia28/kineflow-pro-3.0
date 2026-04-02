
import React, { useState } from 'react';
import { ExerciseDefinition, MetricType } from '../types';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { X, Search, Plus, Trash2, Edit2, Save, Dumbbell, Timer, Image as ImageIcon, Upload, Loader2, Link } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estado del formulario (para crear o editar)
  const [formData, setFormData] = useState<Partial<ExerciseDefinition>>({
    name: '', category: '', videoUrl: '', metricType: 'kg'
  });

  const filtered = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startCreating = () => {
    setFormData({ name: '', category: '', videoUrl: '', metricType: 'kg' });
    setIsCreating(true);
    setEditingId(null);
  };

  const startEditing = (ex: ExerciseDefinition) => {
    setFormData({ ...ex });
    setEditingId(ex.id);
    setIsCreating(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validación básica
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert("Por favor selecciona una imagen, GIF o video.");
        return;
    }

    if (!storage) {
        alert("El almacenamiento no está configurado correctamente. Verifica tu conexión.");
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
        // Crear referencia única: exercises/TIMESTAMP_FILENAME
        const storageRef = ref(storage, `exercises/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            }, 
            (error) => {
                console.error("Error subiendo archivo:", error);
                alert("Hubo un error al subir el archivo.");
                setIsUploading(false);
            }, 
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setFormData(prev => ({ ...prev, videoUrl: downloadURL }));
                setIsUploading(false);
            }
        );
    } catch (error) {
        console.error("Error inesperado:", error);
        setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.category) return;

    if (isCreating) {
      const newEx: ExerciseDefinition = {
        id: `custom-ex-${Date.now()}`,
        name: formData.name,
        category: formData.category,
        videoUrl: formData.videoUrl || '',
        metricType: formData.metricType as MetricType
      };
      onAddExercise(newEx);
      setIsCreating(false);
    } else if (editingId) {
      onUpdateExercise({ ...formData, id: editingId } as ExerciseDefinition);
      setEditingId(null);
    }
    // Reset
    setFormData({ name: '', category: '', videoUrl: '', metricType: 'kg' });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Biblioteca de Ejercicios</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión Global</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Panel Izquierdo: Lista */}
          <div className="flex-1 flex flex-col border-r border-slate-100 min-w-0 bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 bg-white">
               <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:bg-white focus:border-primary-200 transition-all" 
                    placeholder="Buscar ejercicios..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <button onClick={startCreating} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                  <Plus size={16} /> Nuevo Ejercicio
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-container">
              {filtered.map(ex => (
                <div key={ex.id} className={`p-3 rounded-2xl border transition-all flex items-center gap-3 bg-white ${editingId === ex.id ? 'border-primary-500 ring-2 ring-primary-50' : 'border-slate-100 hover:border-slate-300'}`}>
                   {ex.videoUrl ? (
                     <img src={ex.videoUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                   ) : (
                     <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                        {ex.metricType === 'time' ? <Timer size={20}/> : <Dumbbell size={20}/>}
                     </div>
                   )}
                   <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xs text-slate-800 truncate uppercase">{ex.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{ex.category}</span>
                        {ex.metricType === 'time' && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 rounded uppercase font-bold">Tiempo</span>}
                      </div>
                   </div>
                   <button onClick={() => startEditing(ex)} className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                   <button onClick={() => { if(window.confirm('¿Borrar este ejercicio permanentemente?')) onDeleteExercise(ex.id) }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Derecho: Formulario */}
          {(isCreating || editingId) ? (
            <div className="w-1/3 min-w-[320px] bg-white p-8 flex flex-col border-l border-slate-100 overflow-y-auto">
               <h3 className="text-lg font-black text-slate-900 mb-6 uppercase">{isCreating ? 'Crear Ejercicio' : 'Editar Ejercicio'}</h3>
               
               <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nombre</label>
                    <input autoFocus className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Sentadilla..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Categoría</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ej: Pierna, Core..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tipo de Medición</label>
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                       <button onClick={() => setFormData({...formData, metricType: 'kg'})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${formData.metricType === 'kg' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Dumbbell size={16}/> Peso (Kg)
                       </button>
                       <button onClick={() => setFormData({...formData, metricType: 'time'})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${formData.metricType === 'time' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Timer size={16}/> Tiempo (s)
                       </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Visual del Ejercicio</label>
                    
                    {/* Botones de selección de fuente */}
                    <div className="flex gap-2 mb-2">
                        <label className="flex-1 cursor-pointer bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                           {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                           {isUploading ? 'Subiendo...' : 'Subir desde dispositivo'}
                           <input type="file" className="hidden" accept="image/gif,image/jpeg,image/png,video/mp4" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>

                    {isUploading && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                        </div>
                    )}

                    <div className="relative">
                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-500" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="O pega un link (https://...)" />
                    </div>

                    {formData.videoUrl && (
                        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-100 h-32 flex items-center justify-center bg-slate-50 relative group">
                            <img src={formData.videoUrl} className="h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            <button onClick={() => setFormData({...formData, videoUrl: ''})} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                  <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button onClick={handleSave} disabled={isUploading} className="flex-[2] py-4 bg-primary-600 text-white rounded-xl text-xs font-black uppercase shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                     <Save size={18} /> Guardar
                  </button>
               </div>
            </div>
          ) : (
            <div className="w-1/3 min-w-[320px] bg-slate-50/30 flex flex-col items-center justify-center text-center p-8 border-l border-slate-100">
                <Dumbbell className="text-slate-200 mb-4" size={64} />
                <p className="text-slate-400 font-bold text-sm max-w-[200px]">Selecciona un ejercicio para editar o crea uno nuevo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
