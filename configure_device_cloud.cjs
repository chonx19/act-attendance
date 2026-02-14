// --- CLOUD CONFIGURATION SCRIPT ---
// Use this to configure the device to sync with the REMOTE CLOUD server.
// For local sync (using your computer's IP), use 'configure_device_local.cjs' instead.

const http = require('http');

const SERVER_URL = `https://act-and-r.site/api/attendance/upload`;
console.log(`Configuring Device 192.168.1.3 to sync DIRECTLY with Cloud: ${SERVER_URL}`);

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
