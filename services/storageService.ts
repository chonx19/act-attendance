
import {
  Product, StockLevel, StockTransaction, User, UserRole, TransactionType, PurchaseOrder, POStatus, Customer, ActiveSession, IpWhitelist, Message, CustomerProduct,
  TaskCard, WorkLog, AttendanceRecord
} from '../types';

// API Configuration
const API_URL = '/api';

// Initial Data (Seed)
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_STOCK: StockLevel[] = [];
const INITIAL_USERS: User[] = [
  { id: '1', username: 'chana19', password: 'chana19', name: 'Admin (Chana)', role: UserRole.ADMIN, isActive: true }

];

// Cache Object
const cache: any = {
  products: [],
  stock: [],
  transactions: [],
  users: [],
  pos: [],
  customers: [],
  sessions: [],
  whitelist: [],
  messages: [],
  attendance: [],
  customer_products: [],
  tasks: [],
  worklogs: []
};

// Map storage keys to cache keys
const KEY_MAP: any = {
  products: 'act_products_v10',
  stock: 'act_stock_v10',
  transactions: 'act_transactions_v10',
  users: 'act_users_v10',
  pos: 'act_pos_v10',
  customers: 'act_customers_v10',
  sessions: 'act_sessions_v10',
  whitelist: 'act_whitelist_v10',
  messages: 'act_messages_v10',
  attendance: 'act_attendance_v10',
  customer_products: 'act_customer_products_v10',
  tasks: 'act_tasks_v10',
  worklogs: 'act_worklogs_v10',
};

