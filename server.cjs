const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001; // Use Cloud PORT or 3001 locally

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Static Frontend (Production)
app.use(express.static(path.join(__dirname, 'dist')));

// Data Files (Local Fallback)
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const DEVICES_FILE = 'devices.json';
const ATTENDANCE_FILE = 'attendance.json';
const USERS_FILE = 'users.json';
const EMPLOYEES_FILE = 'employees.json';

// --- MongoDB Integration ---
let isMongoConnected = false;
const MONGODB_URI = process.env.MONGODB_URI;

// Simple Schema to mimic file system in MongoDB
const FileSchema = new mongoose.Schema({
    filename: { type: String, unique: true },
    content: { type: mongoose.Schema.Types.Mixed, default: [] }
}, { strict: false, timestamps: true });

const FileModel = mongoose.model('FileStore', FileSchema);

// Connect
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('[Server] Connected to MongoDB Atlas');
            isMongoConnected = true;
            initData(); // Re-run init after DB connect
        })
        .catch(err => console.error('[Server] MongoDB Connection Error:', err));
} else {
    console.log('[Server] No MONGODB_URI found. Using local JSON files only.');
}

// --- Data Access Layer (Async) ---

// Get Data (Try DB -> Fallback to File)
const getData = async (filename) => {
    if (isMongoConnected) {
        try {
            const doc = await FileModel.findOne({ filename });
            if (doc) return doc.content;
            return []; // Return empty if not found in DB
        } catch (e) {
            console.error(`[DB] Error reading ${filename}:`, e);
            return [];
        }
    } else {
        // Local File System
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) return [];
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { return []; }
    }
};

// Save Data (Write to DB -> Write to File as backup)
const saveData = async (filename, data) => {
    // 1. Write to DB (Priority)
    if (isMongoConnected) {
        try {
            await FileModel.findOneAndUpdate(
                { filename },
                { filename, content: data },
                { upsert: true, new: true }
            );
        } catch (e) {
            console.error(`[DB] Error writing ${filename}:`, e);
        }
    }

    // 2. Always write to local file (for backup or if DB fails/is missing)
    try {
        const filePath = path.join(DATA_DIR, filename);
        // Ensure directory exists again just in case
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`[FS] Error writing local file ${filename}:`, e);
    }
};


// --- Initialization ---

const INITIAL_USERS = [
    { id: '1', username: 'chana19', password: 'chana19', name: 'Admin (Chana)', role: 'Admin', isActive: true }
];

const initData = async () => {
    console.log('[Server] Initializing Data...');
    let users = await getData(USERS_FILE);
    if (!Array.isArray(users)) users = [];

    let changed = false;
    const adminIndex = users.findIndex(u => u.username === 'chana19');

    if (adminIndex === -1) {
        console.log('[Server] Admin user missing. Recreating...');
        users.push(INITIAL_USERS[0]);
        changed = true;
    } else {
        if (users[adminIndex].role !== 'Admin') {
            console.log('[Server] Fixing Admin Role...');
            users[adminIndex] = { ...users[adminIndex], role: 'Admin' };
            changed = true;
        }
    }

    if (users.length === 0) {
        console.log('[Server] Seeding default users...');
        users = INITIAL_USERS;
        changed = true;
    }

    if (changed) {
        await saveData(USERS_FILE, users);
    }
};

// Run init immediately (will run again if DB connects)
initData();


// --- Endpoints (Converted to Async) ---

// 1. Get Local IP
app.get('/api/server-ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    let ip = '';
    for (const dev in interfaces) {
        for (const details of interfaces[dev]) {
            if (details.family === 'IPv4' && !details.internal) {
                ip = details.address;
                break;
            }
        }
    }
    res.json({ ip: ip || 'localhost', port: PORT });
});

// 2. Register/Update Device
app.post('/api/devices', async (req, res) => {
    const { id, name, apiKey } = req.body;
    let devices = await getData(DEVICES_FILE);

    const index = devices.findIndex(d => d.id === id);
    const newDevice = {
        id: id || Date.now().toString(),
        name,
        ip: req.body.ip,
        apiKey: (apiKey !== undefined) ? apiKey : ('ACT-' + Math.random().toString(36).substr(2, 9).toUpperCase()),
        status: 'ONLINE',
        lastHeartbeat: new Date().toISOString()
    };

    if (index >= 0) {
        devices[index] = { ...devices[index], ...newDevice };
    } else {
        devices.push(newDevice);
    }

    await saveData(DEVICES_FILE, devices);
    res.json(newDevice);
});

app.get('/api/devices', async (req, res) => {
    res.json(await getData(DEVICES_FILE));
});

app.delete('/api/devices/:id', async (req, res) => {
    const { id } = req.params;
    let devices = await getData(DEVICES_FILE);
    const initialLength = devices.length;
    devices = devices.filter(d => d.id !== id);

    if (devices.length < initialLength) {
        await saveData(DEVICES_FILE, devices);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Device not found' });
    }
});

// 3. Receive Attendance
app.post('/api/attendance/upload', async (req, res) => {
    console.log('Received Attendance Data:', req.body);
    const incoming = req.body;
    let logs = await getData(ATTENDANCE_FILE);

    const records = Array.isArray(incoming) ? incoming : [incoming];
    const newLogs = records.map(r => ({
        id: Date.now() + Math.random().toString(),
        raw: r,
        receivedAt: new Date().toISOString()
    }));

    logs = [...newLogs, ...logs];
    await saveData(ATTENDANCE_FILE, logs);

    res.status(200).send('OK');
});

