import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { TransactionType, Product, UserRole } from '../types';
import { ArrowDownRight, ArrowUpRight, RefreshCcw, ScanLine, Calculator, Scale, Image as ImageIcon, ArrowLeft, CheckCircle } from 'lucide-react';

const StockMovement = () => {
  const { products, stockLevels, processTransaction, transactions } = useInventory();
  const { user } = useAuth();
  
  // Steps: 'SELECT_MODE' -> 'PROCESS'
  const [step, setStep] = useState<'SELECT_MODE' | 'PROCESS'>('SELECT_MODE');

  // UI State
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.IN);
  const [currentDocNumber, setCurrentDocNumber] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [inputWeight, setInputWeight] = useState<number>(0); // For weight calculation
  
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Generate Document Number when entering PROCESS step
  useEffect(() => {
    if (step === 'PROCESS') {
        const generateDocNum = () => {
            let typePrefix = 'DOC';
            if(transactionType === TransactionType.IN) typePrefix = 'IN';
            if(transactionType === TransactionType.OUT) typePrefix = 'OUT';
            if(transactionType === TransactionType.ADJ) typePrefix = 'ADJ';

            const now = new Date();
            const yy = now.getFullYear().toString().slice(-2); 
            const mm = (now.getMonth() + 1).toString().padStart(2, '0');
            const dd = now.getDate().toString().padStart(2, '0');
            
            const datePrefix = `ACT${typePrefix}${yy}-${mm}-${dd}-`;
            
            // This is a PREVIEW. The actual ID is generated in service on save, but we show what it *will* likely be.
            // Note: In a multi-user environment, this might be off by 1 if someone else saves first, but for local/simple app it's fine.
            const dailyCount = transactions.filter(t => t.documentNumber.startsWith(datePrefix)).length + 1;
            const runningNum = dailyCount.toString().padStart(3, '0');
            
            return `${datePrefix}${runningNum}`;
        };
        setCurrentDocNumber(generateDocNum());
        setSuccessMsg('');
        setErrorMsg('');
        setSelectedProduct(null);
        setSearchQuery('');
    }
  }, [step, transactionType, transactions]);

  // Focus Scanner
  useEffect(() => {
    if (step === 'PROCESS' && !selectedProduct) {
        barcodeInputRef.current?.focus();
    }
  }, [step, selectedProduct]);

  // --- Logic Helpers ---

  // Update Quantity when Weight Changes
  const handleWeightChange = (weight: number) => {
      setInputWeight(weight);
      if (selectedProduct && selectedProduct.weightPerPiece > 0) {
          const calculatedQty = Math.floor(weight / selectedProduct.weightPerPiece);
          setQuantity(calculatedQty);
      }
  };

  // Update Weight when Quantity Changes (Reverse calc)
  const handleQuantityChange = (qty: number) => {
      setQuantity(qty);
      if (selectedProduct && selectedProduct.weightPerPiece > 0) {
          setInputWeight(qty * selectedProduct.weightPerPiece);
      }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!searchQuery) return;

    const product = products.find(p => p.barcode === searchQuery) 
                 || products.find(p => p.productCode === searchQuery)
                 || products.find(p => p.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (product) {
      setSelectedProduct(product);
      setSearchQuery(''); 
      setQuantity(1);
      setInputWeight(product.weightPerPiece || 0);
    } else {
      setSelectedProduct(null);
      setErrorMsg('ไม่พบสินค้า (Product Not Found)');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProduct || !user) return;

    try {
      await processTransaction(transactionType, selectedProduct.id, quantity, user.id, notes);
      
      setSuccessMsg(`บันทึกสำเร็จ! ${transactionType} ${selectedProduct.productCode} จำนวน ${quantity}`);
      
      // Reset for next scan within same session
      setSelectedProduct(null);
      setQuantity(1);
      setInputWeight(0);
      setNotes('');
      // Doc number will auto-update via useEffect dependency on transactions
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const getCurrentStock = () => {
    if (!selectedProduct) return 0;
    const stock = stockLevels.find(s => s.productId === selectedProduct.id);
    return stock ? stock.quantity : 0;
  };

  const getProductImage = (fileId: string) => {
      if(!fileId) return null;
      if (fileId.startsWith('data:image')) return fileId;
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  };

  const currentStock = getCurrentStock();

  // --- Render Steps ---

  if (step === 'SELECT_MODE') {
      return (
          <div className="max-w-4xl mx-auto py-10">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-10">เลือกประเภทรายการ (Select Action)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                    onClick={() => { setTransactionType(TransactionType.IN); setStep('PROCESS'); }}
                    className="flex flex-col items-center justify-center p-6 md:p-10 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-3xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-all shadow-sm group"
                  >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                          <ArrowDownRight className="w-8 h-8 md:w-10 md:h-10 text-green-600 dark:text-green-300" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-green-800 dark:text-green-300 text-center">รับสินค้าเข้า (IN)</h3>
                      <p className="text-green-600 dark:text-green-400 mt-2 text-sm md:text-base">Goods Receipt</p>
                  </button>

                  <button 
                    onClick={() => { setTransactionType(TransactionType.OUT); setStep('PROCESS'); }}
                    className="flex flex-col items-center justify-center p-6 md:p-10 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm group"
                  >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                          <ArrowUpRight className="w-8 h-8 md:w-10 md:h-10 text-red-600 dark:text-red-300" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-red-800 dark:text-red-300 text-center">เบิกสินค้าออก (OUT)</h3>
                      <p className="text-red-600 dark:text-red-400 mt-2 text-sm md:text-base">Goods Issue</p>
                  </button>
                  
                  {/* Adjustment Button - Available to all employees now */}
                  <button 
                    onClick={() => { setTransactionType(TransactionType.ADJ); setStep('PROCESS'); }}
                    className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-3xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm"
                  >
                      <div className="flex items-center gap-4">
                          <RefreshCcw className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                          <span className="text-lg md:text-xl font-bold text-blue-800 dark:text-blue-300 text-center">แก้ไข / ปรับปรุงยอด (Adjust)</span>
                      </div>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep('SELECT_MODE')} className="flex items-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition">
              <ArrowLeft className="w-5 h-5 mr-1" /> ย้อนกลับ (Back)
          </button>
          
          <div className="text-right">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-end gap-2">
                 {transactionType === TransactionType.IN && <span className="text-green-600">รับเข้า (IN)</span>}
                 {transactionType === TransactionType.OUT && <span className="text-red-600">เบิกออก (OUT)</span>}
                 {transactionType === TransactionType.ADJ && <span className="text-blue-600">ปรับปรุง (ADJ)</span>}
              </h2>
              <p className="font-mono text-gray-500 text-xs md:text-sm">Doc No: {currentDocNumber}</p>
          </div>
      </div>

      <div className="space-y-6">
          {/* Scanner Input */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">สแกนบาร์โค้ด หรือ ค้นหาสินค้า (Scan/Search)</label>
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ScanLine className="h-6 w-6 text-gray-400" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-100 dark:border-slate-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="คลิกแล้วยิงบาร์โค้ด... (หรือกด Enter)"
                autoComplete="off"
              />
            </form>
          </div>

          {/* Product Detail & Action Form */}
          {selectedProduct && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 animate-fade-in">
              <div className="border-b dark:border-slate-700 pb-4 mb-4 flex gap-4">
                 {/* Product Image */}
                 <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-slate-600 overflow-hidden shadow-sm">
                    {selectedProduct.imageFileId ? (
                        <img 
                            src={getProductImage(selectedProduct.imageFileId)!} 
                            alt={selectedProduct.productName} 
                            className="w-full h-full object-contain bg-white"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
                    )}
                 </div>

                 <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedProduct.productName}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mb-2">รหัส: {selectedProduct.productCode}</p> 
                    <div className="flex flex-wrap gap-2">
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded w-fit font-mono">
                            Barcode: {selectedProduct.barcode}
                        </div>
                        {selectedProduct.location && (
                             <div className="text-xs md:text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">
                                Loc: {selectedProduct.location}
                            </div>
                        )}
                    </div>
                 </div>
              </div>

              <form onSubmit={handleTransaction} className="space-y-6">
                
                {/* 1. Show Current Stock */}
                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300 font-medium text-sm md:text-base">ยอดคงเหลือปัจจุบัน (Current Stock):</span>
                    <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{currentStock} {selectedProduct.unit}</span>
                </div>

                {/* 2. Input Section: Weight OR Qty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weight Input */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 relative">
                         <label className="block text-sm font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                             <Scale className="w-4 h-4 mr-2"/> น้ำหนักรวม (Total Weight)
                         </label>
                         <div className="relative">
                            <input 
                                type="number" 
                                min="0"
                                value={inputWeight}
                                onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
                                className="block w-full pl-3 pr-10 py-3 text-lg border-blue-300 dark:border-blue-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 border bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-bold"
                            />
                            <span className="absolute right-3 top-4 text-gray-400 text-sm">g</span>
                         </div>
                         <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Weight/Piece: {selectedProduct.weightPerPiece}g
                         </p>
                    </div>

                    {/* Quantity Input */}
                    <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl border border-gray-200 dark:border-slate-600">
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                             <Calculator className="w-4 h-4 mr-2"/> จำนวน (Quantity)
                         </label>
                         <div className="relative">
                            <input
                                type="number"
                                min="1"
                                required
                                value={quantity}
                                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                                className="block w-full pl-3 pr-10 py-3 text-2xl font-bold border-gray-300 dark:border-slate-500 rounded-lg shadow-sm border bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                             <span className="absolute right-3 top-5 text-gray-400 text-sm">{selectedProduct.unit}</span>
                         </div>
                    </div>
                </div>

                {/* Warning for OUT */}
                {transactionType === TransactionType.OUT && quantity > currentStock && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold text-center">
                        แจ้งเตือน: สินค้าในคลังไม่เพียงพอ! (Not enough stock)
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedProduct(null); setSearchQuery(''); }}
                      className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      ยกเลิก (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={transactionType === TransactionType.OUT && quantity > currentStock}
                      className={`
                        flex-[2] py-3 px-4 rounded-lg shadow-sm text-white font-bold text-lg transition-colors flex items-center justify-center
                        ${transactionType === TransactionType.IN ? 'bg-green-600 hover:bg-green-700' : 
                          transactionType === TransactionType.OUT ? 'bg-red-600 hover:bg-red-700' : 
                          'bg-blue-600 hover:bg-blue-700'}
                        ${(transactionType === TransactionType.OUT && quantity > currentStock) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      ยืนยัน (Confirm)
                    </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Status Messages */}
          {successMsg && (
             <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-center font-bold border border-green-200 dark:border-green-800 animate-bounce-short">
                {successMsg}
             </div>
          )}
          {errorMsg && (
             <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-center font-bold border border-red-200 dark:border-red-800">
                {errorMsg}
             </div>
          )}
      </div>
    </div>
  );
};

export default StockMovement;