import React, { useState, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { Server, Monitor, Plus, Trash2, Wifi, WifiOff, RefreshCw, Copy, Check, Activity, Globe, Edit } from 'lucide-react';
import { Device } from '../types';

const SERVER_URL = '/api';

const Devices = () => {
    const { user } = useAuth();
    const [devices, setDevices] = useState<Device[]>([]);
    const [serverIp, setServerIp] = useState('Loading...');
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceIp, setNewDeviceIp] = useState('');
    const [newDeviceApiKey, setNewDeviceApiKey] = useState('');

    // Testing State
    const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<any>(null);

    const fetchServerInfo = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/server-ip`);
            const data = await res.json();
            setServerIp(data.ip);
        } catch (e) {
            setServerIp('Server Not Running');
        }
    };

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/devices`);
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
            }
        } catch (e) {
            console.error('Failed to fetch devices');
        }
    };

    useEffect(() => {
        fetchServerInfo();
        fetchDevices();
        const interval = setInterval(fetchDevices, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload: any = {
                name: newDeviceName,
                ip: newDeviceIp,
                apiKey: newDeviceApiKey
            };
            if (editingDeviceId) payload.id = editingDeviceId;

            const res = await fetch(`${SERVER_URL}/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setNewDeviceName('');
                setNewDeviceIp('');
                setNewDeviceApiKey('');
                setEditingDeviceId(null);
                setOpenModal(false);
                fetchDevices();
            } else {
                const errText = await res.text();
                alert(`Server Error: ${res.status} ${res.statusText}\n${errText}`);
            }
        } catch (e) {
            alert(`Failed to save device. Check if server is running.\nError: ${e instanceof Error ? e.message : 'Unknown'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (device: Device) => {
        setEditingDeviceId(device.id);
        setNewDeviceName(device.name);
        setNewDeviceIp(device.ip || '');
        setNewDeviceApiKey(device.apiKey || '');
        setOpenModal(true);
    };

    const handleTestConnection = async (device: Device) => {
        if (!device.ip) {
            alert('Device has no IP address configured.');
            return;
        }
        setTestingDeviceId(device.id);
        setTestResult(null);

        try {
            const res = await fetch(`${SERVER_URL}/proxy-device`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceIp: device.ip,
                    apiKey: device.apiKey,
                    cmd: 'GetUserInfo', // Test Command
                    payload: {}
                })
            });
            const data = await res.json();
            setTestResult(data);
        } catch (e) {
            setTestResult({ result: 'Error', payload: { details: 'Failed to contact server' } });
        } finally {
            setTestingDeviceId(null);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Server className="w-8 h-8 text-blue-600" />
                        Device Management (Control Mode)
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Control Face Scan devices via HTTP Protocol.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-gray-400 uppercase">Server Status</div>
                    <div className={`text-lg font-mono font-bold ${serverIp.includes('Running') ? 'text-red-500' : 'text-green-500'} flex items-center justify-end gap-2`}>
                        {serverIp.includes('Running') ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        {serverIp !== 'Server Not Running' ? `http://${window.location.hostname}:3001` : 'Offline'}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div onClick={() => {
                    setEditingDeviceId(null);
                    setNewDeviceName('');
                    setNewDeviceIp('');
                    setNewDeviceApiKey('');
                    setOpenModal(true);
                }} className="bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 transition-all h-auto min-h-[250px] group">
                    <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Add Device</h3>
                </div>

                {devices.map(device => (
                    <div key={device.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex flex-col relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <Monitor className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{device.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Globe className="w-3 h-3" />
                                        {device.ip || 'No IP Configured'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(device); }}
                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                    title="Edit Device"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this device?')) {
                                            try {
                                                const res = await fetch(`${SERVER_URL}/devices/${device.id}`, { method: 'DELETE' });
                                                if (res.ok) {
                                                    fetchDevices();
                                                } else {
                                                    const errText = await res.text();
                                                    alert(`Failed to delete: ${res.status} ${res.statusText}\n${errText}`);
                                                }
                                            } catch (err) { alert(`Error deleting device: ${err instanceof Error ? err.message : 'Unknown'}`); }
                                        }
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete Device"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">API Key</label>
                                <div className="font-mono text-sm dark:text-gray-300 bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded border border-gray-100 dark:border-slate-700 truncate">
                                    {device.apiKey}
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-lg p-3 overflow-hidden">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400 font-bold uppercase">Test Connection</span>
                                    <button
                                        onClick={() => handleTestConnection(device)}
                                        disabled={testingDeviceId === device.id || !device.ip}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {testingDeviceId === device.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                                        Test (GetUserInfo)
                                    </button>
                                </div>
                                <div className="font-mono text-xs text-green-400 whitespace-pre-wrap h-24 overflow-y-auto">
                                    {testResult && testingDeviceId === null && device.id === testResult?.mid /* Showing result only if ID matches? - Simplified logic: */}
                                    {/* Actually we store generic result. For simplicity, just show last result in ALL cards or specific one? Let's use local state for result per card if complex. For now, just global result */}
                                    {testingDeviceId === device.id ? 'Testing...' : (
                                        testResult ? JSON.stringify(testResult, null, 2) : '// Click Test to verify'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Advanced Command Console */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mt-8">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-500" />
                    Advanced Command Console
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target Device</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white"
                                onChange={e => {
                                    const dev = devices.find(d => d.id === e.target.value);
                                    if (dev) setTestingDeviceId(dev.id);
                                }}
                                value={testingDeviceId || ''}
                            >
                                <option value="">-- Select Device --</option>
                                {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>)}
                            </select>
                        </div>

                        {/* Templates Dropdown */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quick Command Template</label>
                            <select
                                className="w-full bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-lg p-3 text-indigo-700 dark:text-indigo-300 font-bold"
                                onChange={(e) => {
                                    const cmd = e.target.value;
                                    const inputCmd = document.getElementById('customCmd') as HTMLInputElement;
                                    const inputPayload = document.getElementById('customPayload') as HTMLTextAreaElement;

                                    if (cmd === 'GetUserInfo') {
                                        inputCmd.value = 'GetUserInfo';
                                        inputPayload.value = JSON.stringify({ id: "1" }, null, 2);
                                    } else if (cmd === 'SetUserInfo') {
                                        inputCmd.value = 'SetUserInfo';
                                        inputPayload.value = JSON.stringify({ id: "1", name: "User", privilege: "user", password: "123" }, null, 2);
                                    } else if (cmd === 'DeleteUserInfo') {
                                        inputCmd.value = 'DeleteUserInfo';
                                        inputPayload.value = JSON.stringify({ id: "1" }, null, 2);
                                    } else if (cmd === 'GetUserIdList') {
                                        inputCmd.value = 'GetUserIdList';
                                        inputPayload.value = JSON.stringify({ start_pos: 0 }, null, 2);
                                    } else if (cmd === 'GetAttendLog') {
                                        inputCmd.value = 'GetAttendLog';
                                        inputPayload.value = JSON.stringify({ start_pos: 0 }, null, 2);
                                    } else if (cmd === 'EraseAttendLog') {
                                        inputCmd.value = 'EraseAttendLog';
                                        inputPayload.value = JSON.stringify({ end_pos: 10 }, null, 2);
                                    } else if (cmd === 'LockDevice') {
                                        inputCmd.value = 'LockDevice';
                                        inputPayload.value = JSON.stringify({ is_locked: "yes" }, null, 2);
                                    } else if (cmd === 'UnlockDevice') {
                                        inputCmd.value = 'LockDevice';
                                        inputPayload.value = JSON.stringify({ is_locked: "no" }, null, 2);
                                    } else if (cmd === 'BeginEnrollFace') {
                                        inputCmd.value = 'BeginEnrollFace';
                                        inputPayload.value = '{}';
                                    } else if (cmd === 'BeginEnrollFP') {
                                        inputCmd.value = 'BeginEnrollFP';
                                        inputPayload.value = '{}';
                                    } else if (cmd === 'CancelAllJobs') {
                                        inputCmd.value = 'CancelAllJobs';
                                        inputPayload.value = '{}';
                                    } else if (cmd === 'GetDeviceTime') {
                                        inputCmd.value = 'GetDeviceTime';
                                        inputPayload.value = '{}';
                                    } else if (cmd === 'SetDeviceTime') {
                                        inputCmd.value = 'SetDeviceTime';
                                        inputPayload.value = JSON.stringify({ time: new Date().toISOString().split('.')[0] }, null, 2);
                                    } else if (cmd === 'GetNetworkConfig') {
                                        inputCmd.value = 'GetNetworkConfig';
                                        inputPayload.value = '{}';
                                    } else if (cmd === 'GetVersionInfo') {
                                        inputCmd.value = 'GetVersionInfo';
                                        inputPayload.value = '{}';
                                    } else if (cmd === 'Internal_OpenDoor') {
                                        // Some devices use 'DeviceControl' -> 'OpenDoor' but docs didn't explicitly show simple OpenDoor. 
                                        // Based on common SDKs, it might be DeviceControl. Let's try a generic or custom placeholder if not in doc.
                                        // Doc has 'DeviceControl' header but no specific command example in snippet provided? 
                                        // Wait, line 63 says 'DeviceControl'. It might be a category.
                                        // Let's stick to what is in docs primarily.
                                        inputCmd.value = 'DeviceControl';
                                        inputPayload.value = JSON.stringify({ type: "OpenDoor" }, null, 2); // Guessing payload based on common structure
                                    } else if (cmd === 'ConfigAttendLogUploader') {
                                        inputCmd.value = 'ConfigAttendLogUploader';
                                        // Use current window location hostname if serverIp is localhost/loading, or best guess
                                        // But we assume the user likely knows or serverIp state is populated.
                                        // Actually serverIp state variable is available in scope? Yes.
                                        const currentIp = serverIp.includes('Running') ? window.location.hostname : serverIp;
                                        inputPayload.value = JSON.stringify({
                                            target_uri: `http://${currentIp}:3001/api/attendance/upload`,
                                            interval: 10
                                        }, null, 2);
                                    }
                                }}
                            >
                                <option value="">-- Select a Command Template --</option>
                                <optgroup label="Configuration">
                                    <option value="ConfigAttendLogUploader">Auto-Config Server URL (Upload)</option>
                                </optgroup>
                                <optgroup label="User Management">
                                    <option value="GetUserIdList">Get User ID List</option>
                                    <option value="GetUserInfo">Get User Info</option>
                                    <option value="SetUserInfo">Set/Add User Info</option>
                                    <option value="DeleteUserInfo">Delete User</option>
                                </optgroup>
                                <optgroup label="Attendance & Logs">
                                    <option value="GetAttendLog">Get Attendance Logs</option>
                                    <option value="EraseAttendLog">Erase Attendance Logs</option>
                                </optgroup>
                                <optgroup label="Device Control">
                                    <option value="LockDevice">Lock Device</option>
                                    <option value="UnlockDevice">Unlock Device</option>
                                    <option value="GetDeviceTime">Get Device Time</option>
                                    <option value="SetDeviceTime">Set Device Time (Sync)</option>
                                    <option value="GetNetworkConfig">Get Network Config</option>
                                    <option value="GetVersionInfo">Get Version Info</option>
                                </optgroup>
                                <optgroup label="Remote Enrollment">
                                    <option value="BeginEnrollFace">Enroll Face</option>
                                    <option value="BeginEnrollFP">Enroll Fingerprint</option>
                                    <option value="CancelAllJobs">Cancel All Jobs</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Command (cmd)</label>
                                <input
                                    type="text"
                                    id="customCmd"
                                    defaultValue="GetUserInfo"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message ID (mid)</label>
                                <input
                                    type="text"
                                    id="customMid"
                                    defaultValue="1"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white font-mono"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Payload (JSON)</label>
                            <textarea
                                id="customPayload"
                                defaultValue="{}"
                                className="w-full h-32 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white font-mono text-xs"
                            ></textarea>
                        </div>
                        <button
                            onClick={async () => {
                                const devId = testingDeviceId;
                                const dev = devices.find(d => d.id === devId);
                                if (!dev || !dev.ip) { alert('Please select a device with IP'); return; }

                                const cmdInput = (document.getElementById('customCmd') as HTMLInputElement).value;
                                const midInput = (document.getElementById('customMid') as HTMLInputElement).value;
                                const payloadInput = (document.getElementById('customPayload') as HTMLTextAreaElement).value;

                                try {
                                    const payloadJson = JSON.parse(payloadInput);

                                    const requestBody = {
                                        deviceIp: dev.ip,
                                        apiKey: dev.apiKey,
                                        cmd: cmdInput,
                                        mid: midInput,
                                        payload: payloadJson
                                    };

                                    setTestResult({
                                        status: 'Sending...',
                                        request: requestBody
                                    });

                                    const res = await fetch(`${SERVER_URL}/proxy-device`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(requestBody)
                                    });
                                    const data = await res.json();

                                    setTestResult(prev => ({
                                        ...prev,
                                        status: 'Completed',
                                        response: data
                                    }));
                                } catch (e) {
                                    alert('Invalid JSON Payload or Connection Error');
                                }
                            }}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md"
                        >
                            Send Command (mid: 1)
                        </button>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-4 flex flex-col">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2">Console Output (Request & Response)</label>
                        <div className="flex-1 overflow-auto font-mono text-xs text-green-400 whitespace-pre-wrap">
                            {testResult ? JSON.stringify(testResult, null, 2) : '// Request & Response will appear here...'}
                        </div>
                    </div>
                </div>
            </div>
            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{editingDeviceId ? 'Edit Device' : 'Add Device'}</h3>
                        <form onSubmit={handleRegister}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Device Name</label>
                                <input
                                    autoFocus type="text"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white"
                                    placeholder="e.g. Front Door"
                                    value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Device IP Address</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white font-mono"
                                    placeholder="e.g. 192.168.1.201"
                                    value={newDeviceIp} onChange={e => setNewDeviceIp(e.target.value)} required
                                />
                                <p className="text-xs text-gray-400 mt-1">IP of the device on the local network.</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 dark:text-white font-mono"
                                    placeholder="e.g. 123456"
                                    value={newDeviceApiKey} onChange={e => setNewDeviceApiKey(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave empty to auto-generate (for new devices).</p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400">Cancel</button>
                                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                                    {isLoading ? 'Saving...' : 'Save Device'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Devices;
