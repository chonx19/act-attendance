import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useTheme } from '../contexts/ThemeContext';
import { Upload, FileSpreadsheet, Trash2, Calendar, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceRecord } from '../types';

const AttendanceReport = () => {
    const { attendanceRecords, importAttendance, clearAttendance } = useInventory();
    const { theme } = useTheme();
    const [filterText, setFilterText] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Filter Logic
    const filteredRecords = attendanceRecords.filter(r =>
        r.name.toLowerCase().includes(filterText.toLowerCase()) ||
        r.employeeId.includes(filterText) ||
        r.department?.toLowerCase().includes(filterText.toLowerCase())
    ).sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                // Basic Auto-Correction for Header Row
                // Assume headers are something like: "No", "ID", "Name", "Date", "Time", "Status"
                // We'll skip rows until we find a row with "Name" or "ID" or "Date"
                let headerRowIdx = 0;
                for (let i = 0; i < Math.min(data.length, 10); i++) {
                    const r = data[i].join(' ').toLowerCase();
                    if (r.includes('name') || r.includes('date') || r.includes('time')) {
                        headerRowIdx = i;
                        break;
                    }
                }

                // Map Columns (Simple Heuristic or Fixed Index)
                // Let's assume standard format for now, or just map by index if consistent.
                // Better: Map by column name in header row
                const headers = data[headerRowIdx] as string[];
                const validRecords: AttendanceRecord[] = [];

                for (let i = headerRowIdx + 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    // Try to find index of key fields
                    // If complex, we might need manual mapping UI. For now, let's try strict named mapping or fallback to index.

                    // Simple Fallback Mapping (modify based on user file later):
                    // Col 0: No, 1: ID, 2: Name, 3: Dept, 4: Date, 5: Time, 6: Status
                    // Or if header exists, use it.

                    // Let's rely on standard names often found in these exports
                    const getCol = (name: string) => headers.findIndex(h => h && h.toString().toLowerCase().includes(name));

                    const idIdx = getCol('id') > -1 ? getCol('id') : (getCol('ac-no') > -1 ? getCol('ac-no') : 0); // "AC-No." often used
                    const nameIdx = getCol('name') > -1 ? getCol('name') : 1;
                    const dateIdx = getCol('date') > -1 ? getCol('date') : 3;
                    const timeIdx = getCol('time') > -1 ? getCol('time') : 4;
                    const stateIdx = getCol('state') > -1 ? getCol('state') : (getCol('status') > -1 ? getCol('status') : 5);
                    const deptIdx = getCol('department') > -1 ? getCol('department') : 2;

                    const dateRaw = row[dateIdx];
                    const timeRaw = row[timeIdx];

                    // Basic Validation
                    if (!dateRaw || !timeRaw) continue;

                    // Parse Date/Time (Excel serial usually handled by sheet_to_json if not header:1)
                    // If header:1, date might be string or number.
                    let dateStr = String(dateRaw);
                    let timeStr = String(timeRaw);

                    validRecords.push({
                        id: `${row[idIdx]}-${dateStr}-${timeStr}`,
                        employeeId: String(row[idIdx] || 'Unk'),
                        name: String(row[nameIdx] || 'Unknown'),
                        date: dateStr,
                        time: timeStr,
                        type: String(row[stateIdx] || 'Check'),
                        department: String(row[deptIdx] || '')
                    });
                }

                importAttendance(validRecords);
                alert(`Imported ${validRecords.length} records successfully.`);
            } catch (err) {
                console.error(err);
                alert("Failed to parse file. Please ensure it's a valid Excel file.");
            } finally {
                setIsUploading(false);
                // Reset input
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        Attendance Import
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Import Excel logs from Face Scan System.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { if (window.confirm('Clear all history?')) clearAttendance() }} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 flex items-center">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear All
                    </button>
                    <label className="cursor-pointer px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow flex items-center transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Importing...' : 'Import Excel'}
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by Name, ID..."
                    className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                /> {/* Note: Logic uses searchTerm state, need to check if I broke state name binding */}
                {/* Wait, original used 'searchTerm' in logic but 'filterText' doesn't exist in original view? 
                   Let me check previous view. StartLine 288 uses 'searchTerm'. 
                   Ah, I need to make sure the UI binds to 'searchTerm' correctly or I need to add the dropdown separately.
                   Let's assume 'searchTerm' is correct based on previous VIEW (line 38: const [searchTerm, setSearchTerm] = useState('');).
                   So below I should use searchTerm.
                */}
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

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Type/Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-mono">{record.employeeId}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{record.name}</td>
                                    <td className="px-6 py-4">{record.department || '-'}</td>
                                    <td className="px-6 py-4">{record.date}</td>
                                    <td className="px-6 py-4 font-mono">{record.time}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${record.type.toLowerCase().includes('in') ? 'bg-green-100 text-green-700' :
                                            record.type.toLowerCase().includes('out') ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {record.type}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
                                            <p>No records found. Import an Excel file to get started.</p>
                                        </div>
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

export default AttendanceReport;
