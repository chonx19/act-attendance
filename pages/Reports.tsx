import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Download, FileText } from 'lucide-react';
import { TransactionType } from '../types';

const Reports = () => {
  const { transactions, products } = useInventory();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredTransactions = transactions.filter(t => 
    filterType === 'ALL' || t.type === filterType
  );

  const exportToCSV = () => {
    // Removed Location
    const headers = ["Document No", "Date", "Type", "Product Code", "Barcode", "Product Name", "Supplier", "Quantity", "Notes"];
    
    const rows = filteredTransactions.map(t => {
      const p = products.find(prod => prod.id === t.productId);
      return [
        t.documentNumber,
        new Date(t.date).toLocaleDateString(),
        t.type,
        p?.productCode || '',
        `'${p?.barcode || ''}`,
        p?.productName || '',
        p?.supplier || '',
        t.quantity,
        t.notes || ''
      ].map(cell => `"${cell}"`).join(',');
    });

    // BOM for Excel Thai language support
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">รายงานการเคลื่อนไหว</h2>
          <p className="text-gray-500 dark:text-gray-400">ประวัติการรับเข้าและเบิกออกสินค้าทั้งหมด</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
           <select 
            className="border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">รายการทั้งหมด</option>
            <option value={TransactionType.IN}>รับเข้า (IN)</option>
            <option value={TransactionType.OUT}>เบิกออก (OUT)</option>
            <option value={TransactionType.ADJ}>ปรับปรุง (ADJ)</option>
          </select>
          <button 
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            ส่งออก CSV (Excel)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่ / เอกสาร</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สินค้า</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จำนวน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredTransactions.map((tx) => {
                const product = products.find(p => p.id === tx.productId);
                
                return (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{tx.documentNumber}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleString('th-TH')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${tx.type === 'รับเข้า' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                          tx.type === 'เบิกออก' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}
                      `}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{product?.productCode}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{product?.productName}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{product?.barcode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                      {tx.type === 'เบิกออก' ? '-' : '+'}{tx.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {tx.notes || '-'}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบรายการเคลื่อนไหว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;