const http = require('http');

console.log('--- Deli Command Discovery v2 ---');
console.log('Target: 192.168.1.3');
console.log('API Key: "" (Empty)');

// Dictionary of potential commands (Broad Search)
const commandList = [
    // Control Test (Known Working)
    'GetVersionInfo',

    // ZK / Deli Variants
    'SetSysParam', 'GetSysParam',
    'SetDeviceParam', 'GetDeviceParam',
    'SetNetConfig', 'GetNetConfig',
    'SetOption', 'GetOption', // Singular
    'SetConfig', 'GetConfig',
    'SetParams', 'GetParams',

    // Generic Actions
    'Update', 'Save', 'Apply',
    'Set', 'Get',
    'Modify', 'Change',

    // Specific Targets
    'SetCloud', 'GetCloud',
    'SetServer', 'GetServer',
    'SetHost', 'GetHost',
    'SetURL', 'GetURL',

    // Legacy / Other
    'Info', 'Status', 'Ping',
    'Reboot', 'Restart'
];

async function tryCommand(cmdName) {
    return new Promise((resolve) => {
        // Payload: Some commands require specific payload structure to even be recognized
        // Try sending a generic "Option" payload
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
        process.stdout.write(`Cmd: ${cmd.padEnd(20)} `);

        const res = await tryCommand(cmd);

        if (res.error) {
            console.log(`-> Error (${res.error})`);
        } else {
            // Known Response for successful GetVersionInfo
            if (cmd === 'GetVersionInfo' && res.body.includes('VersionInfo')) {
                console.log(`-> (CONTROL PASSED) - API Reached!`);
            }
            else if (res.body.includes('unknown_command')) {
                console.log(`-> Unknown`);
            } else {
                // If Not 'unknown_command', it's interesting!
                // It might be a Parameter Error, Auth Error (on specific command), or Success
                console.log(`-> !!! VALID !!! (Status: ${res.status}, Body: ${res.body.substring(0, 80)}...)`);
            }
        }
    }
    console.log('\n--- Discovery Complete ---');
}

run();
