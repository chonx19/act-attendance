const http = require('http');
const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const dev in interfaces) {
        for (const details of interfaces[dev]) {
            if (details.family === 'IPv4' && !details.internal && details.address.startsWith('192.168')) {
                return details.address;
            }
        }
    }
    return '';
}

const localIp = getLocalIp();
if (!localIp) {
    console.error('Could not determine Local IP');
    process.exit(1);
}

const SERVER_URL = `http://${localIp}:3001/api/attendance/upload`;
console.log(`Configuring Device 192.168.1.3 to sync with: ${SERVER_URL}`);

const payload = JSON.stringify({
    "mid": Date.now().toString(),
    "cmd": "ConfigAttendLogUploader",
    "payload": {
        "target_uri": SERVER_URL,
        "interval": 10
    }
});

const options = {
    hostname: '192.168.1.3',
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
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.write(payload);
req.end();
