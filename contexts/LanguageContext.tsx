import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'th';

const translations = {
  en: {
    dashboard: 'Dashboard',
    devices: 'Devices',
    attendance: 'Attendance',
    settings: 'Settings',
    dailyReport: 'Daily Attendance Report',
    rangeReport: 'Range Summary',
    employee: 'Employee',
    position: 'Position',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    status: 'Status',
    remarks: 'Remarks',
    action: 'Action',
    filter: 'Filter',
    syncLogs: 'Sync Logs',
    syncNames: 'Sync Names',
    exportExcel: 'Export Excel',
    startDate: 'Start Date',
    endDate: 'End Date',
    present: 'Present',
    late: 'Late',
    absent: 'Absent',
    totalPresent: 'Total Present',
    totalLate: 'Total Late',
    totalAbsent: 'Total Absent',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    unknown: 'Unknown',
    backupData: 'Backup Data',
    restoreData: 'Restore Data',
    language: 'Language',
    theme: 'Theme',
    adminPin: 'Admin PIN',
    setPin: 'Set PIN',
    enterPin: 'Enter PIN',
    accessDenied: 'Access Denied',
    success: 'Success',
    error: 'Error',
    confirmDelete: 'Confirm Delete?',
    downloadBackup: 'Download Backup',
    uploadRestore: 'Upload to Restore',
    restoreWarning: 'This will overwrite all current data. Continue?',
    processing: 'Processing...',
    logout: 'Logout',
    menu_dashboard: 'Dashboard',
    menu_kanban: 'Kanban Board',
    menu_products: 'Products',
    menu_stock: 'Stock Movement',
    menu_reports: 'Reports',
    menu_customers: 'Customers',
    menu_main: 'Main',
    menu_master: 'Master Data',
    menu_system: 'System',
    menu_attendance_logs: 'Attendance Logs',
    menu_messages: 'Messages',
    kb_title: 'Kanban Board',
    menu_admin: 'Admin',
    menu_manage_users: 'Manage Users',
    nav_logout: 'Logout',
    // Dashboard
    dash_title: 'Dashboard',
    dash_total_products: 'Total Products',
    dash_total_stock: 'Total Stock',
    dash_low_stock: 'Low Stock Items',
    dash_total_value: 'Total Value',
    dash_recent_activity: 'Recent Activity',
    dash_subtitle: 'Overview of system performance and stock status',
    dash_chart_title: 'Monthly Purchase Orders',
    dash_chart_axis_y: 'Number of Orders',
    dash_chart_tooltip: 'Orders',
    // Products
    prod_search_ph: 'Search by Name, Code, or Barcode...',
    prod_all_locations: 'All Locations',
    prod_all_suppliers: 'All Suppliers',
    prod_new: 'Add Product',
    // Kanban
    kb_status_rfq: 'RFQ',
    kb_status_quotation: 'Quotation',
    kb_status_waiting: 'Waiting PO',
    kb_status_progress: 'In Progress',
    kb_status_done: 'Done',
    kb_status_cancelled: 'Cancelled',
    kb_subtitle: 'Manage your Purchase Orders visually',
    kb_fullscreen: 'Fullscreen',
    kb_new: 'New PO',
    // Landing Page
    nav_services: 'Services',
    nav_about: 'About Us',
    nav_contact: 'Contact',
    nav_login: 'Employee Login',
    hero_title: 'Your Trusted Partner in Industrial Supply',
    hero_subtitle: 'Provide high-quality tools, machinery, and consumables for all industrial needs. Fast, Reliable, and Precise.',
    cta_contact: 'Contact Us',
    cta_employee: 'Employee Portal',
    service_title: 'Supporting All Industrial Needs with Quality Products',
    service_1_title: 'Industrial Tools',
    service_1_desc: 'Comprehensive range of high-quality tools and equipment for factory maintenance and operations.',
    service_2_title: 'Factory Consumables',
    service_2_desc: 'Supply of all essential consumables, lubricants, safety gear, and chemicals.',
    service_3_title: 'Sourcing Service',
    service_3_desc: 'Specialized sourcing for hard-to-find parts and machinery tailored to your requirements.',
    company_full_th: 'ACT & R HIGH PRECISION PART CO., LTD.',
    company_full_en: 'ACT & R HIGH PRECISION PART CO., LTD.',
    company_desc: 'Distributor of raw materials, consumables, machinery, and industrial tools. We are committed to reliability and speed to keep your production running smoothly.',
    contact_address: '121/57-58 Moo 2, Bueng, Si Racha, Chon Buri 20230',
    contact_phone: 'Tel: 086-338-9283',
    google_map_label: 'View on Google Maps',
    login_title: 'Employee Access',
    login_username: 'Username',
    login_password: 'Password',
    login_btn: 'Sign In',
    login_back: 'Back to Home'
  },
  th: {
    dashboard: 'แดชบอร์ด',
    devices: 'จัดการอุปกรณ์',
    attendance: 'บันทึกเวลา',
    settings: 'ตั้งค่า',
    dailyReport: 'รายงานประจำวัน',
    rangeReport: 'สรุปรายช่วงเวลา',
    employee: 'พนักงาน',
    position: 'ตำแหน่ง',
    checkIn: 'เวลาเข้า',
    checkOut: 'เวลาออก',
    status: 'สถานะ',
    remarks: 'หมายเหตุ',
    action: 'จัดการ',
    filter: 'ตัวกรอง',
    syncLogs: 'ดึงข้อมูลเวลา',
    syncNames: 'ดึงรายชื่อ',
    exportExcel: 'ส่งออก Excel',
    startDate: 'วันที่เริ่มต้น',
    endDate: 'วันที่สิ้นสุด',
    present: 'มาปกติ',
    late: 'มาสาย',
    absent: 'ขาดงาน',
    totalPresent: 'มาปกติ (วัน)',
    totalLate: 'มาสาย (วัน)',
    totalAbsent: 'ขาดงาน (วัน)',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    edit: 'แก้ไข',
    unknown: 'ไม่ระบุชื่อ',
    backupData: 'สำรองข้อมูล',
    restoreData: 'กู้คืนข้อมูล',
    language: 'ภาษา',
    theme: 'ธีม',
    adminPin: 'รหัสผ่าน Admin',
    setPin: 'ตั้งรหัสผ่าน',
    enterPin: 'กรุณาใส่รหัสผ่าน',
    accessDenied: 'ไม่มีสิทธิ์เข้าถึง',
    success: 'สำเร็จ',
    error: 'ผิดพลาด',
    confirmDelete: 'ยืนยันการลบ?',
    downloadBackup: 'ดาวน์โหลดข้อมูลสำรอง',
    uploadRestore: 'อัปโหลดไฟล์กู้คืน',
    restoreWarning: 'ข้อมูลปัจจุบันจะถูกทับทั้งหมด ยืนยันหรือไม่?',
    processing: 'กำลังดำเนินการ...',
    logout: 'ออกจากระบบ',
    menu_dashboard: 'แดชบอร์ด',
    menu_kanban: 'กระดาน Kanban',
    menu_products: 'สินค้า',
    menu_stock: 'สต็อกสินค้า',
    menu_reports: 'รายงาน',
    menu_customers: 'ลูกค้า',
    menu_main: 'เมนูหลัก',
    menu_master: 'ข้อมูลหลัก',
    menu_system: 'ระบบ',
    menu_attendance_logs: 'บันทึกเวลา',
    menu_messages: 'ข้อความ',
    kb_title: 'กระดานงาน',
    menu_admin: 'ผู้ดูแลระบบ',
    menu_manage_users: 'จัดการผู้ใช้',
    nav_logout: 'ออกจากระบบ',
    // Dashboard
    dash_title: 'ภาพรวมระบบ (Dashboard)',
    dash_total_products: 'จำนวนสินค้าทั้งหมด',
    dash_total_stock: 'ยอดสต็อกรวม',
    dash_low_stock: 'สินค้าใกล้หมด',
    dash_total_value: 'มูลค่ารวม',
    dash_recent_activity: 'กิจกรรมล่าสุด',
    dash_subtitle: 'ภาพรวมระบบและสถานะสต็อกสินค้า',
    dash_chart_title: 'คำสั่งซื้อรายเดือน',
    dash_chart_axis_y: 'จำนวนคำสั่งซื้อ',
    dash_chart_tooltip: 'รายการ',
    // Products
    prod_search_ph: 'ค้นหาด้วยชื่อ, รหัส หรือบาร์โค้ด...',
    prod_all_locations: 'ทุกสถานที่เก็บ',
    prod_all_suppliers: 'ทุกผู้จำหน่าย',
    prod_new: 'เพิ่มสินค้า',
    // Kanban
    kb_status_rfq: 'ขอใบเสนอราคา (RFQ)',
    kb_status_quotation: 'เสนอราคา (Quotation)',
    kb_status_waiting: 'รอใบสั่งซื้อ (Waiting PO)',
    kb_status_progress: 'กำลังดำเนินงาน (In Progress)',
    kb_status_done: 'เสร็จสิ้น (Done)',
    kb_status_cancelled: 'ยกเลิก (Cancelled)',
    kb_subtitle: 'จัดการรายการสั่งซื้อแบบแผนภาพ',
    kb_fullscreen: 'เต็มจอ',
    kb_new: 'สร้างรายการใหม่',
    // Landing Page
    nav_services: 'บริการ',
    nav_about: 'เกี่ยวกับเรา',
    nav_contact: 'ติดต่อเรา',
    nav_login: 'เข้าสู่ระบบพนักงาน',
    hero_title: 'คู่คิดธุรกิจอุตสาหกรรมที่คุณวางใจได้',
    hero_subtitle: 'จัดจำหน่ายเครื่องจักร เครื่องมือ และวัสดุสิ้นเปลืองสำหรับโรงงานอุตสาหกรรม ด้วยสินค้าคุณภาพและการบริการที่รวดเร็ว',
    cta_contact: 'ติดต่อสอบถาม',
    cta_employee: 'สำหรับพนักงาน',
    service_title: 'เราพร้อมสนับสนุนทุกความต้องการของโรงงานอุตสาหกรรมด้วยสินค้าคุณภาพ',
    service_1_title: 'เครื่องมืออุตสาหกรรม',
    service_1_desc: 'จัดจำหน่ายเครื่องมือช่างและอุปกรณ์โรงงานคุณภาพสูง ครบครันทุกความต้องการ',
    service_2_title: 'วัสดุสิ้นเปลือง',
    service_2_desc: 'จัดหาวัสดุสิ้นเปลืองในโรงงาน น้ำมันหล่อลื่น อุปกรณ์ความปลอดภัย และเคมีภัณฑ์',
    service_3_title: 'บริการจัดหา',
    service_3_desc: 'บริการจัดหาสินค้าตามความต้องการเฉพาะทาง รวดเร็ว แม่นยำ ส่งถึงมือคุณ',
    company_full_th: 'บริษัท แอ็ค แอนด์ อาร์ ไฮ พรีซิชั่น พาร์ท จำกัด',
    company_full_en: 'ACT & R HIGH PRECISION PART CO., LTD.',
    company_desc: 'ผู้จัดจำหน่ายวัตถุดิบ วัสดุสิ้นเปลือง เครื่องจักร และเครื่องมือช่างสำหรับโรงงานอุตสาหกรรม มุ่งมั่นบริการด้วยความซื่อสัตย์และรวดเร็ว',
    contact_address: '121/57-58 หมู่2 ตำบลบึง อำเภอศรีราชา จังหวัดชลบุรี 20230',
    contact_phone: 'โทร: 086-338-9283',
    google_map_label: 'ดูแผนที่ Google Maps',
    login_title: 'เข้าสู่ระบบพนักงาน',
    login_username: 'ชื่อผู้ใช้งาน',
    login_password: 'รหัสผ่าน',
    login_btn: 'เข้าสู่ระบบ',
    login_back: 'กลับหน้าหลัก'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('th'); // Default to Thai

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved) setLanguage(saved);
  }, []);

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'th' : 'en';
    updateLanguage(newLang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};