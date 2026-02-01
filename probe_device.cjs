const http = require('http');

const options = {
    hostname: '192.168.1.3',
    port: 80,
    path: '/',
    method: 'GET',
    timeout: 5000
};

console.log('Probing Device at http://192.168.1.3 ...');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('\n--- BODY RESPONSE START ---');
        console.log(data);
        console.log('--- BODY RESPONSE END ---\n');

        // Simple heuristic check
        if (data.includes('API key') || data.includes('Request JSON')) {
            console.log('>> DETECTED: Device seems to have a JSON API interface.');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
