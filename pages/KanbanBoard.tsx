
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { PurchaseOrder, POStatus, UserRole, POItem, Customer, ContactPerson } from '../types';
import {
    Plus, X, Calendar, User, Clock, CheckCircle, ArrowRight, ArrowLeft,
    Trash2, Maximize, Minimize, FileText, Ban, Globe, CheckSquare,
    Square, FileQuestion, Send, Printer, Moon, Sun, Search,
    ChevronDown, RefreshCw, Phone, ChevronUp, Save, Edit2, Tag, RotateCcw,
    FileSpreadsheet, Download, Mail, History
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate, Navigate } from 'react-router-dom';

const KanbanBoard = () => {
    const { purchaseOrders, customers, products, customerProducts, savePO, updatePOStatus, deletePO } = useInventory();
    const { user } = useAuth();
    const { t, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Redirect Customers to Contact page if they access Kanban directly
    if (user?.role === UserRole.CUSTOMER) {
        return <Navigate to="/app/contact" replace />;
    }

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const boardRef = useRef<HTMLDivElement>(null);

    const isEmployee = user?.role === UserRole.ADMIN || user?.role === UserRole.USER;
    const isCustomer = false; // Forced false due to redirect above

    const [filterText, setFilterText] = useState('');

    const [formData, setFormData] = useState<Partial<PurchaseOrder> & { deliveryTerm?: string, validityTerm?: string, paymentTerm?: string }>({
        poNumber: '', title: '', customerName: '', contactPerson: '', status: 'RFQ',
        dueDate: '', startDate: '', description: '', items: [], discount: 0, vat: 0, totalAmount: 0,
        deliveryTerm: '30 days after received your p/o',
        validityTerm: '30 days',
        paymentTerm: 'Credit 30 days'
    });

    // Extra UI State for display only
    const [companyFax, setCompanyFax] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [duration, setDuration] = useState<number>(0);

    // Item Local State
    const [tempItems, setTempItems] = useState<POItem[]>([]);
    const [itemEntry, setItemEntry] = useState({ name: '', qty: 1, unit: 'PCS', price: 0 });
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    // Customer Autocomplete
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<ContactPerson[]>([]);
    const [showCustomerList, setShowCustomerList] = useState(false);

    // Product Autocomplete (Mixed: Main Products + Customer History)
    const productSuggestions = useMemo(() => {
        if (!itemEntry.name || itemEntry.name.length < 2) return [];
        const search = itemEntry.name.toLowerCase();

        // 1. Suggestions from Customer History (if customer selected)
        // We need to distinct by product name to avoid duplicates in suggestion dropdown
        let historyMatches: any[] = [];
        if (formData.customerName) {
            const matches = customerProducts.filter(cp =>
                cp.customerName === formData.customerName &&
                cp.productName.toLowerCase().includes(search)
            );

            // Group by product name and take the most recent one
            const uniqueMatches = new Map();
            matches.forEach(m => {
                if (!uniqueMatches.has(m.productName)) {
                    uniqueMatches.set(m.productName, m);
                } else {
                    // If we want the most recent, check dates (assuming customerProducts is sorted by date desc)
                    // The storage service already sorts them. So first found is latest.
                }
            });

            historyMatches = Array.from(uniqueMatches.values()).map(cp => ({
                id: cp.id,
                productName: cp.productName,
                price: cp.price,
                unit: cp.unit,
                source: 'History'
            }));
        }

        // 2. Suggestions from Main Product List - REMOVED per user request (Stock decoupled from PO Items)
        // const productMatches = products...

        // Combine (History only)
        return [...historyMatches].slice(0, 10);
    }, [itemEntry.name, products, customerProducts, formData.customerName]);

    const [showProductList, setShowProductList] = useState(false);

    // Deep Search: Title, PO Number, Customer, OR Items inside PO
    const filteredOrders = useMemo(() => {
        const txt = filterText.toLowerCase();
        if (!txt) return purchaseOrders;
        return purchaseOrders.filter(p =>
            p.title.toLowerCase().includes(txt) ||
            p.poNumber.toLowerCase().includes(txt) ||
            p.customerName.toLowerCase().includes(txt) ||
            p.items.some(i => i.name.toLowerCase().includes(txt)) // Search inside items
        ).sort((a, b) => b.poNumber.localeCompare(a.poNumber, undefined, { numeric: true, sensitivity: 'base' })); // Sort by PO Number Descending
    }, [purchaseOrders, filterText]);

    // Calculate Duration when Dates Change
    useEffect(() => {
        if (formData.startDate && formData.dueDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.dueDate);
            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDuration(diffDays > 0 ? diffDays : 0);
        } else if (formData.startDate && !formData.dueDate) {
            setDuration(0);
        }
    }, [formData.startDate, formData.dueDate]);

    const columns: { id: POStatus; title: string; color: string; bg: string; darkBg: string; icon: any }[] = [
        { id: 'RFQ', title: t('kb_status_rfq'), color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/30', icon: FileQuestion },
        { id: 'QUOTATION', title: t('kb_status_quotation'), color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/30', icon: Send },
        { id: 'WAITING_PO', title: t('kb_status_waiting'), color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/30', icon: Clock },
        { id: 'IN_PROGRESS', title: t('kb_status_progress'), color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/30', icon: Calendar },
        { id: 'DONE', title: t('kb_status_done'), color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50', darkBg: 'dark:bg-green-900/30', icon: CheckCircle },
        { id: 'CANCELLED', title: t('kb_status_cancelled'), color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/30', icon: Ban },
    ];

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            boardRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const generateQuoteNumber = (customerCode: string) => {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2); // e.g. 25
        const mm = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g. 12
        const runningPrefix = `ACT${yy}-${mm}-`;
        const matchingPOs = purchaseOrders.filter(p => p.poNumber.startsWith(runningPrefix));
        let maxRun = 0;
        matchingPOs.forEach(p => {
            const idPart = p.poNumber.split(' ')[0];
            const parts = idPart.split('-');
            if (parts.length >= 3) {
                const run = parseInt(parts[2]);
                if (!isNaN(run) && run > maxRun) maxRun = run;
            }
        });
        return `${runningPrefix}${(maxRun + 1).toString().padStart(3, '0')} ${customerCode}`;
    };

    const handleOpenModal = (po?: PurchaseOrder) => {
        if (po) {
            setFormData({
                ...po,
                deliveryTerm: '30 days after received your p/o',
                validityTerm: '30 days',
                paymentTerm: 'Credit 30 days'
            });
            setTempItems(po.items || []);
            const existingCust = customers.find(c => c.companyName === po.customerName);
            if (existingCust) {
                setFilteredContacts(existingCust.contacts);
                setCompanyFax(existingCust.fax || '');
                const contact = existingCust.contacts.find(c => c.name === po.contactPerson);
                setContactPhone(contact?.phone || '');
            }
        } else {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                poNumber: '', title: '', customerName: '', contactPerson: '', status: 'RFQ',
                dueDate: '', startDate: today, description: '', items: [], discount: 0, vat: 0, totalAmount: 0,
                deliveryTerm: '30 days after received your p/o',
                validityTerm: '30 days',
                paymentTerm: 'Credit 30 days'
            });
            setTempItems([]);
            setFilteredContacts([]);
            setCompanyFax('');
            setContactPhone('');
        }
        setItemEntry({ name: '', qty: 1, unit: 'PCS', price: 0 });
        setEditingItemIndex(null);
        setIsModalOpen(true);
    };

    // Date Logic
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const days = parseInt(e.target.value) || 0;
        setDuration(days);
        const startStr = formData.startDate || new Date().toISOString().split('T')[0];
        const start = new Date(startStr);
        if (!formData.startDate) setFormData(prev => ({ ...prev, startDate: startStr }));
        const due = new Date(start);
        due.setDate(start.getDate() + days);
        setFormData(prev => ({ ...prev, dueDate: due.toISOString().split('T')[0] }));
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value || new Date().toISOString().split('T')[0];
        setFormData(prev => {
            const updated = { ...prev, startDate: newStart };
            if (duration > 0) {
                const start = new Date(newStart);
                const due = new Date(start);
                due.setDate(start.getDate() + duration);
                updated.dueDate = due.toISOString().split('T')[0];
            }
            return updated;
        });
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, dueDate: e.target.value }));
    };

    // Customer Logic
    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData({ ...formData, customerName: val });
        const matches = customers.filter(c => c.companyName.toLowerCase().includes(val.toLowerCase()));
        setFilteredCustomers(matches);
        setShowCustomerList(true);
        const exactMatch = customers.find(c => c.companyName === val);
        if (exactMatch) selectCustomer(exactMatch);
        else { setFilteredContacts([]); setCompanyFax(''); setContactPhone(''); }
    };

    const selectCustomer = (customer: Customer) => {
        setFormData(prev => ({
            ...prev,
            customerName: customer.companyName,
            poNumber: (!prev.id && customer.code) ? generateQuoteNumber(customer.code) : prev.poNumber
        }));
        setFilteredContacts(customer.contacts);
        setCompanyFax(customer.fax || '');
        setShowCustomerList(false);
        if (customer.contacts.length > 0 && !formData.contactPerson) {
            setFormData(prev => ({ ...prev, contactPerson: customer.contacts[0].name }));
            setContactPhone(customer.contacts[0].phone || '');
        }
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setFormData({ ...formData, contactPerson: val });
        const contact = filteredContacts.find(c => c.name === val);
        setContactPhone(contact?.phone || '');
    };

    // Item Logic
    const handleAddItem = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (itemEntry.name.trim()) {
            const amount = itemEntry.qty * itemEntry.price;
            setTempItems([...tempItems, {
                id: Date.now().toString() + Math.random(),
                name: itemEntry.name, quantity: itemEntry.qty, unit: itemEntry.unit, unitPrice: itemEntry.price, amount: amount, isActive: true
            }]);
            setItemEntry({ name: '', qty: 1, unit: 'PCS', price: 0 });
            setShowProductList(false);
        }
    };

    const selectProductSuggestion = (p: any) => {
        setItemEntry({ name: p.productName, qty: 1, unit: p.unit, price: p.price });
        setShowProductList(false);
    };

    const handleItemEntryChange = (field: string, value: any) => {
        setItemEntry(prev => ({ ...prev, [field]: value }));
        if (field === 'name') setShowProductList(true);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === tempItems.length - 1)) return;
        const newItems = [...tempItems];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setTempItems(newItems);
    };

    const toggleItemActive = (idx: number) => {
        const newItems = [...tempItems];
        newItems[idx].isActive = !newItems[idx].isActive;
        setTempItems(newItems);
    };

    const removeTempItem = (idx: number) => {
        const newItems = [...tempItems];
        newItems.splice(idx, 1);
        setTempItems(newItems);
    };

    const updateItem = (idx: number, field: keyof POItem, value: any) => {
        const newItems = [...tempItems];
        const item = { ...newItems[idx], [field]: value };
        item.amount = item.quantity * item.unitPrice;
        newItems[idx] = item;
        setTempItems(newItems);
    };

    const calculateTotals = () => {
        const totalPrice = tempItems.filter(i => i.isActive).reduce((sum, item) => sum + item.amount, 0);
        const discount = Number(formData.discount) || 0;
        const subtotal = Math.max(0, totalPrice - discount);
        const vat = subtotal * 0.07;
        const grandTotal = subtotal + vat;
        return { totalPrice, subtotal, vat, grandTotal };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { vat, grandTotal } = calculateTotals();
        let finalStatus = formData.status as POStatus;
        const newPO: PurchaseOrder = {
            id: formData.id || Date.now().toString(),
            poNumber: formData.poNumber || 'DRAFT',
            title: formData.title || '-',
            customerName: formData.customerName!,
            contactPerson: formData.contactPerson,
            status: finalStatus,
            dueDate: formData.dueDate || '',
            startDate: formData.startDate || new Date().toISOString().split('T')[0],
            description: formData.description,
            items: tempItems,
            discount: Number(formData.discount) || 0,
            vat: vat,
            totalAmount: grandTotal,
            deletedAt: finalStatus === 'CANCELLED' ? (formData.deletedAt || new Date().toISOString()) : undefined
        };
        await savePO(newPO);
        setIsModalOpen(false);
    };

    const handleDelete = async (item: PurchaseOrder, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (item.status === 'CANCELLED') {
            if (window.confirm('คำเตือน: ยืนยันลบรายการนี้ถาวร? (Permanent Delete)')) { await deletePO(item.id); }
        } else {
            if (window.confirm('ย้ายรายการนี้ไปถังขยะ? (Move to Trash)')) { await updatePOStatus(item.id, 'CANCELLED'); }
        }
    };

    const handleRestore = async (item: PurchaseOrder, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (window.confirm('กู้คืนรายการนี้? (Restore)')) { await updatePOStatus(item.id, 'RFQ'); }
    };

    const handleModalDelete = async () => {
        if (!formData.id) return;
        if (formData.status === 'CANCELLED') {
            if (window.confirm('ยืนยันลบรายการนี้ถาวร? (Permanent Delete)')) { await deletePO(formData.id); setIsModalOpen(false); }
        } else {
            if (window.confirm('ย้ายรายการนี้ไปถังขยะ? (Move to Trash)')) { await updatePOStatus(formData.id, 'CANCELLED'); setIsModalOpen(false); }
        }
    };

    const { processTransaction } = useInventory(); // Get access to transaction logic

    const handleReceiveGoods = async () => {
        if (!formData.id || !formData.items) return;

        const confirmReceive = window.confirm("รับสินค้าทั้งหมดเข้าคลังและปิด PO นี้? (Receive all items?)");
        if (!confirmReceive) return;

        // 1. Process Stock In for each item
        for (const item of formData.items) {
            if (!item.isActive) continue;

            // Match Product by Name/Code if possible, otherwise just Log text
            // Ideally we should have product_id in POItem, but for now we search by name
            const product = products.find(p => p.productName === item.name || p.productCode === item.name);
            const productId = product ? product.id : 'UNK-' + Date.now(); // Fallback if not mathed custom product

            // If product doesn't exist in system, we might skip stock update or force create? 
            // For this version: Use a special "Non-Stock" ID or just skip if not found? 
            // Design said: "Stock Transaction need productID".
            // Let's assume we linked them. If not found, create a temp transaction note?

            if (product) {
                await processTransaction('รับเข้า', product.id, item.quantity - (item.quantityReceived || 0), user?.id || 'sys', `PO Recv: ${formData.poNumber}`);
            }
        }

        // 2. Update PO Items as Received
        const updatedItems = formData.items.map(i => ({ ...i, quantityReceived: i.quantity }));

        // 3. Update PO Status to DONE/COMPLETED
        const updatedPO = {
            ...formData as PurchaseOrder,
            items: updatedItems,
            status: 'DONE' as POStatus
        };

        await savePO(updatedPO);
        setIsModalOpen(false);
        alert("รับสินค้าเรียบร้อย (Goods Received)");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const { totalPrice, subtotal, vat, grandTotal } = calculateTotals();
        const wb = XLSX.utils.book_new();

        // Header Info
        const wsData = [
            ['ACT&R HIGH PRECISION PART CO.,LTD.'],
            ['121/57-58 Moo 2 T.Bueng A. Sriracha Chonburi 20230'],
            ['Tel : 0-3806-3031 Fax : 0-3806-3032'],
            ['E-mail : sirapatchara_act@yahoo.co.th'],
            [''],
            ['QUOTATION', '', '', '', ''],
            ['TO', formData.customerName, '', 'Quote No:', formData.poNumber],
            ['ATTN', formData.contactPerson, '', 'Date:', new Date(formData.startDate!).toLocaleDateString('th-TH')],
            ['CC', '', '', 'Total Page:', '1 of 1'],
            ['Tel', contactPhone || '', '', 'From:', user?.name || 'Mr. APICHART NGERNMO'],
            ['Fax', companyFax || '', '', 'Mobile:', '086-3303373'],
            [''],
            ['Item', 'Description', 'Qty', 'Unit', 'Unit Price', 'Amount'],
        ];

        // Items
        tempItems.filter(i => i.isActive).forEach((item, index) => {
            wsData.push([
                (index + 1).toString(),
                item.name,
                item.quantity.toString(),
                item.unit,
                item.unitPrice.toLocaleString(),
                item.amount.toLocaleString()
            ]);
        });

        // Empty rows to fill space (optional)
        wsData.push(['', '', '', '', '', '']);

        // Footer
        wsData.push(['', '', '', '', 'Total', totalPrice.toLocaleString()]);
        wsData.push(['Delivery', formData.deliveryTerm || '', '', '', 'Discount', formData.discount?.toLocaleString()]);
        wsData.push(['Validity', formData.validityTerm || '', '', '', 'Sub Total', subtotal.toLocaleString()]);
        wsData.push(['Payment', formData.paymentTerm || '', '', '', 'VAT 7%', vat.toLocaleString()]);
        wsData.push(['', '', '', '', 'Grand Total', grandTotal.toLocaleString()]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Simple Column widths
        ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws, "Quotation");
        XLSX.writeFile(wb, `Quote_${formData.poNumber}.xlsx`);
    };

    const totals = calculateTotals();

    // --- Print Template Component ---
    const PrintTemplate = () => (
        <div className="hidden print:block font-sans text-xs leading-normal bg-white text-black p-0 m-0">
            {/* ... (Print template content identical to previous, keeping for consistency) ... */}
            <style>{`
            @page { size: A4; margin: 1cm; }
            @media print {
                body { background: white; -webkit-print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
                .print\\:block { display: block !important; }
            }
        `}</style>

            {/* Header */}
            <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-400">
                <div className="flex items-center">
                    <div className="w-16 h-16 border-2 border-black flex items-center justify-center mr-4">
                        <div className="text-center">
                            <div className="w-4 h-4 rounded-full border border-black mx-auto mb-1 flex items-center justify-center">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-widest">ACT&R</h1>
                        <p className="text-[0.6rem] tracking-widest">HIGH PRECISION PART CO.,LTD.</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">ใบเสนอราคา</h2>
                    <h2 className="text-xl font-bold uppercase">Quotation</h2>
                </div>
            </div>
            {/* ... rest of print template ... */}
            <div className="mb-4">
                <p className="font-bold">ACT&R HIGH PRECISION PART CO.,LTD.</p>
                <p>121/57-58 Moo 2 T.Bueng A. Sriracha Chonburi 20230</p>
                <p>Tel : 0-3806-3031 Fax : 0-3806-3032</p>
                <p>E-mail : sirapatchara_act@yahoo.co.th</p>
            </div>

            <div className="border border-black flex mb-4">
                <div className="flex-1 border-r border-black p-2 space-y-1">
                    <div className="flex"><span className="w-12 font-bold">TO</span> <span>{formData.customerName}</span></div>
                    <div className="flex"><span className="w-12 font-bold">ATTN</span> <span>{formData.contactPerson}</span></div>
                    <div className="flex"><span className="w-12 font-bold">CC</span> <span>-</span></div>
                    <div className="flex"><span className="w-12 font-bold">Tel</span> <span>{contactPhone}</span></div>
                    <div className="flex"><span className="w-12 font-bold">Fax</span> <span>{companyFax}</span></div>
                </div>
                <div className="w-80 p-2 space-y-1">
                    <div className="flex"><span className="w-24 font-bold">Quote No.:</span> <span>{formData.poNumber}</span></div>
                    <div className="flex"><span className="w-24 font-bold">Date :</span> <span>{formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-GB') : ''}</span></div>
                    <div className="flex"><span className="w-24 font-bold">Total Page:</span> <span>1 of 1</span></div>
                    <div className="flex"><span className="w-24 font-bold">From :</span> <span>Mr. APICHART NGERNMO</span></div>
                    <div className="flex"><span className="w-24 font-bold">Mobile :</span> <span>086-3303373 , 086-3389283</span></div>
                </div>
            </div>

            <div className="mb-2 text-xs">
                We thank you for your enquiry We have pleasure in quotation you the following products with price, terms and specification
                Please contact us if you have any query or required further information.
            </div>

            <div className="mb-4">
                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-1 w-10 text-center">Item</th>
                            <th className="border border-black p-1 text-center">Description</th>
                            <th className="border border-black p-1 w-24 text-center" colSpan={2}>Qty.</th>
                            <th className="border border-black p-1 w-28 text-right">Unit Price<br /><span className="text-[0.6rem]">Thai / Bath</span></th>
                            <th className="border border-black p-1 w-28 text-right">Amount<br /><span className="text-[0.6rem]">Thai / Bath</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tempItems.filter(i => i.isActive).map((item, idx) => (
                            <tr key={idx}>
                                <td className="border-l border-r border-black p-1 text-center h-8">{idx + 1}</td>
                                <td className="border-l border-r border-black p-1">{item.name}</td>
                                <td className="border-l border-black p-1 w-12 text-center">{item.quantity}</td>
                                <td className="border-r border-black p-1 w-12 text-center">{item.unit}</td>
                                <td className="border-l border-r border-black p-1 text-right">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="border-l border-r border-black p-1 text-right">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 15 - tempItems.length) }).map((_, idx) => (
                            <tr key={`empty-${idx}`}>
                                <td className="border-l border-r border-black p-1 text-center h-8">&nbsp;</td>
                                <td className="border-l border-r border-black p-1"></td>
                                <td className="border-l border-black p-1"></td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-l border-r border-black p-1"></td>
                                <td className="border-l border-r border-black p-1"></td>
                            </tr>
                        ))}
                        <tr><td colSpan={6} className="border-t border-black p-0 h-0"></td></tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} className="border border-black p-0 align-top" rowSpan={4}>
                                <div className="grid grid-cols-[80px_1fr] gap-1 p-2 text-xs">
                                    <span className="font-bold">Delivery</span>
                                    <span>{formData.deliveryTerm}</span>
                                    <span className="font-bold">Validity</span>
                                    <span>{formData.validityTerm}</span>
                                    <span className="font-bold">Payment</span>
                                    <span>{formData.paymentTerm}</span>
                                </div>
                            </td>
                            <td className="border border-black p-1 font-bold">Total</td>
                            <td className="border border-black p-1 text-right">{totals.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">Discount</td>
                            <td className="border border-black p-1 text-right">{formData.discount ? formData.discount.toLocaleString() : '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">Sub total</td>
                            <td className="border border-black p-1 text-right">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold">VAT 7 %</td>
                            <td className="border border-black p-1 text-right">{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td colSpan={4} className="border border-black p-1"></td>
                            <td className="border border-black p-1 font-bold">Grand Total</td>
                            <td className="border border-black p-1 text-right font-bold">{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex justify-end mt-12 mr-10">
                <div className="text-center w-64">
                    <div className="font-bold italic text-lg mb-1">Sirapat</div>
                    <div className="border-t border-dotted border-black pt-1 font-bold">MR. APICHART NGERNMO</div>
                    <div className="font-bold">Manager</div>
                </div>
            </div>
        </div>
    );

    return (
        <div ref={boardRef} className={`h-full flex flex-col bg-gray-50 dark:bg-slate-900 ${isFullscreen ? 'p-6 overflow-hidden' : ''}`}>
            {/* Hidden Print Template */}
            <PrintTemplate />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className={`${isFullscreen ? 'text-4xl' : 'text-3xl'} font-bold text-gray-800 dark:text-white flex items-center gap-2 transition-all`}>
                            {t('kb_title')}
                            {isFullscreen && <span className="text-lg font-normal text-gray-500 bg-gray-200 dark:bg-slate-700 px-3 py-1 rounded">Dashboard Mode</span>}
                        </h2>
                        <p className={`text-gray-500 dark:text-gray-400 ${isFullscreen ? 'text-xl' : 'text-lg'} transition-all`}>
                            {t('kb_subtitle')}
                        </p>
                    </div>
                    <div className="relative hidden md:block">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                        <input type="text" placeholder="ค้นหา (Search)..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-72 shadow-sm" />
                    </div>
                </div>
                <div className="flex gap-2">
                    {isFullscreen && (
                        <div className="flex gap-2">
                            <button onClick={toggleLanguage} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-200 shadow-sm"><Globe className="w-5 h-5" /></button>
                            <button onClick={toggleTheme} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-200 shadow-sm">{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
                        </div>
                    )}
                    <button onClick={toggleFullscreen} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm font-medium hidden md:flex">{isFullscreen ? <Minimize className="w-5 h-5 mr-2" /> : <Maximize className="w-5 h-5 mr-2" />}{t('kb_fullscreen')}</button>

                    {isEmployee && (
                        <button onClick={() => handleOpenModal()} className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium whitespace-nowrap"><Plus className="w-5 h-5 mr-2" />{t('kb_new')}</button>
                    )}
                </div>
            </div>

            {/* Board - Mobile Vertical, Desktop Horizontal */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 print:hidden">
                <div className="flex flex-col md:flex-row h-full gap-5 md:min-w-[1600px] min-w-full pb-20 md:pb-2">
                    {columns.map(col => {
                        const items = filteredOrders.filter(p => p.status === col.id);
                        return (
                            <div key={col.id} className={`flex-1 rounded-xl p-4 flex flex-col ${col.bg} ${col.darkBg} border border-transparent md:min-w-[280px]`}>
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <h3 className={`font-bold ${col.color} flex items-center ${isFullscreen ? 'text-xl' : 'text-sm'} uppercase tracking-wide truncate`}>
                                        <col.icon className={`${isFullscreen ? 'w-6 h-6' : 'w-5 h-5'} mr-2`} />{col.title}
                                    </h3>
                                    <span className={`bg-white dark:bg-slate-800 bg-opacity-70 rounded-full font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-slate-700 ${isFullscreen ? 'px-4 py-1 text-lg' : 'px-3 py-1 text-sm'}`}>{items.length}</span>
                                </div>
                                {/* On mobile allow vertical scroll of column items if needed, but page scrolls generally */}
                                <div className="flex-1 space-y-4 pr-1 md:overflow-y-auto custom-scrollbar">
                                    {items.map(item => (
                                        <div key={item.id} onClick={() => { if (isEmployee) handleOpenModal(item); }} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md cursor-pointer group relative flex flex-col ${col.id === 'CANCELLED' ? 'opacity-60 grayscale' : ''}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`${isFullscreen ? 'text-sm' : 'text-xs'} font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600`}>{item.poNumber}</span>
                                                {isEmployee && (
                                                    <div className="flex gap-1 z-10">
                                                        {col.id === 'CANCELLED' ? (
                                                            <>
                                                                <button onClick={(e) => handleRestore(item, e)} className="text-gray-400 hover:text-green-600 p-1" title="กู้คืน (Restore)"><RotateCcw className="w-4 h-4" /></button>
                                                                <button onClick={(e) => handleDelete(item, e)} className="text-gray-400 hover:text-red-600 p-1" title="ลบถาวร (Delete Permanently)"><Trash2 className="w-4 h-4" /></button>
                                                            </>
                                                        ) : (
                                                            <button onClick={(e) => handleDelete(item, e)} className="text-gray-400 hover:text-red-600 p-1" title="ย้ายไปถังขยะ (Move to Trash)"><Trash2 className="w-4 h-4" /></button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className={`font-bold text-gray-800 dark:text-gray-100 mb-1 ${isFullscreen ? 'text-xl' : 'text-base'} ${col.id === 'CANCELLED' ? 'line-through' : ''}`}>{item.title}</h4>
                                            <div className={`flex items-center text-gray-500 dark:text-gray-400 mb-1 ${isFullscreen ? 'text-base' : 'text-sm'}`}><User className="w-4 h-4 mr-1" />{item.customerName}</div>
                                            {item.items && item.items.length > 0 && (
                                                <div className={`${isFullscreen ? 'text-base' : 'text-xs'} font-medium text-right text-gray-500 mt-1`}>฿{item.totalAmount?.toLocaleString()}</div>
                                            )}
                                            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                                <div className={`flex items-center ${isFullscreen ? 'text-sm' : 'text-xs'} text-gray-400`}>
                                                    <Calendar className="w-4 h-4 mr-1" /> {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                                                </div>
                                                {isEmployee && col.id !== 'CANCELLED' && col.id !== 'DONE' && (
                                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                        {col.id !== 'RFQ' && <button onClick={() => updatePOStatus(item.id, columns[columns.findIndex(c => c.id === col.id) - 1].id)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ArrowLeft className="w-4 h-4" /></button>}
                                                        <button onClick={() => updatePOStatus(item.id, columns[columns.findIndex(c => c.id === col.id) + 1].id)} className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-500"><ArrowRight className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal - Mobile Fullscreen */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4 bg-black bg-opacity-60 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-slate-800 md:rounded-xl shadow-2xl w-full md:max-w-5xl h-full md:h-auto md:max-h-[95vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 md:p-6 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 rounded-t-xl">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formData.id ? 'ดูรายละเอียด (View Details)' : t('kb_new')}</h3>
                            <div className="flex items-center gap-2">
                                {/* Export Buttons */}
                                {formData.id && (
                                    <>
                                        <button onClick={handlePrint} className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold border border-gray-300 dark:border-slate-600 whitespace-nowrap">
                                            <Printer className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">PDF / Print</span>
                                        </button>
                                        <button onClick={handleExportExcel} className="flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-bold border border-green-200 dark:border-green-800 mr-2 md:mr-4 whitespace-nowrap">
                                            <FileSpreadsheet className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Excel</span>
                                        </button>
                                        {(formData.status === 'ORDERED' || formData.status === 'APPROVED' || formData.status === 'IN_PROGRESS') && (
                                            <button onClick={handleReceiveGoods} className="flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-bold border border-blue-200 dark:border-blue-800 mr-2 md:mr-4 whitespace-nowrap">
                                                <CheckSquare className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Receive Goods</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* ... (Existing Date/Number Fields) ... */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Quote No.</label>
                                        <input required type="text" value={formData.poNumber} onChange={e => setFormData({ ...formData, poNumber: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm border p-3 dark:text-white font-mono" placeholder="Auto-generated" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Quote Date</label>
                                        <input type="date" value={formData.startDate} onChange={handleStartDateChange} className="w-full bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm border p-3 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Duration (Days)</label>
                                        <input type="number" min="0" value={duration} onChange={handleDurationChange} className="w-full bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm border p-3 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Due Date</label>
                                        <input type="date" value={formData.dueDate} onChange={handleDueDateChange} className="w-full bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm border p-3 dark:text-white" />
                                    </div>
                                </div>

                                {/* Customer Selection Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Company Name</label>
                                        <input
                                            type="text"
                                            value={formData.customerName}
                                            onChange={handleCustomerChange}
                                            className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-3 dark:text-white"
                                            placeholder="Search Company..."
                                            autoComplete="off"
                                        />
                                        {showCustomerList && filteredCustomers.length > 0 && (
                                            <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg mt-1 z-50 max-h-40 overflow-y-auto">
                                                {filteredCustomers.map(c => (
                                                    <div key={c.id} className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer" onClick={() => selectCustomer(c)}>
                                                        <span className="font-bold text-gray-800 dark:text-white">{c.companyName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {companyFax && <p className="text-xs text-gray-500 mt-1 flex items-center"><Printer className="w-3 h-3 mr-1" /> Fax: {companyFax}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Contact Person</label>
                                        <select
                                            value={formData.contactPerson}
                                            onChange={handleContactChange}
                                            className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-3 dark:text-white"
                                        >
                                            <option value="">Select Contact...</option>
                                            {filteredContacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        {contactPhone && <p className="text-xs text-gray-500 mt-1 flex items-center"><Phone className="w-3 h-3 mr-1" /> Phone: {contactPhone}</p>}
                                    </div>
                                </div>

                                {/* Title & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Project / Job Title</label>
                                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm border p-3 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Status</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as POStatus })} className="w-full bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm border p-3 dark:text-white">
                                            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-4">
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">{t('kb_items')}</label>

                                    {/* Add Item form */}
                                    <div className="flex flex-col md:flex-row gap-3 mb-4 bg-gray-100 dark:bg-slate-900 p-4 rounded-xl relative">
                                        <div className="flex-[3] relative">
                                            <input
                                                type="text"
                                                value={itemEntry.name}
                                                onChange={(e) => handleItemEntryChange('name', e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && showProductList && productSuggestions.length > 0) {
                                                        e.preventDefault();
                                                        selectProductSuggestion(productSuggestions[0]);
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddItem();
                                                    }
                                                }}
                                                className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-3 text-sm text-gray-900 dark:text-white"
                                                placeholder={t('kb_items_placeholder')}
                                            />
                                            {showProductList && productSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg mt-1 z-50 max-h-40 overflow-y-auto">
                                                    {productSuggestions.map(p => (
                                                        <div key={p.id} className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between group" onClick={() => selectProductSuggestion(p)}>
                                                            <div className="flex items-center">
                                                                {p.source === 'History' && <History className="w-3 h-3 mr-2 text-purple-500" />}
                                                                <span className={`font-bold ${p.source === 'History' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-800 dark:text-white'}`}>{p.productName}</span>
                                                            </div>
                                                            <span className="text-gray-500 dark:text-gray-400">฿{p.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 md:flex gap-3">
                                            <input
                                                type="number" min="1" value={itemEntry.qty}
                                                onChange={(e) => handleItemEntryChange('qty', Number(e.target.value))}
                                                className="w-full md:w-20 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-3 text-sm text-center dark:text-white" placeholder="Qty"
                                            />
                                            <input
                                                type="text" value={itemEntry.unit}
                                                onChange={(e) => handleItemEntryChange('unit', e.target.value)}
                                                className="w-full md:w-20 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-3 text-sm text-center dark:text-white" placeholder="Unit"
                                            />
                                            <input
                                                type="number" min="0" value={itemEntry.price}
                                                onChange={(e) => handleItemEntryChange('price', Number(e.target.value))}
                                                className="w-full md:w-32 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm border p-3 text-sm text-right dark:text-white" placeholder="Price"
                                            />
                                        </div>
                                        <button type="button" onClick={handleAddItem} className="w-full md:w-auto px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-bold">Add</button>
                                    </div>

                                    {/* Items List (Same as before) */}
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                            {/* ... (Existing table code) ... */}
                                            <thead className="bg-gray-50 dark:bg-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3 w-10"></th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Item</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Qty</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Unit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Price</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Total</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                                {tempItems.map((item, idx) => (
                                                    <tr key={idx} className={!item.isActive ? 'opacity-50' : ''}>
                                                        <td className="px-2">
                                                            <div className="flex flex-col gap-1">
                                                                <button type="button" onClick={() => moveItem(idx, 'up')} className="text-gray-300 hover:text-blue-500 disabled:opacity-0" disabled={idx === 0}><ChevronUp className="w-4 h-4" /></button>
                                                                <button type="button" onClick={() => moveItem(idx, 'down')} className="text-gray-300 hover:text-blue-500 disabled:opacity-0" disabled={idx === tempItems.length - 1}><ChevronDown className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 min-w-[200px]">
                                                            {editingItemIndex === idx ? (
                                                                <input
                                                                    type="text" value={item.name}
                                                                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                                    className="w-full border rounded p-1 text-sm bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center">
                                                                    <button type="button" onClick={() => toggleItemActive(idx)} className={`mr-3 flex-shrink-0 ${item.isActive ? 'text-blue-500' : 'text-gray-300'}`}>
                                                                        {item.isActive ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                                    </button>
                                                                    <span className="text-base text-gray-900 dark:text-white font-medium">{item.name}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {editingItemIndex === idx ? (
                                                                <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} className="w-16 border rounded p-1 text-right text-sm bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600" />
                                                            ) : item.quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300 uppercase">
                                                            {editingItemIndex === idx ? (
                                                                <input type="text" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="w-16 border rounded p-1 text-center text-sm bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600" />
                                                            ) : (item.unit || 'PCS')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">
                                                            {editingItemIndex === idx ? (
                                                                <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} className="w-24 border rounded p-1 text-right text-sm bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600" />
                                                            ) : item.unitPrice.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-200">{item.amount.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button type="button" onClick={() => setEditingItemIndex(editingItemIndex === idx ? null : idx)} className="text-gray-400 hover:text-blue-500">
                                                                    {editingItemIndex === idx ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                                                </button>
                                                                <button type="button" onClick={() => removeTempItem(idx)} className="text-gray-400 hover:text-red-500">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Financial Summary (Same as before) */}
                                    <div className="flex flex-col items-end mt-6">
                                        <div className="w-full md:w-[480px] grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Terms Inputs */}
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Delivery</label>
                                                    <input
                                                        type="text"
                                                        value={formData.deliveryTerm}
                                                        onChange={e => setFormData({ ...formData, deliveryTerm: e.target.value })}
                                                        className="w-full text-xs p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Validity</label>
                                                    <input
                                                        type="text"
                                                        value={formData.validityTerm}
                                                        onChange={e => setFormData({ ...formData, validityTerm: e.target.value })}
                                                        className="w-full text-xs p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Payment</label>
                                                    <input
                                                        type="text"
                                                        value={formData.paymentTerm}
                                                        onChange={e => setFormData({ ...formData, paymentTerm: e.target.value })}
                                                        className="w-full text-xs p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                                    <span>Total Price:</span>
                                                    <span>{totals.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>

                                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 items-center">
                                                    <span>Discount:</span>
                                                    <input
                                                        type="number"
                                                        value={formData.discount}
                                                        onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                                        className="w-24 text-right p-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-sm text-gray-900 dark:text-white"
                                                    />
                                                </div>

                                                <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-gray-200 pt-2 border-t border-gray-200 dark:border-slate-600">
                                                    <span>Subtotal:</span>
                                                    <span>{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>

                                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                                    <span>VAT (7%):</span>
                                                    <span>{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>

                                                <div className="flex justify-between text-xl font-bold text-blue-700 dark:text-blue-400 pt-2 border-t-2 border-blue-200 dark:border-blue-900 mt-2">
                                                    <span>Grand Total:</span>
                                                    <span>{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ... (Bottom Actions) ... */}
                                <div className="p-4 md:p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-xl flex justify-between items-center sticky bottom-0 z-10">
                                    {formData.id && (
                                        <div className="flex gap-2">
                                            {formData.status === 'CANCELLED' ? (
                                                <button type="button" onClick={handleModalDelete} className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center font-bold text-sm md:text-base"><Trash2 className="w-5 h-5 md:mr-2" /><span className="hidden md:inline">Delete Permanently</span></button>
                                            ) : (
                                                <button type="button" onClick={handleModalDelete} className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center font-bold text-sm md:text-base"><Trash2 className="w-5 h-5 md:mr-2" /><span className="hidden md:inline">Move to Trash</span></button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex space-x-3 ml-auto">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm md:text-base">Close</button>
                                        <button type="button" onClick={handleSubmit} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm md:text-base">Save Order</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
