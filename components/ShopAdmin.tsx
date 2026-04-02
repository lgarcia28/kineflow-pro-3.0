import React, { useState } from 'react';
import { Product } from '../types';
import { 
  ShoppingBag, 
  Plus, 
  X, 
  Trash2, 
  Image as ImageIcon,
  DollarSign,
  Tag
} from 'lucide-react';

interface ShopAdminProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onClose: () => void;
}

export const ShopAdmin: React.FC<ShopAdminProps> = ({ products, onAddProduct, onClose }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price) {
      onAddProduct({
        id: Math.random().toString(36).substr(2, 9),
        name: newProduct.name,
        price: Number(newProduct.price),
        imageUrl: newProduct.imageUrl || 'https://picsum.photos/seed/product/400/400',
        description: newProduct.description,
        type: newProduct.type || 'PRODUCT'
      });
      setShowAddModal(false);
      setNewProduct({});
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Gestión de Tienda</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Catálogo de Productos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-100"
            >
              <Plus size={16} /> Nuevo Producto
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                    <span className="text-sm font-black text-slate-900">${product.price}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${product.type === 'SERVICE' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {product.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{product.description || 'Sin descripción'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {product.id}</span>
                    <button className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Nuevo Producto</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewProduct({...newProduct, type: 'PRODUCT'})}
                      className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${newProduct.type !== 'SERVICE' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      Producto
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProduct({...newProduct, type: 'SERVICE'})}
                      className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${newProduct.type === 'SERVICE' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      Servicio
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del {newProduct.type === 'SERVICE' ? 'Servicio' : 'Producto'}</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={newProduct.name || ''}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Ej: Banda Elástica"
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Precio</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="number"
                      value={newProduct.price || ''}
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">URL de Imagen</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="url"
                      value={newProduct.imageUrl || ''}
                      onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción</label>
                  <textarea
                    value={newProduct.description || ''}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4"
                >
                  Crear {newProduct.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
