import React, { useState, useEffect } from 'react';
import { Calendar, Search, RefreshCw, Filter, User, Clock, Download, ChevronLeft, ChevronRight, Users, Edit, Save, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../contexts/LanguageContext';

const SERVER_URL = '/api';

interface AttendanceRecord {
    userId: string;
    name: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    status: 'Normal' | 'Late' | 'Absent' | 'Incomplete';
    lateMinutes: number;
    earlyLeaveMinutes: number;
    remark?: string;
}

const Attendance = () => {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncingUsers, setSyncingUsers] = useState(false);

    // Manual Edit State
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<{ id: string, name: string } | null>(null);

    // Date Range State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [exportMode, setExportMode] = useState<'daily' | 'range'>('daily');

    const [searchTerm, setSearchTerm] = useState('');

    // Summary calculation state
    const [rangeSummary, setRangeSummary] = useState<any[]>([]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [logsRes, usersRes, devsRes] = await Promise.all([
                fetch(`${SERVER_URL}/attendance`),
                fetch(`${SERVER_URL}/employees`),
                fetch(`${SERVER_URL}/devices`)
            ]);

            if (logsRes.ok) setLogs(await logsRes.json());
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(Array.isArray(usersData) ? usersData : []);
            }
            if (devsRes.ok) setDevices(await devsRes.json());
        } catch (e) {
            console.error('Fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ... (Sync Logic kept same, just shortened for brevity in this replace) ...
    // Since I'm overwriting, I must include full logic.


    // ...

    const handleSyncLogs = async () => {
        if (devices.length === 0) return alert('No devices found');
        setSyncing(true);
        let count = 0;
        for (const dev of devices) {
            if (!dev.ip) continue;
            try {
                // Incremental Sync: Use lastLogIndex if available
                const startPos = dev.lastLogIndex || 0;

                const res = await fetch(`${SERVER_URL}/proxy-device`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceIp: dev.ip, apiKey: dev.apiKey,
                        cmd: 'GetAttendLog', mid: Date.now().toString(), payload: { start_pos: startPos }
                    })
                });
                const data = await res.json();
                if (data.result === 'AttendLog' && data.payload?.logs?.length > 0) {
                    await fetch(`${SERVER_URL}/attendance/upload`, {
                        method: 'POST',
                        body: JSON.stringify(data.payload.logs),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const newCount = data.payload.logs.length;
                    count += newCount;

                    // Update Device lastLogIndex to avoid re-fetching
                    const updatedDevice = { ...dev, lastLogIndex: startPos + newCount };
                    await fetch(`${SERVER_URL}/devices`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedDevice)
                    });
                }
            } catch (e) { console.error('Sync Error', e); }
        }
        setSyncing(false);
        if (count > 0) {
            alert(`Synced ${count} new records.`);
            fetchAllData();
        } else {
            alert('No new records found.');
        }
    };

    const handleSyncUsers = async () => {
        if (devices.length === 0) return alert('No devices found');
        setSyncingUsers(true);
        let totalUsers = 0;
        for (const dev of devices) {
            if (!dev.ip) continue;
            try {
                const listRes = await fetch(`${SERVER_URL}/proxy-device`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceIp: dev.ip, apiKey: dev.apiKey,
                        cmd: 'GetUserIdList', mid: Date.now().toString(), payload: {}
                    })
                });
                const listData = await listRes.json();
                if (listData.result === 'UserIdList' && listData.payload?.user_id) {
                    const ids = listData.payload.user_id;
                    const userDetails = [];
                    for (let i = 0; i < ids.length; i += 5) {
                        const batch = ids.slice(i, i + 5);
                        const promises = batch.map((id: string) =>
                            fetch(`${SERVER_URL}/proxy-device`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    deviceIp: dev.ip, apiKey: dev.apiKey,
                                    cmd: 'GetUserInfo', mid: `user-${id}`, payload: { id }
                                })
                            }).then(r => r.json())
                        );
                        const results = await Promise.all(promises);
                        results.forEach(res => {
                            if (res.result === 'UserInfo' && res.payload) userDetails.push(res.payload);
                        });
                    }
                    if (userDetails.length > 0) {
                        await fetch(`${SERVER_URL}/employees/sync`, {
                            method: 'POST',
                            body: JSON.stringify(userDetails),
                            headers: { 'Content-Type': 'application/json' }
                        });
                        totalUsers += userDetails.length;
                    }
                }
            } catch (e) { }
        }
        setSyncingUsers(false);
        alert(`Synced info for ${totalUsers} users.`);
        fetchAllData();
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const res = await fetch(`${SERVER_URL}/employees/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([editingUser])
            });
            if (res.ok) {
                alert(t('success'));
                setShowUserModal(false);
                setEditingUser(null);
                await fetchAllData();
            } else {
                alert(`Server Error: ${res.status}`);
            }
        } catch (e) {
            alert(t('error'));
        }
    };

    const shiftDate = (days: number) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + days);
        const newDate = d.toISOString().split('T')[0];
        setStartDate(newDate);
        if (exportMode === 'range' && new Date(newDate) > new Date(endDate)) {
            setEndDate(newDate);
        }
    };

    const calculateReportForDate = (date: string) => {
        const report: AttendanceRecord[] = [];
        const userMap = new Map();
        users.forEach(u => userMap.set(u.id, u.name));
        logs.forEach(l => {
            const uid = l.raw?.user_id || l.user_id;
            if (!userMap.has(uid)) userMap.set(uid, `${t('unknown')} (ID: ${uid})`);
        });

        const dayLogs = logs.filter(l => {
            const t = l.raw?.time || l.time;
            return t && t.startsWith(date);
        });

        userMap.forEach((name, uid) => {
            const userLogs = dayLogs.filter(l => (l.raw?.user_id || l.user_id) === uid);
            userLogs.sort((a, b) => new Date(a.raw?.time || a.time).getTime() - new Date(b.raw?.time || b.time).getTime());

            let checkIn = userLogs.length > 0 ? (userLogs[0].raw?.time || userLogs[0].time) : null;
            let checkOut = userLogs.length > 1 ? (userLogs[userLogs.length - 1].raw?.time || userLogs[userLogs.length - 1].time) : null;

            const formatTime = (iso: string) => iso ? iso.split('T')[1].substring(0, 5) : null;
            const inTimeStr = checkIn ? formatTime(checkIn) : null;
            const outTimeStr = checkOut ? formatTime(checkOut) : null;

            let status: 'Normal' | 'Late' | 'Absent' | 'Incomplete' = 'Absent';
            let lateMinutes = 0;
            let earlyLeaveMinutes = 0;
            let remark = '';

            if (checkIn) {
                // status = 'Incomplete'; // Old logic
                const [inH, inM] = inTimeStr!.split(':').map(Number);
                const inTotalMinutes = inH * 60 + inM;
                const workStart = 8 * 60; // 08:00
                const workEnd = 17 * 60;  // 17:00

                // Determine Initial Status from Check-in
                if (inTotalMinutes > workStart) {
                    lateMinutes = inTotalMinutes - workStart;
                    remark += `${t('late')} ${lateMinutes}m. `;
                    status = 'Late';
                } else {
                    status = 'Normal';
                }

                let allowedEarlyLeave = 0;
                if (inTotalMinutes < workStart) {
                    const earlyArrival = workStart - inTotalMinutes;
                    allowedEarlyLeave = Math.min(30, earlyArrival);
                    if (allowedEarlyLeave > 0) remark += `Early Benefit -${allowedEarlyLeave}m. `;
                }

                if (checkOut) {
                    const [outH, outM] = outTimeStr!.split(':').map(Number);
                    const outTotalMinutes = outH * 60 + outM;
                    const targetOutMinutes = workEnd - allowedEarlyLeave + lateMinutes;

                    if (outTotalMinutes < targetOutMinutes) {
                        earlyLeaveMinutes = targetOutMinutes - outTotalMinutes;
                        const targetTime = `${Math.floor(targetOutMinutes / 60).toString().padStart(2, '0')}:${(targetOutMinutes % 60).toString().padStart(2, '0')}`;
                        remark += `Left Early ${earlyLeaveMinutes}m (Req: ${targetTime}).`;
                        // If left early, maybe change status? 
                        // For now keep Normal/Late based on Check-in, remark explains early leave.
                    } else {
                        if (status === 'Late') remark += ' (Time Covered)';
                        // else status = 'Normal'; // Already set
                    }
                } else {
                    // No Check-out yet
                    const isToday = date === new Date().toISOString().split('T')[0];
                    if (isToday) {
                        remark += 'Working...';
                    } else {
                        remark += 'No Check-out';
                        status = 'Incomplete'; // Only incomplete if it's a past date
                    }
                }
            }
            if (!checkIn && !users.find(u => u.id === uid)) return;
            report.push({ userId: uid, name, date, checkIn: inTimeStr, checkOut: outTimeStr, status, lateMinutes, earlyLeaveMinutes, remark });
        });
        return report.sort((a, b) => a.userId.localeCompare(b.userId));
    };

    // Recalculate Summary when needed
    useEffect(() => {
        if (exportMode === 'range') {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) return;

            const summaryMap = new Map<string, { id: string, name: string, present: number, late: number, absent: number }>();

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const dayReport = calculateReportForDate(dateStr);
                dayReport.forEach(r => {
                    if (!summaryMap.has(r.userId)) summaryMap.set(r.userId, { id: r.userId, name: r.name, present: 0, late: 0, absent: 0 });
                    const s = summaryMap.get(r.userId)!;
                    if (r.status === 'Normal' || r.status === 'Late' || r.status === 'Incomplete') s.present++;
                    if (r.status === 'Late') s.late++;
                    if (r.status === 'Absent') s.absent++;
                });
            }
            setRangeSummary(Array.from(summaryMap.values()));
        }
    }, [startDate, endDate, exportMode, logs, users]);

    const reportData = calculateReportForDate(startDate);

    // Filter Logic
    const [filterPosition, setFilterPosition] = useState('ALL');
    const positions = Array.from(new Set(users.map(u => u.position).filter(p => p))).sort();

    const filteredReport = reportData.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.userId.includes(searchTerm);
        const user = users.find(u => u.id === r.userId);
        const userPos = user?.position || 'Unassigned';
        const matchesPos = filterPosition === 'ALL' || userPos === filterPosition;
        return matchesSearch && matchesPos;
    }).sort((a, b) => a.userId.localeCompare(b.userId, undefined, { numeric: true, sensitivity: 'base' })); // Fixed: Natural Sort

    const filteredSummary = rangeSummary.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm);
        const user = users.find(u => u.id === r.id);
        const userPos = user?.position || 'Unassigned';
        const matchesPos = filterPosition === 'ALL' || userPos === filterPosition;
        return matchesSearch && matchesPos;
    }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })); // Fixed: Natural Sort

    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        if (exportMode === 'daily') {
            if (filteredReport.length === 0) return alert('No data');
            const wsData = filteredReport.map(r => ({
                "Date": r.date, "Day": new Date(r.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' }), "ID": r.userId, "Name": r.name, "Position": users.find(u => u.id === r.userId)?.position || '-', "In": r.checkIn || '-', "Out": r.checkOut || '-', "Status": r.status, "Note": r.remark
            }));
            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Daily");
            XLSX.writeFile(wb, `Daily_${startDate}.xlsx`);
        } else {
            // Re-calc full details for export
            const start = new Date(startDate);
            const end = new Date(endDate);
            const allRecords: any[] = [];

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' });
                const isWeekend = d.getDay() === 0 || d.getDay() === 6; // 0=Sun, 6=Sat

                // Get report for this day, then filter by position if selected
                const dayReport = calculateReportForDate(dateStr).filter(r => {
                    if (filterPosition === 'ALL') return true;
                    const user = users.find(u => u.id === r.userId);
                    return (user?.position || 'Unassigned') === filterPosition;
                });

                dayReport.sort((a, b) => a.userId.localeCompare(b.userId, undefined, { numeric: true, sensitivity: 'base' })).forEach(r => {
                    allRecords.push({
                        "Date": r.date,
                        "Day": dayName.toUpperCase(), // Explicit Day Column
                        "ID": r.userId,
                        "Name": r.name,
                        "Position": users.find(u => u.id === r.userId)?.position || '-',
                        "In": r.checkIn || '-',
                        "Out": r.checkOut || '-',
                        "Status": r.status,
                        "Note": r.remark + (isWeekend ? (d.getDay() === 0 ? ' (Sunday)' : ' (Saturday)') : '') // Hint for styling
                    });
                });
            }

            const summaryData = filteredSummary.map(s => ({
                "ID": s.id,
                "Name": s.name,
                "Position": users.find(u => u.id === s.id)?.position || '-',
                "Total Present": s.present,
                "Total Late": s.late,
                "Total Absent": s.absent
            }));

            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allRecords), "All Records");
            XLSX.writeFile(wb, `Summary_${startDate}_to_${endDate}.xlsx`);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-indigo-600" />
                        {exportMode === 'daily' ? t('dailyReport') : t('rangeReport')}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSyncUsers} disabled={syncingUsers} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-bold shadow-sm text-sm disabled:opacity-50">
                        <Users className={syncingUsers ? 'animate-spin' : ''} size={16} /> {t('syncNames')}
                    </button>
                    <button onClick={handleSyncLogs} disabled={syncing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-bold shadow-sm text-sm disabled:opacity-50">
                        <RefreshCw className={syncing ? 'animate-spin' : ''} size={16} /> {t('syncLogs')}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex-1 flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-500 uppercase">View Mode</label>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <input type="radio" checked={exportMode === 'daily'} onChange={() => setExportMode('daily')} className="w-4 h-4 text-blue-600" />
                            <span className="dark:text-white font-medium">{t('dailyReport')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="radio" checked={exportMode === 'range'} onChange={() => { setExportMode('range'); setEndDate(startDate); }} className="w-4 h-4 text-blue-600" />
                            <span className="dark:text-white font-medium">{t('rangeReport')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex gap-2 items-end">
                    <button onClick={() => shiftDate(-1)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 rounded-lg h-[42px]"><ChevronLeft className="w-5 h-5 dark:text-white" /></button>
                    <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">{t('startDate')}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border rounded-lg p-2 dark:text-white font-bold h-[42px]" />
                    </div>
                    <button onClick={() => shiftDate(1)} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 rounded-lg h-[42px]"><ChevronRight className="w-5 h-5 dark:text-white" /></button>

                    {exportMode === 'range' && (
                        <div className="flex-1 ml-2">
                            <label className="block text-xs text-gray-400 mb-1">{t('endDate')}</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border rounded-lg p-2 dark:text-white font-bold h-[42px]" />
                        </div>
                    )}
                </div>

                <div className="flex items-end">
                    <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors h-[42px]">
                        <Download className="w-5 h-5" /> {t('exportExcel')}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by Name, ID..."
                    className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                    value={filterPosition}
                    onChange={e => setFilterPosition(e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                    <option value="ALL">All Positions</option>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="Unassigned">Unassigned</option>
                </select>
            </div>

            {/* Content Table Switch */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-xs uppercase text-gray-500">
                                <th className="p-4">{t('employee')}</th>
                                <th className="p-4">{t('position')}</th>
                                {exportMode === 'daily' ? (
                                    <>
                                        <th className="p-4 text-center">{t('checkIn')}</th>
                                        <th className="p-4 text-center">{t('checkOut')}</th>
                                        <th className="p-4 text-center">{t('status')}</th>
                                        <th className="p-4">{t('remarks')}</th>
                                        <th className="p-4">{t('edit')}</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="p-4 text-center">{t('totalPresent')}</th>
                                        <th className="p-4 text-center">{t('totalLate')}</th>
                                        <th className="p-4 text-center">{t('totalAbsent')}</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {exportMode === 'daily' ? (
                                filteredReport.map(r => (
                                    <tr key={r.userId} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold dark:text-white">{r.name}</div>
                                            <div className="text-xs text-gray-400">ID: {r.userId}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {users.find(u => u.id === r.userId)?.position || '-'}
                                        </td>
                                        <td className={`p-4 text-center font-mono ${r.lateMinutes > 0 ? 'text-red-500 font-bold' : ''}`}>{r.checkIn || '-'}</td>
                                        <td className="p-4 text-center font-mono">{r.checkOut || '-'}</td>
                                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'Normal' ? 'bg-green-100 text-green-700' : r.status === 'Late' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{t(r.status.toLowerCase() as any) || r.status}</span></td>
                                        <td className="p-4 text-sm text-gray-500">{r.remark}</td>
                                        <td className="p-4">
                                            <button onClick={() => { setEditingUser({ id: r.userId, name: r.name.includes('Unknown') ? '' : r.name }); setShowUserModal(true); }}>
                                                <Edit className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredSummary.map(s => (
                                    <tr key={s.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold dark:text-white">{s.name}</div>
                                            <div className="text-xs text-gray-400">ID: {s.id}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {users.find(u => u.id === s.id)?.position || '-'}
                                        </td>
                                        <td className="p-4 text-center font-bold text-green-600">{s.present}</td>
                                        <td className="p-4 text-center font-bold text-red-500">{s.late}</td>
                                        <td className="p-4 text-center font-bold text-gray-500">{s.absent}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showUserModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-xl font-bold dark:text-white mb-4">{t('edit')} {t('employee')}</h3>
                        <form onSubmit={handleUpdateUser}>
                            <input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full bg-gray-100 dark:bg-slate-700 border rounded-lg p-3 dark:text-white mb-4" placeholder="Name..." autoFocus />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-500">{t('cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
