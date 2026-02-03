const http = require('http');

const targets = [
    { ip: '192.168.1.7', port: 80 },
    { ip: '192.168.1.3', port: 5005 },
    { ip: '192.168.1.3', port: 80 }
];

const checkUrl = (ip, port) => {
    return new Promise((resolve) => {
        const req = http.get(`http://${ip}:${port}/`, { timeout: 2000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const titleMatch = data.match(/<title>(.*?)<\/title>/i);
                const title = titleMatch ? titleMatch[1] : 'No Title';
                resolve({ ip, port, status: res.statusCode, title, bodySnippet: data.substring(0, 100) });
            });
        });

        req.on('error', (err) => resolve({ ip, port, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ip, port, error: 'Timeout' }); });
    });
};

async function run() {
    console.log('Probing devices...');
    for (const t of targets) {
        const res = await checkUrl(t.ip, t.port);
        console.log(`[${t.ip}:${t.port}] ->`, res.error ? `Error: ${res.error}` : `Status: ${res.status}, Title: "${res.title}"`);
    }
}

run();
