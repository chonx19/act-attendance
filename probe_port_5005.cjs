const net = require('net');

const HOST = '192.168.1.3';
const PORT = 5005;

console.log(`Probing ${HOST}:${PORT}...`);

function testMessage(name, message) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        let received = false;

        client.connect(PORT, HOST, () => {
            console.log(`[${name}] Connected. Sending probe...`);
            client.write(message);
        });

        client.on('data', (data) => {
            console.log(`[${name}] RESPONSE: ${data.toString()} (Hex: ${data.toString('hex')})`);
            received = true;
            client.destroy();
            resolve(true);
        });

        client.on('close', () => {
            if (!received) console.log(`[${name}] Connection closed without data.`);
            resolve(false);
        });

        client.on('error', (err) => {
            console.log(`[${name}] Error: ${err.message}`);
            resolve(false);
        });

        // Timeout
        setTimeout(() => {
            if (!received) {
                console.log(`[${name}] Timeout.`);
                client.destroy();
                resolve(false);
            }
        }, 3000);
    });
}

async function run() {
    // 1. Try Plain Text (some simplified protocols)
    await testMessage('TEXT_HELLO', 'Hello\r\n');
    await testMessage('TEXT_CMD', 'GetVersion\r\n');

    // 2. Try ZK/Deli UDP/TCP Common Header (Old Protocol)
    // 50 50 82 7d ... (Command connect)
    // Note: This is an educated guess for ZK protocol widely used by Deli rebrands
    const zkConnect = Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x13, 0x00, 0x00, 0x00]);
    await testMessage('ZK_CONNECT', zkConnect);

    // 3. Try ADB-like handshake (CNXN) just in case
    const adbHandshake = Buffer.from('CNXN');
    await testMessage('ADB_PROBE', adbHandshake);

    console.log('Done.');
}

run();
