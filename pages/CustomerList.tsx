
import React, { useState, useRef, useMemo } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Customer, ContactPerson, CustomerProduct } from '../types';
import { Plus, Edit2, Trash2, X, Users, Phone, Printer, Mail, Tag, History, Search, Download, Upload, FileSpreadsheet, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const CustomerList = () => {
  const { customers, customerProducts, saveCustomer, deleteCustomer, importCustomerProducts } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({ 
    companyName: '', code: '', address: '', taxId: '', fax: '', contacts: [] 
  });
  
  // Temp Contact State for adding inside modal
  const [tempContact, setTempContact] = useState<Partial<ContactPerson>>({ name: '', phone: '', email: '' });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({ companyName: '', code: '', address: '', taxId: '', fax: '', contacts: [] });
    }
    setTempContact({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const handleAddContact = () => {
    if (tempContact.name) {
      const newContacts = [...(formData.contacts || []), {
        id: Date.now().toString(),
        name: tempContact.name,
        phone: tempContact.phone || '',
        email: tempContact.email || ''
      }];
      setFormData({ ...formData, contacts: newContacts });
      setTempContact({ name: '', phone: '', email: '' });
    }
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = [...(formData.contacts || [])];
    newContacts.splice(index, 1);
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now().toString(),
      companyName: formData.companyName!,
      code: formData.code?.toUpperCase() || '',
      address: formData.address || '',
      taxId: formData.taxId || '',
      fax: formData.fax || '',
      contacts: formData.contacts || []
    };
    await saveCustomer(customerToSave);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบลูกค้ารายนี้ใช่หรือไม่?')) {
      await deleteCustomer(id);
    }
  };

  // --- History / Products Logic ---

  const handleOpenHistory = (customer: Customer) => {
      setSelectedCustomerForHistory(customer);
      setHistorySearch('');
      setIsHistoryOpen(true);
  };

  const filteredHistory = useMemo(() => {
      if (!selectedCustomerForHistory) return [];
      return customerProducts
        .filter(cp => cp.customerName === selectedCustomerForHistory.companyName)
        .filter(cp => {
            const search = historySearch.toLowerCase();
            return (
                cp.productName.toLowerCase().includes(search) || 
                (cp.poNumber || '').toLowerCase().includes(search)
            );
        });
  }, [customerProducts, selectedCustomerForHistory, historySearch]);

  const handleExportHistory = () => {
      if (!selectedCustomerForHistory) return;
      
      const data = filteredHistory.map(item => ({
          'Date': new Date(item.lastQuotedDate).toLocaleDateString(),
          'PO Number': item.poNumber || '-',
          'Customer': item.customerName,
          'Product Name': item.productName,
          'Quantity': item.quantity || 1,
          'Unit': item.unit,
          'Price': item.price,
          'Amount': (item.quantity || 1) * item.price
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "History");
      XLSX.writeFile(wb, `History_${selectedCustomerForHistory.code || 'Cust'}.xlsx`);
  };

  const handleImportHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedCustomerForHistory) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const data = XLSX.utils.sheet_to_json(ws);
              
              const newItems: CustomerProduct[] = [];
              for (const row of data as any[]) {
                  const name = row['Product Name'] || row['Item'] || row['Description'];
                  if (!name) continue;
                  
                  // Try to parse Date
                  let dateStr = new Date().toISOString();
                  if (row['Date']) {
                     // Basic check, might need robust parsing for Excel dates
                     try { dateStr = new Date(row['Date']).toISOString(); } catch(e){}
                  }

                  newItems.push({
                      id: Date.now().toString() + Math.random(),
                      customerName: selectedCustomerForHistory.companyName,
                      productName: String(name),
                      price: Number(row['Price'] || row['Unit Price'] || 0),
                      unit: String(row['Unit'] || 'PCS'),
                      lastQuotedDate: dateStr,
                      poNumber: row['PO Number'] || 'IMPORTED',
                      quantity: Number(row['Quantity'] || row['Qty'] || 1)
                  });
              }

              await importCustomerProducts(newItems);
              alert('Import Successful');
          } catch (err) {
              alert('Error parsing Excel file');
          }
      };
      reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ลูกค้า & ผู้ติดต่อ</h2>
          <p className="text-gray-500 dark:text-gray-400">จัดการรายชื่อบริษัทและผู้ติดต่อสำหรับใบเสนอราคา</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-start">
                  <div className="p-3 bg-blue-50 dark:bg-slate-700 rounded-lg mr-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex items-center">
                        {customer.companyName}
                        {customer.code && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full font-mono">
                                {customer.code}
                            </span>
                        )}
                    </h3>
                    {customer.taxId && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tax ID: {customer.taxId}</p>}
                    {customer.fax && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <Printer className="w-3 h-3 mr-1" /> Fax: {customer.fax}
                        </div>
                    )}
                  </div>
               </div>
               <div className="flex space-x-1">
                  <button onClick={() => handleOpenHistory(customer)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition" title="ประวัติการเสนอราคา / สั่งซื้อ">
                     <History className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleOpenModal(customer)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>
            
            <div className="mb-4">
               <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                 {customer.address || 'ไม่มีที่อยู่'}
               </p>
            </div>

            <div>
               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ผู้ติดต่อ (ATTN)</h4>
               {customer.contacts.length > 0 ? (
                 <div className="space-y-2">
                   {customer.contacts.map((contact, idx) => (
                     <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                        <div>
                           <span className="font-semibold text-gray-800 dark:text-gray-200">{contact.name}</span>
                           <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:gap-3">
                              {contact.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {contact.phone}</span>}
                              {contact.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1"/> {contact.email}</span>}
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-gray-400 italic">ไม่มีรายชื่อผู้ติดต่อ</p>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {/* ... (Existing Form Content) ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 flex gap-4">
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อบริษัท (Company Name)</label>
                        <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                     </div>
                     <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ตัวย่อ (Code)</label>
                        <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. SCG" className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white font-mono uppercase" />
                     </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                    <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เบอร์แฟกซ์ (Fax)</label>
                    <input type="text" value={formData.fax} onChange={e => setFormData({...formData, fax: e.target.value})} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ที่อยู่ (Address)</label>
                    <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 bg-white dark:bg-slate-900 dark:text-white" />
                 </div>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                 <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2"/> เพิ่มผู้ติดต่อ (ATTN List)
                 </h4>
                 
                 <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder="ชื่อผู้ติดต่อ (Name)" 
                        className="flex-1 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 text-sm bg-white dark:bg-slate-900 dark:text-white"
                        value={tempContact.name}
                        onChange={e => setTempContact({...tempContact, name: e.target.value})}
                    />
                     <input 
                        type="text" 
                        placeholder="เบอร์โทร (Tel)" 
                        className="w-full sm:w-32 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 text-sm bg-white dark:bg-slate-900 dark:text-white"
                        value={tempContact.phone}
                        onChange={e => setTempContact({...tempContact, phone: e.target.value})}
                    />
                     <input 
                        type="text" 
                        placeholder="Email (Optional)" 
                        className="w-full sm:w-40 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-2 text-sm bg-white dark:bg-slate-900 dark:text-white"
                        value={tempContact.email}
                        onChange={e => setTempContact({...tempContact, email: e.target.value})}
                    />
                    <button type="button" onClick={handleAddContact} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold whitespace-nowrap">
                        เพิ่ม
                    </button>
                 </div>

                 <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-100 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ชื่อ</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">เบอร์โทร</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ลบ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {formData.contacts?.map((contact, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">{contact.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{contact.phone}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{contact.email}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button type="button" onClick={() => handleRemoveContact(idx)} className="text-red-500 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!formData.contacts || formData.contacts.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-400">ไม่มีรายชื่อผู้ติดต่อ</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-bold">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryOpen && selectedCustomerForHistory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                   <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                       <div>
                           <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                               <History className="w-5 h-5 mr-2 text-purple-600"/> 
                               {selectedCustomerForHistory.companyName}
                           </h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">ประวัติการเสนอราคา / สั่งซื้อ (Quotation History)</p>
                       </div>
                       <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                           <X className="w-6 h-6"/>
                       </button>
                   </div>

                   <div className="p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                             <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                             <input 
                                type="text" 
                                placeholder="ค้นหา: เลข PO, ชื่อสินค้า..." 
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                             />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input 
                                type="file" 
                                accept=".xlsx" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleImportHistory}
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                                <Upload className="w-4 h-4 mr-2"/> Import
                            </button>
                            <button onClick={handleExportHistory} className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                                <Download className="w-4 h-4 mr-2"/> Export
                            </button>
                        </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-0">
                       <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                           <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0 z-10">
                               <tr>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">วันที่ (Date)</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">เลขที่ (PO No.)</th>
                                   <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase w-1/3">สินค้า (Product)</th>
                                   <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">จำนวน (Qty)</th>
                                   <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">หน่วย (Unit)</th>
                                   <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">ราคา/หน่วย</th>
                                   <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">รวม (Total)</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                               {filteredHistory.map((item, idx) => (
                                   <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                       <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center">
                                           <Calendar className="w-3 h-3 mr-1 opacity-70"/> {new Date(item.lastQuotedDate).toLocaleDateString()}
                                       </td>
                                       <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                           {item.poNumber || '-'}
                                       </td>
                                       <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                           {item.productName}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-bold">
                                           {item.quantity?.toLocaleString() || 1}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                                           {item.unit}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                                           {item.price.toLocaleString()}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-right text-blue-600 dark:text-blue-400 font-bold">
                                           {((item.quantity || 1) * item.price).toLocaleString()}
                                       </td>
                                   </tr>
                               ))}
                               {filteredHistory.length === 0 && (
                                   <tr>
                                       <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="w-8 h-8 text-gray-300 mb-2"/>
                                                <p>ไม่พบประวัติสินค้าที่ค้นหา</p>
                                            </div>
                                       </td>
                                   </tr>
                               )}
                           </tbody>
                       </table>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomerList;