// Helper: API Fetch
const api = {
  get: async (key: string) => {
    try {
      const res = await fetch(`${API_URL}/data/${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn(`API Read Error (${key}):`, e);
      return null;
    }
  },
  post: async (key: string, data: any) => {
    try {
      await fetch(`${API_URL}/data/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(`API Write Error (${key}):`, e);
    }
  }
};

export const storageService = {
  // Initialize: Load everything from Server
  init: async () => {
    await storageService.fetchUpdates();

    // Seed Users if empty
    if (cache.users.length === 0) {
      cache.users = INITIAL_USERS;
      api.post('users', INITIAL_USERS);
    }
  },

  // Sync: Pull all data from server to update cache
  fetchUpdates: async () => {
    const keys = Object.keys(cache);
    await Promise.all(keys.map(async (key) => {
      const data = await api.get(key);
      if (Array.isArray(data)) { // Simple validation
        cache[key] = data;
      }
    }));
  },

  // --- Products ---
  getProducts: (): Product[] => cache.products,
  saveProduct: (product: Product) => {
    const list = [...cache.products];
    const index = list.findIndex((p: Product) => p.id === product.id);
    if (index >= 0) list[index] = product; else list.push(product);
    cache.products = list;
    api.post('products', list);
  },
  deleteProduct: (id: string) => {
    const list = cache.products.filter((p: Product) => p.id !== id);
    cache.products = list;
    api.post('products', list);
  },

  // --- Stock & Transactions ---
  getStockLevels: (): StockLevel[] => cache.stock,
  getTransactions: (): StockTransaction[] => cache.transactions,
  createTransaction: (
    type: TransactionType,
    productId: string,
    quantity: number,
    userId: string,
    notes?: string
  ) => {
    const transactions = [...cache.transactions];
    const stock = [...cache.stock];

    const currentStockIndex = stock.findIndex((s: StockLevel) => s.productId === productId);
    let currentQty = currentStockIndex >= 0 ? stock[currentStockIndex].quantity : 0;

    if (type === TransactionType.OUT) {
      if (currentQty < quantity) throw new Error(`สินค้าในคลังไม่เพียงพอ (มีอยู่: ${currentQty})`);
      currentQty -= quantity;
    } else {
      currentQty += quantity;
    }

    if (currentQty < 0) throw new Error("การทำรายการจะทำให้สต็อกติดลบ");

    if (currentStockIndex >= 0) {
      stock[currentStockIndex].quantity = currentQty;
    } else {
      stock.push({ productId, quantity: currentQty });
    }

    // Update Cache
    cache.stock = stock;
    api.post('stock', stock);

    // --- Generate Doc Num ---
    let typePrefix = 'DOC';
    if (type === TransactionType.IN) typePrefix = 'IN';
    if (type === TransactionType.OUT) typePrefix = 'OUT';
    if (type === TransactionType.ADJ) typePrefix = 'ADJ';

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const datePrefix = `ACT${typePrefix}${yy}-${mm}-${dd}-`;
    const dailyCount = transactions.filter((t: StockTransaction) => t.documentNumber.startsWith(datePrefix)).length + 1;
    const runningNum = dailyCount.toString().padStart(3, '0');
    const docNum = `${datePrefix}${runningNum}`;

    const newTx: StockTransaction = {
      id: Date.now().toString(),
      documentNumber: docNum,
      date: new Date().toISOString(),
      type,
      productId,
      quantity,
      userId,
      notes
    };

    transactions.unshift(newTx);
    cache.transactions = transactions;
    api.post('transactions', transactions);

    return newTx;
  },

  // --- Purchase Orders ---
  getPOs: (): PurchaseOrder[] => {
    // Filter cancelled logic locally? Or server side?
    // For now, keep generic.
    return cache.pos;
  },
  savePO: (po: PurchaseOrder) => {
    const list = [...cache.pos];
    const index = list.findIndex((p: PurchaseOrder) => p.id === po.id);
    if (index >= 0) list[index] = po; else list.push(po);
    cache.pos = list;
    api.post('pos', list);

    // History logic
    if (po.customerName && po.items.length > 0) {
      let historyList = [...cache.customer_products];
      historyList = historyList.filter((cp: CustomerProduct) => cp.poId !== po.id);
      po.items.forEach(item => {
        historyList.push({
          id: Date.now().toString() + Math.random(),
          customerName: po.customerName,
          productName: item.name,
          price: item.unitPrice,
          unit: item.unit,
          lastQuotedDate: po.startDate || new Date().toISOString(),
          poId: po.id,
          poNumber: po.poNumber,
          quantity: item.quantity
        });
      });
      historyList.sort((a: CustomerProduct, b: CustomerProduct) => new Date(b.lastQuotedDate).getTime() - new Date(a.lastQuotedDate).getTime());

      cache.customer_products = historyList;
      api.post('customer_products', historyList);
    }
  },
  updatePOStatus: (id: string, status: POStatus) => {
    const list = [...cache.pos];
    const item = list.find((p: PurchaseOrder) => p.id === id);
    if (item) {
      item.status = status;
      item.deletedAt = (status === 'CANCELLED') ? new Date().toISOString() : undefined;
      cache.pos = list;
      api.post('pos', list);
    }
  },
  deletePO: (id: string) => {
    const list = cache.pos.filter((p: PurchaseOrder) => p.id !== id);
    cache.pos = list;
    api.post('pos', list);
  },

  // --- Customers ---
  getCustomers: (): Customer[] => cache.customers,
  saveCustomer: (customer: Customer) => {
    const list = [...cache.customers];
    const index = list.findIndex((c: Customer) => c.id === customer.id);
    if (index >= 0) list[index] = customer; else list.push(customer);
    cache.customers = list;
    api.post('customers', list);
  },
  deleteCustomer: (id: string) => {
    const list = cache.customers.filter((c: Customer) => c.id !== id);
    cache.customers = list;
    api.post('customers', list);
  },

  // --- Customer Products ---
  getCustomerProducts: (): CustomerProduct[] => cache.customer_products,
  importCustomerProducts: (newItems: CustomerProduct[]) => {
    const list = [...cache.customer_products, ...newItems];
    list.sort((a: CustomerProduct, b: CustomerProduct) => new Date(b.lastQuotedDate).getTime() - new Date(a.lastQuotedDate).getTime());
    cache.customer_products = list;
    api.post('customer_products', list);
  },

  // --- Messages ---
  getMessages: (): Message[] => cache.messages,
  saveMessage: (msg: Message) => {
    const list = [msg, ...cache.messages];
    cache.messages = list;
    api.post('messages', list);
  },
  markMessageRead: (id: string) => {
    const list = [...cache.messages];
    const msg = list.find((m: Message) => m.id === id);
    if (msg) {
      msg.isRead = true;
      cache.messages = list;
      api.post('messages', list);
    }
  },

  // --- User Management ---
  getUsers: (): User[] => cache.users,
  saveUser: (user: User) => {
    const list = [...cache.users];
    const index = list.findIndex((u: User) => u.id === user.id);
    if (index >= 0) {
      if (!user.password) user.password = list[index].password;
      list[index] = user;
    } else {
      list.push(user);
    }
    cache.users = list;
    api.post('users', list);
  },
  deleteUser: (id: string) => {
    const list = cache.users.filter((u: User) => u.id !== id);
    cache.users = list;
    api.post('users', list);
  },

  // --- Whitelist ---
  getWhitelist: (): IpWhitelist[] => cache.whitelist,
  addToWhitelist: (ip: string, description: string, by: string) => {
    const list = [...cache.whitelist];
    if (list.some((i: IpWhitelist) => i.ip === ip)) throw new Error('IP Exists');
    list.push({ id: Date.now().toString(), ip, description, addedBy: by, addedAt: new Date().toISOString() });
    cache.whitelist = list;
    api.post('whitelist', list);
  },
  removeFromWhitelist: (id: string) => {
    const list = cache.whitelist.filter((i: IpWhitelist) => i.id !== id);
    cache.whitelist = list;
    api.post('whitelist', list);
  },

  // --- Sessions ---
  getSessions: (): ActiveSession[] => cache.sessions,
  createSession: (user: User, ip: string) => {
    const sessions = [{
      id: Date.now().toString(),
      userId: user.id,
      userName: user.username,
      ipAddress: ip,
      userAgent: navigator.userAgent,
      loginTime: new Date().toISOString()
    }, ...cache.sessions].slice(0, 50);
    cache.sessions = sessions;
    api.post('sessions', sessions);
  },

  // --- Login ---
  login: async (username: string, password: string, clientIp: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, clientIp })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const data = await res.json();
      if (data.success && data.user) {
        const user = data.user;

        // Fix Component Role Mismatch (Server 'ADMIN' vs Client 'Admin')
        if (user.role === 'ADMIN' as any) user.role = UserRole.ADMIN;
        if (user.role === 'USER' as any) user.role = UserRole.USER;
        if (user.role === 'CUSTOMER' as any) user.role = UserRole.CUSTOMER;

        // Save normalized data (local storage only, sensitive data is safe)
        storageService.saveUser(user);
        return user;
      }
      return null;

    } catch (e: any) {
      console.error('Login Error:', e);
      throw e;
    }
  },

  // --- Data Export/Import ---
  getAllData: () => JSON.stringify(cache),
  importData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      Object.keys(data).forEach(k => {
        if (cache[k]) cache[k] = data[k];
        api.post(k, data[k]);
      });
      return true;
    } catch (e) { return false; }
  },

  // --- Tasks ---
  getTasks: (): TaskCard[] => cache.tasks,
  saveTask: (task: TaskCard) => {
    const list = [...cache.tasks];
    const index = list.findIndex((t: TaskCard) => t.id === task.id);
    if (index >= 0) list[index] = task; else list.push(task);
    cache.tasks = list;
    api.post('tasks', list);
  },
  deleteTask: (id: string) => {
    const list = cache.tasks.filter((t: TaskCard) => t.id !== id);
    cache.tasks = list;
    api.post('tasks', list);
  },

  // --- WorkLogs ---
  getWorkLogs: (): WorkLog[] => cache.worklogs,
  checkIn: (user: User) => {
    const logs = [...cache.worklogs];
    const todayStatus = logs.find((l: WorkLog) => l.userId === user.id && l.type === 'CLOCK_IN' && !l.endTime && new Date(l.startTime).toDateString() === new Date().toDateString());
    if (todayStatus) throw new Error("Already checked in");

    const newLog = { id: Date.now().toString(), userId: user.id, userName: user.name, type: 'CLOCK_IN', startTime: new Date().toISOString() };
    logs.unshift(newLog);
    cache.worklogs = logs;
    api.post('worklogs', logs);
  },
  checkOut: (user: User) => {
    const logs = [...cache.worklogs];
    const activeLog = logs.find((l: WorkLog) => l.userId === user.id && l.type === 'CLOCK_IN' && !l.endTime);
    if (!activeLog) throw new Error("No active check-in");

    const now = new Date();
    activeLog.endTime = now.toISOString();
    activeLog.durationMinutes = Math.floor((now.getTime() - new Date(activeLog.startTime).getTime()) / 60000);

    cache.worklogs = logs;
    api.post('worklogs', logs);
  },
  startTaskTimer: (user: User, task: TaskCard) => {
    const logs = [...cache.worklogs];
    const activeTask = logs.find((l: WorkLog) => l.userId === user.id && l.type === 'TASK' && !l.endTime);
    if (activeTask) throw new Error("Working on another task");

    const newLog = { id: Date.now().toString(), userId: user.id, userName: user.name, type: 'TASK', startTime: new Date().toISOString(), taskId: task.id, taskTitle: task.title };
    logs.unshift(newLog);
    cache.worklogs = logs;
    api.post('worklogs', logs);
  },
  stopTaskTimer: (user: User) => {
    const logs = [...cache.worklogs];
    const activeTask = logs.find((l: WorkLog) => l.userId === user.id && l.type === 'TASK' && !l.endTime);
    if (!activeTask) throw new Error("No active task");

    const now = new Date();
    activeTask.endTime = now.toISOString();
    activeTask.durationMinutes = Math.floor((now.getTime() - new Date(activeTask.startTime).getTime()) / 60000);

    cache.worklogs = logs;
    api.post('worklogs', logs);
  },

  // --- Attendance ---
  getAttendance: (): AttendanceRecord[] => cache.attendance,
  saveAttendance: (records: AttendanceRecord[]) => {
    const existing = cache.attendance;
    const newRecords = [...records, ...existing];
    const unique = new Map();
    newRecords.forEach((r: AttendanceRecord) => unique.set(r.id, r));
    const list = Array.from(unique.values());

    cache.attendance = list;
    api.post('attendance', list);
  },
  clearAttendance: () => {
    cache.attendance = [];
    api.post('attendance', []);
  }
};
