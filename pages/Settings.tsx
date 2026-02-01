import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useInventory } from '../contexts/InventoryContext';
import { Save, Download, Upload, Lock, Shield, Globe, Users, Trash2, Plus, Edit } from 'lucide-react';
import { UserRole, User, PERMISSIONS } from '../types';

const SERVER_URL = '/api';

const Settings = () => {
    const { t, language, setLanguage } = useLanguage();
    const { users, saveUser, deleteUser } = useInventory();

    // Auth State
    const [pin, setPin] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // User Mgmt State
    const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.USER, isActive: true });
    const [showAddUser, setShowAddUser] = useState(false);

    useEffect(() => {
        const savedPin = localStorage.getItem('admin_pin');
        if (!savedPin) setIsAuthenticated(true);
    }, []);

    const handleSetPin = () => {
        if (!pin) return;
        localStorage.setItem('admin_pin', pin);
        alert(t('success'));
        setPin('');
        setIsAuthenticated(true);
    };

    const handleLogin = () => {
        const savedPin = localStorage.getItem('admin_pin');
        if (enteredPin === savedPin) setIsAuthenticated(true);
        else alert(t('error'));
    };

    const handleBackup = async () => {
        try { window.open(`${SERVER_URL}/backup`, '_blank'); } catch (e) { alert(t('error')); }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        if (!confirm(t('restoreWarning'))) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const res = await fetch(`${SERVER_URL}/restore`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(json)
                });
                if (res.ok) alert(t('success')); else alert(t('error'));
            } catch (err) { alert('Invalid File'); }
        };
        reader.readAsText(file);
    };

    const HandleAddUser = async () => {
        if (!newUser.username || !newUser.password || !newUser.name) return alert('Fill all fields');
        await saveUser({
            ...newUser,
            id: newUser.id || Date.now().toString(),
        } as User);
        setNewUser({ role: UserRole.USER, isActive: true });
        setShowAddUser(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-md text-center">
                    <Lock className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold dark:text-white mb-4">{t('enterPin')}</h2>
                    <input type="password" value={enteredPin} onChange={e => setEnteredPin(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border p-3 rounded-lg mb-4 text-center text-2xl font-bold" />
                    <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors">Unlock</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                {t('settings')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> {t('language')}</h3>
                    <div className="flex gap-4">
                        <button onClick={() => setLanguage('th')} className={`flex-1 py-3 rounded-lg font-bold border-2 ${language === 'th' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>ไทย</button>
                        <button onClick={() => setLanguage('en')} className={`flex-1 py-3 rounded-lg font-bold border-2 ${language === 'en' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>English</button>
                    </div>
                </div>

                {/* Admin PIN */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> {t('adminPin')}</h3>
                    <div className="flex gap-2">
                        <input type="password" placeholder={t('setPin')} value={pin} onChange={e => setPin(e.target.value)} className="flex-1 bg-gray-50 dark:bg-slate-900 border rounded-lg p-2 dark:text-white" />
                        <button onClick={handleSetPin} className="bg-indigo-600 text-white px-4 rounded-lg font-bold">{t('save')}</button>
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><Users className="w-5 h-5" /> User Management</h3>
                        <button onClick={() => setShowAddUser(!showAddUser)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                            <Plus className="w-4 h-4" /> Add User
                        </button>
                    </div>

                    {showAddUser && (
                        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in-down">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Username</label>
                                <input type="text" value={newUser.username || ''} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="w-full border rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Password</label>
                                <input type="text" value={newUser.password || ''} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full border rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                                <input type="text" value={newUser.name || ''} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full border rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Position/Group</label>
                                <input type="text" value={newUser.position || ''} onChange={e => setNewUser({ ...newUser, position: e.target.value })} className="w-full border rounded p-2 text-sm" placeholder="e.g. Employee, Kid" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Role</label>
                                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })} className="w-full border rounded p-2 text-sm">
                                    <option value={UserRole.ADMIN}>Admin (Full Access)</option>
                                    <option value={UserRole.USER}>User (Custom Access)</option>
                                    <option value={UserRole.CUSTOMER}>Customer</option>
                                </select>
                            </div>

                            {/* Permission Selector */}
                            {newUser.role === UserRole.USER && (
                                <div className="md:col-span-4 bg-white p-3 rounded border mt-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Allowed Menus:</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {Object.values(PERMISSIONS).map(perm => (
                                            <label key={perm} className="flex items-center space-x-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newUser.permissions?.includes(perm) || false}
                                                    onChange={e => {
                                                        const current = newUser.permissions || [];
                                                        if (e.target.checked) setNewUser({ ...newUser, permissions: [...current, perm] });
                                                        else setNewUser({ ...newUser, permissions: current.filter(p => p !== perm) });
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="capitalize">{perm.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={HandleAddUser} className="bg-green-600 text-white p-2 rounded text-sm font-bold md:col-span-4 mt-2">
                                {newUser.id ? 'Update User' : 'Save New User'}
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b dark:border-slate-700 text-gray-500 text-sm">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Username</th>
                                    <th className="p-2">Role</th>
                                    <th className="p-2">Last Login</th>
                                    <th className="p-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="p-2 font-medium dark:text-white">{u.name}</td>
                                        <td className="p-2 text-gray-600 dark:text-gray-300">{u.username}</td>
                                        <td className="p-2"><span className={`text-xs px-2 py-1 rounded-full font-bold ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                                        <td className="p-2 text-xs text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}</td>
                                        <td className="p-2 text-right">
                                            {u.username !== 'chana19' && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => {
                                                        setNewUser(u);
                                                        setShowAddUser(true);
                                                    }} className="text-blue-500 hover:text-blue-700 p-1"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Data Backup */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 md:col-span-2">
                    <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Save className="w-5 h-5" /> Data Backup & Restore</h3>
                    <div className="flex gap-4">
                        <button onClick={handleBackup} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors"><Download className="w-5 h-5" /> {t('backupData')}</button>
                        <div className="relative">
                            <input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors pointer-events-none"><Upload className="w-5 h-5" /> {t('restoreData')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;