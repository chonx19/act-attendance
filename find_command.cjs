const http = require('http');

console.log('--- Deli Command Discovery ---');
console.log('Target: 192.168.1.3');
console.log('API Key: "" (Empty)');

// Dictionary of potential commands
const commandList = [
    // Common ZK/Deli
    'GetOptions', 'SetOptions',
    'GetSysOption', 'SetSysOption',
    'GetNetwork', 'SetNetwork',
    'GetNet', 'SetNet',
    'GetNetConfig', 'SetNetConfig',
    'GetDevice', 'SetDevice',
    'GetComm', 'SetComm',

    // Generic
    'GetConfig', 'SetConfig',
    'GetParam', 'SetParam',
    'GetInfo', 'SetInfo',
    'Update', 'Save',
    'Set', 'Get',

    // Cloud specific
    'GetCloud', 'SetCloud',
    'GetServer', 'SetServer',

    // Misc
    'Reboot', 'Restart',
    'GetAttLog'
];

async function tryCommand(cmdName) {
    return new Promise((resolve) => {
        // Payload doesn't matter much if we just want to check if command exists
        // But for "Set" commands, usually they need an object.
        const data = JSON.stringify({
            "mid": Date.now().toString(),
            "cmd": cmdName,
            "payload": { "ServerUrl": "http://test" }
        });

        const options = {
            hostname: '192.168.1.3',
            port: 80,
            path: '/control?api_key=', // Empty Key
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
            res.on('end', () => resolve({ cmd: cmdName, status: res.statusCode, body }));
        });

        req.on('error', e => resolve({ cmd: cmdName, error: e.message }));
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log(`Testing ${commandList.length} commands...\n`);

    for (const cmd of commandList) {
        process.stdout.write(`Cmd: ${cmd.padEnd(15)} `);

        const res = await tryCommand(cmd);

        if (res.error) {
            console.log(`-> Error (${res.error})`);
        } else {
            if (res.body.includes('unknown_command')) {
                console.log(`-> Unknown`);
            } else {
                // If NOT unknown_command, it means the command IS valid!
                console.log(`-> !!! VALID !!! (Response: ${res.body.substring(0, 50)}...)`);
            }
        }
    }
    console.log('\n--- Discovery Complete ---');
}

run();
