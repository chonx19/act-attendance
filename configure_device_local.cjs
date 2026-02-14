const http = require('http');
const os = require('os');

// 1. Detect Local IP
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const dev in interfaces) {
        for (const details of interfaces[dev]) {
            if (details.family === 'IPv4' && !details.internal && details.address.startsWith('192.168')) {
                return details.address;
            }
        }
    }
    return null;
}

const localIp = getLocalIp();
if (!localIp) {
    console.error('Error: Could not determine Local IP Address (must start with 192.168...)');
    process.exit(1);
}

const SERVER_URL = `http://${localIp}:3001/api/attendance/upload`;
const DEVICE_IP = process.argv[2] || '192.168.1.3'; // Allow passing IP as argument

console.log(`--- Configuring Device Attendance Sync ---`);
console.log(`Local Server IP detected: ${localIp}`);
console.log(`Target Sync URL: ${SERVER_URL}`);
console.log(`Target Device IP: ${DEVICE_IP}`);
console.log(`------------------------------------------`);

const payload = JSON.stringify({
    "mid": Date.now().toString(),
    "cmd": "ConfigAttendLogUploader",
    "payload": {
        "target_uri": SERVER_URL,
        "interval": 10
    }
});

const options = {
    hostname: DEVICE_IP,
    port: 80,
    path: '/control?api_key=',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    },
    timeout: 5000
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
        if (res.statusCode === 200) {
            console.log('\nSUCCESS: Device configured to sync with this computer!');
        } else {
            console.log('\nWARNING: Device returned an error.');
        }
    });
});

req.on('error', (e) => {
    console.error(`\nError connecting to device at ${DEVICE_IP}: ${e.message}`);
    console.error('Make sure the device is powered on and connected to the same network.');
});

req.write(payload);
req.end();
