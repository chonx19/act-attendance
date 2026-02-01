const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');

if (!fs.existsSync(USERS_FILE)) {
    console.log('No users file found.');
    process.exit(0);
}

const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const realUsers = [];
const employees = [];

const KNOWN_USERS = ['chana19', 'act123', 'employee', 'customer'];

users.forEach(u => {
    // Logic: If it has username/password AND is in known list or clearly a system user
    const isSystemUser = (u.username && u.password) || KNOWN_USERS.includes(u.username);

    // Check for Duplicate ID 1 (Admin)
    if (u.id === '1' && u.role === 'ADMIN') {
        // Skip the uppercase duplicate if we already have one, or fix it
        // Actually, we'll just reconstruct clean users
    }

    if (isSystemUser) {
        realUsers.push(u);
    } else {
        employees.push(u);
    }
});

// Remove duplicates from realUsers (keep last or first?)
// Let's filter unique by username
const uniqueUsers = [];
const seen = new Set();
realUsers.forEach(u => {
    if (!seen.has(u.username)) {
        // Fix Role Case
        if (u.role === 'ADMIN') u.role = 'Admin';
        if (u.role === 'USER') u.role = 'User';
        if (u.role === 'CUSTOMER') u.role = 'Customer';

        uniqueUsers.push(u);
        seen.add(u.username);
    }
});

// Save Files
fs.writeFileSync(USERS_FILE, JSON.stringify(uniqueUsers, null, 2));

// For Employees, we might already have some, so merge
let existingEmployees = [];
if (fs.existsSync(EMPLOYEES_FILE)) {
    try { existingEmployees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8')); } catch (e) { }
}
const allEmployees = [...existingEmployees, ...employees];
// Filter unique IDs for employees
const uniqueEmployeesMap = new Map();
allEmployees.forEach(e => uniqueEmployeesMap.set(e.id, e));
const finalEmployees = Array.from(uniqueEmployeesMap.values());

fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(finalEmployees, null, 2));

console.log(`Migration Complete.`);
console.log(`Users: ${uniqueUsers.length} (Saved to users.json)`);
console.log(`Employees: ${finalEmployees.length} (Saved to employees.json)`);
