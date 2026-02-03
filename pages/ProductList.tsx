import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, UserRole } from '../types';
import { Plus, Search, Edit2, X, Image as ImageIcon, ExternalLink, Weight, Building, Upload, MapPin, Download, FileSpreadsheet, Filter, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const ProductList = () => {
  const { products, stockLevels, saveProduct, deleteProduct } = useInventory();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterSupplier, setFilterSupplier] = useState('ALL');

  const isAdmin = user?.role === UserRole.ADMIN;

  // Extract unique locations and suppliers for filter dropdowns
  const locations = useMemo(() => Array.from(new Set(products.map(p => p.location || '').filter(l => l !== ''))).sort(), [products]);
  const suppliers = useMemo(() => Array.from(new Set(products.map(p => p.supplier).filter(s => s !== ''))).sort(), [products]);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    productCode: '', productName: '', unit: 'PCS', location: '',
    cost: 0, price: 0, barcode: '', minStockLevel: 0,
    weightPerPiece: 0, supplier: '', imageFileId: ''
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm);

      const matchesLocation = filterLocation === 'ALL' || p.location === filterLocation;
      const matchesSupplier = filterSupplier === 'ALL' || p.supplier === filterSupplier;

      return matchesSearch && matchesLocation && matchesSupplier;
    }).sort((a, b) => a.productName.localeCompare(b.productName, undefined, { numeric: true, sensitivity: 'base' }));
  }, [products, searchTerm, filterLocation, filterSupplier]);

  // Instant Search Suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return products.filter(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
  }, [searchTerm, products]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        productCode: '', productName: '', location: '',
        unit: 'PCS', cost: 0, price: 0, barcode: '', minStockLevel: 0,
        weightPerPiece: 0, supplier: '', imageFileId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, imageFileId: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      productCode: formData.productCode!,
      productName: formData.productName!,
      location: formData.location || '',
      unit: formData.unit || 'PCS',
      cost: 0,
      price: Number(formData.price),
      barcode: formData.barcode!,
      minStockLevel: 0,
      weightPerPiece: Number(formData.weightPerPiece) || 0,
      supplier: formData.supplier || '',
      imageFileId: formData.imageFileId || ''
    };
    await saveProduct(productToSave);
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      'Code': p.productCode,
      'Name': p.productName,
      'Barcode': p.barcode,
      'Location': p.location,
      'Unit': p.unit,
      'Weight (g)': p.weightPerPiece,
      'Supplier': p.supplier,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        for (const row of data as any[]) {
          const productCode = row['Code'] || row['Product Code'] || '';
          if (!productCode) continue;
          const existing = products.find(p => p.productCode === String(productCode).trim());
          const newProduct: Product = {
            id: existing ? existing.id : Date.now().toString() + Math.random().toString().slice(2),
            productCode: String(productCode),
            productName: row['Name'] || row['Product Name'] || '-',
            barcode: String(row['Barcode'] || ''),
            location: String(row['Location'] || ''),
            unit: String(row['Unit'] || 'PCS'),
            price: Number(row['Price'] || 0),
            cost: 0, minStockLevel: 0,
            weightPerPiece: Number(row['Weight (g)'] || 0),
            supplier: String(row['Supplier'] || ''),
            imageFileId: existing?.imageFileId || ''
          };
          await saveProduct(newProduct);
        }
        alert('Import successful');
      } catch (err) { alert('Error parsing Excel: ' + err); }
    };
    reader.readAsArrayBuffer(file);
  };

  const getTotalStock = (productId: string) => {
    return stockLevels.filter(s => s.productId === productId).reduce((sum, s) => sum + s.quantity, 0);
  };

  const getImageUrl = (fileId: string) => {
    if (!fileId) return null;
    if (fileId.startsWith('data:image')) return fileId;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('menu_products')}</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm">
                <Upload className="w-5 h-5 mr-2" /> Import
              </button>
              <button onClick={handleExport} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                <FileSpreadsheet className="w-5 h-5 mr-2" /> Export
              </button>
            </>
          )}
          <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus className="w-5 h-5 mr-2" /> {t('prod_new')}
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="relative z-20">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm placeholder-gray-400"
            placeholder={t('prod_search_ph')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Instant Guide/Suggestions Dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="absolute w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl mt-1 overflow-hidden z-30">
              {searchSuggestions.map(p => (
                <div
                  key={p.id}
                  className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                  onClick={() => setSearchTerm(p.productCode)}
                >
                  <div>
                    <span className="font-bold text-gray-800 dark:text-white">{p.productCode}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{p.productName}</span>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                    {p.location}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} dark:bg-slate-800 dark:border-slate-600 dark:text-gray-200`}
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('filter')}
          </button>

          {showFilters && (
            <div className="flex gap-2 animate-fade-in">
              <select
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
                className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200"
              >
                <option value="ALL">{t('prod_all_locations')}</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>

              <select
                value={filterSupplier}
                onChange={e => setFilterSupplier(e.target.value)}
                className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200"
              >
                <option value="ALL">{t('prod_all_suppliers')}</option>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สินค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">รายละเอียด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ที่เก็บ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">น้ำหนัก</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">คงเหลือ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredProducts.map((product) => {
                const totalStock = getTotalStock(product.id);
                const imgUrl = getImageUrl(product.imageFileId || '');

                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      {/* Larger Image Display */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                        {imgUrl ? (
                          <img src={imgUrl} alt={product.productName} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">{product.productName}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Code: {product.productCode}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">Barcode: {product.barcode}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center"><Building className="w-3 h-3 mr-1" /> {product.supplier || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <MapPin className="w-3 h-3 mr-1" />
                        {product.location || 'ไม่ระบุ'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-300">
                      {product.weightPerPiece > 0 ? `${product.weightPerPiece} g` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {totalStock} <span className="text-xs font-normal text-gray-500">{product.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg transition-colors mr-2">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this product? Transactions related to this product might be affected.')) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบข้อมูลสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal logic remains largely same, just imported for completeness if user edits */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* ... Modal Content Same as Previous ... */}
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อสินค้า (Name)</label>
                  <input required type="text" value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                {/* ... Other inputs ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสสินค้า (ACT Code)</label>
                  <input required type="text" value={formData.productCode} onChange={e => setFormData({ ...formData, productCode: e.target.value })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">บาร์โค้ด (Barcode)</label>
                  <input required type="text" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สถานที่จัดเก็บ (Location)</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">บริษัท (Supplier)</label>
                  <input type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ราคาขาย (Price)</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">น้ำหนัก (g)</label>
                  <input type="number" step="0.01" value={formData.weightPerPiece} onChange={e => setFormData({ ...formData, weightPerPiece: parseFloat(e.target.value) })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หน่วย (Unit)</label>
                  <input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รูปภาพ (Image)</label>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <input type="text" value={formData.imageFileId} onChange={e => setFormData({ ...formData, imageFileId: e.target.value })} placeholder="Or Paste ID" className="flex-1 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white text-xs" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;