// 4. Proxy/Control Device
app.post('/api/proxy-device', async (req, res) => {
    // Note: This likely won't work on Cloud unless via tunnel, but code remains valid.
    const { deviceIp, apiKey, cmd, payload, mid } = req.body;

    if (!deviceIp) return res.status(400).json({ result: 'Error', payload: { code: 'missing_ip' } });

    const url = `http://${deviceIp}/control?api_key=${apiKey || ''}`;
    const requestBody = { mid: mid || Date.now().toString(), cmd: cmd || 'GetUserInfo', payload: payload || {} };

    try {
        console.log(`[Proxy] Sending to ${url}:`, JSON.stringify(requestBody));
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Timeout

        console.log(`[Proxy] Sending to ${url}:`, JSON.stringify(requestBody));
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const text = await response.text();
        try {
            const responseData = JSON.parse(text);
            res.json(responseData);
        } catch (e) {
            console.warn(`[Proxy] Non-JSON response from ${deviceIp}:`, text);
            res.status(response.ok ? 200 : 400).json({
                mid: requestBody.mid,
                result: 'Error',
                payload: { code: 'device_error', details: text }
            });
        }
    } catch (error) {
        console.error(`[Proxy] Error communicating with ${deviceIp}:`, error.message);
        res.status(502).json({
            mid: requestBody.mid,
            result: 'Error',
            payload: { code: 'connection_failed', details: error.message }
        });
    }
});

app.get('/api/attendance', async (req, res) => {
    res.json(await getData(ATTENDANCE_FILE));
});

// 5. User Management
app.get('/api/users', async (req, res) => {
    res.json(await getData(USERS_FILE));
});

// 5b. Employee Management
app.get('/api/employees', async (req, res) => {
    res.json(await getData(EMPLOYEES_FILE));
});

app.post('/api/employees/sync', async (req, res) => {
    const incoming = req.body;
    if (!Array.isArray(incoming)) return res.status(400).send('Expected array');

    let current = await getData(EMPLOYEES_FILE);
    const map = new Map(current.map(e => [e.id, e]));

    incoming.forEach(e => {
        if (e.id) map.set(e.id, { ...map.get(e.id), ...e, lastSync: new Date().toISOString() });
    });

    const updated = Array.from(map.values());
    await saveData(EMPLOYEES_FILE, updated);
    res.json({ success: true, count: updated.length });
});

// Deprecated User Sync
app.post('/api/users/sync', async (req, res) => {
    const incomingUsers = req.body;
    let currentUsers = await getData(USERS_FILE);
    const userMap = new Map(currentUsers.map(u => [u.id, u]));

    incomingUsers.forEach(u => {
        if (u.id) userMap.set(u.id, { ...userMap.get(u.id), ...u, lastSync: new Date().toISOString() });
    });

    const updatedUsers = Array.from(userMap.values());
    await saveData(USERS_FILE, updatedUsers);
    res.json({ success: true, count: updatedUsers.length });
});

// --- Backup & Restore ---
// --- Backup & Restore ---
const BACKUP_KEYS = [
    'devices', 'users', 'attendance', 'employees',
    'products', 'stock', 'transactions', 'pos',
    'customers', 'sessions', 'whitelist', 'messages',
    'customer_products', 'tasks', 'worklogs'
];

app.get('/api/backup', async (req, res) => {
    try {
        const backupData = {};
        for (const key of BACKUP_KEYS) {
            // Special handling for legacy file maps vs new generic files
            // Most match generic 'key.json' pattern except the originals
            let filename = `${key}.json`;
            // 'users', 'devices', 'attendance', 'employees' match this pattern too

            backupData[key] = await getData(filename);
        }

        // Set Headers for Download
        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Disposition', `attachment; filename="ACT_Backup_${date}.json"`);
        res.setHeader('Content-Type', 'application/json');

        res.json(backupData);
    } catch (e) {
        res.status(500).json({ error: 'Backup failed', details: e.message });
    }
});

app.post('/api/restore', async (req, res) => {
    try {
        const backup = req.body;
        if (!backup || typeof backup !== 'object') return res.status(400).send('Invalid backup format');

        let restoreCount = 0;
        for (const key of BACKUP_KEYS) {
            if (Array.isArray(backup[key])) {
                await saveData(`${key}.json`, backup[key]);
                restoreCount++;
            }
        }

        console.log(`[API] Restored ${restoreCount} modules from backup`);
        res.json({ success: true, message: `Restored ${restoreCount} modules successfully.` });
    } catch (e) {
        console.error('Restore Error:', e);
        res.status(500).json({ error: 'Restore failed', details: e.message });
    }
});

// --- 6. Generic Data CRUD ---
app.get('/api/data/:key', async (req, res) => {
    const { key } = req.params;
    const safeKey = key.replace(/[^a-z0-9_-]/gi, '');
    const filename = `${safeKey}.json`;
    res.json(await getData(filename));
});

app.post('/api/data/:key', async (req, res) => {
    const { key } = req.params;
    const safeKey = key.replace(/[^a-z0-9_-]/gi, '');
    const filename = `${safeKey}.json`;

    const data = req.body;
    await saveData(filename, data);

    res.json({ success: true, count: Array.isArray(data) ? data.length : 1 });
});

// --- Frontend Fallback (SPA) ---
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).send('API Endpoint Not Found');
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built. Please run npm run build.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`ACT Server running on Port ${PORT}`);
    if (isMongoConnected) console.log('Mode: Cloud (MongoDB Atlas)');
    else console.log('Mode: Local (JSON Files)');
});

// Secondary Port (Optional)
const PORT_DEVICE = 5005;
app.listen(PORT_DEVICE, '0.0.0.0', () => {
    console.log(`Secondary Server listening on port ${PORT_DEVICE}`);
});
