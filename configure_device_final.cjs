const http = require('http');

console.log('--- Finalizing Device Configuration (with Retries) ---');
console.log('Target: 192.168.1.3');
console.log('API Key: 1234');

const NEW_URL = 'http://funny-cat-99.loca.lt'; // Check if this matches your current tunnel!
console.log('Setting Server URL to: ' + NEW_URL);

async function setConfig(key) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (attempt > 1) console.log(`    Retry attempt ${attempt}...`);

            const result = await new Promise((resolve, reject) => {
                const data = JSON.stringify({
                    "mid": Date.now().toString(),
                    "cmd": "SetOptions",
                    "payload": { [key]: NEW_URL }
                });

                const options = {
                    hostname: '192.168.1.3',
                    port: 80,
                    path: '/control?api_key=1234',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
                    timeout: 5000
                };

                const req = http.request(options, (res) => {
                    let body = '';
                    res.on('data', d => body += d);
                    res.on('end', () => resolve({ key, status: res.statusCode, body }));
                });

                req.on('error', e => reject(e));
                req.write(data);
                req.end();
            });

            return result; // Success

        } catch (e) {
            if (attempt === 3) return { key, error: e.message }; // Failed after 3 tries
            console.log(`    Connection failed (${e.message}). Waiting 3s...`);
            await new Promise(r => setTimeout(r, 3000)); // Wait 3s
        }
    }
}

async function run() {
    // Try setting ALL common keys to be safe
    const keys = ['CloudServerUrl', 'ServerUrl', 'ADMSUrl'];

    for (const k of keys) {
        console.log(`Setting ${k}...`);
        const res = await setConfig(k);
        if (res.error) console.log(`  Error: ${res.error}`);
        else console.log(`  Result: ${res.status} - ${res.body}`);
    }

    console.log('\n--- Configuration Sent ---');
    console.log('Please RESTART the Deli Device now.');
}

run();
