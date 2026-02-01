
export enum UserRole {
  ADMIN = 'Admin', // ผู้ดูแลระบบ (พนักงาน)
  USER = 'User',   // พนักงานทั่วไป
  CUSTOMER = 'Customer', // ลูกค้า
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for display, required for auth
  role: UserRole;
  name: string;
  lastLogin?: string;
  isActive: boolean;
  linkedCustomerId?: string; // Link user to a specific customer profile
  permissions?: string[]; // List of allowed menu IDs (e.g. 'dashboard', 'stock')
  position?: string; // New: Employee Position/Group (e.g. 'Driver', 'Worker', 'Kid')
}

export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  KANBAN: 'kanban',
  PRODUCTS: 'products',
  STOCK: 'stock',
  REPORTS: 'reports',
  CUSTOMERS: 'customers',
  ATTENDANCE: 'attendance',
  DEVICES: 'devices',
  SETTINGS: 'settings' // Usually Admin only, but maybe restricted admin
};

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  location?: string; // New: Shelf/Zone Location
  unit: string;
  cost: number;
  price: number;
  barcode: string;
  minStockLevel: number;

  // New Fields
  weightPerPiece: number; // Weight per 1 unit (e.g. grams)
  supplier: string;       // Company Name
  imageFileId?: string;   // Google Drive File ID
}

export interface StockLevel {
  productId: string;
  // locationId removed
  quantity: number;
}

export enum TransactionType {
  IN = 'รับเข้า',
  OUT = 'เบิกออก',
  ADJ = 'ปรับปรุง',
}

export interface StockTransaction {
  id: string;
  documentNumber: string;
  date: string;
  type: TransactionType;
  productId: string;
  // locationId removed
  quantity: number;
  userId: string;
  notes?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  totalValue: number;
}

// Kanban / PO Types
export type POStatus = 'RFQ' | 'QUOTATION' | 'WAITING_PO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface POItem {
  id: string;
  name: string; // Description
  quantity: number;
  unit: string; // New: Unit (PCS, SET, etc.)
  unitPrice: number;
  amount: number; // qty * unitPrice
  isActive: boolean;
  quantityReceived?: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  customerName: string;
  contactPerson?: string; // New: Contact Person Name
  status: POStatus;
  dueDate: string;
  startDate?: string; // New: To track duration
  description?: string;
  items: POItem[];
  discount: number; // New
  vat: number; // New
  totalAmount: number; // New (After Discount + Vat)
  deletedAt?: string; // New: Track when item was moved to Cancelled
}

export interface ContactPerson {
  id: string;
  name: string; // ATTN Name
  phone?: string;
  email?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  code: string; // New: Short Code (e.g., ACT, SCG)
  contacts: ContactPerson[];
  address?: string;
  taxId?: string;
  fax?: string; // New field
}

// History of items sold/quoted to specific customers (Separated from Main Stock)
export interface CustomerProduct {
  id: string;
  customerName: string; // Key to link with Customer
  productName: string;
  price: number;
  unit: string;
  lastQuotedDate: string;
  poId?: string; // Link to PO
  poNumber?: string; // Display PO No
  quantity?: number; // History Qty
}

// --- New Types for System Management ---

export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
}

export interface IpWhitelist {
  id: string;
  ip: string;
  description: string;
  addedBy: string;
  addedAt: string;
}

export interface SystemBackup {
  version: string;
  timestamp: string;
  data: any;
}

// --- Messaging System ---
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  type: 'INQUIRY' | 'QUOTATION_REQUEST' | 'GENERAL';
}

// --- Task Kanban & Work Log ---

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

export interface TaskCard {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus; // Column
  assigneeId?: string; // User ID
  dueDate?: string;
  createdAt: string;
  projectId?: string; // Optional link to project/PO
}

export type WorkLogType = 'CLOCK_IN' | 'CLOCK_OUT' | 'TASK';

export interface WorkLog {
  id: string;
  userId: string;
  userName: string;
  type: WorkLogType;
  startTime: string;
  endTime?: string; // Null if currently working
  taskId?: string; // If linked to a specific task
  taskTitle?: string;
  description?: string; // Notes
  durationMinutes?: number; // Calculated on completion
}

// External Attendance (From Excel)
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  type: string; // 'Check-in', 'Check-out', or raw status from device
  department?: string;
}

// Devices (Face Scan)
export interface Device {
  id: string;
  name: string;
  ip?: string;
  apiKey: string;
  uploadUrl: string; // The URL to put in SDKDemoApp
  lastHeartbeat?: string;
  status: 'ONLINE' | 'OFFLINE';
}
