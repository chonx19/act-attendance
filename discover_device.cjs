const net = require('net');
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
    return '192.168.1.1'; // Default fallback
}

const localIp = getLocalIp();
const subnet = localIp.split('.').slice(0, 3).join('.');
console.log(`Scanning subnet: ${subnet}.1 - ${subnet}.254 (My IP: ${localIp})`);

const checkPort = (ip, port, timeout = 300) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = null;

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            status = 'open';
            socket.destroy();
        });

        socket.on('timeout', () => {
            socket.destroy();
        });

        socket.on('error', () => {
            socket.destroy();
        });

        socket.on('close', () => {
            resolve(status);
        });

        socket.connect(port, ip);
    });
};

const checkHttp = (ip) => {
    return new Promise(resolve => {
        const req = http.get(`http://${ip}/`, { timeout: 1000 }, (res) => {
            resolve({ ip, title: 'Web Interface Found' }); // Simplification
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => req.destroy());
    });
};

async function scan() {
    const found = [];
    // Scan standard ZKTeco/Deli ports
    const ports = [80, 4370, 5005];

    const promises = [];

    for (let i = 1; i < 255; i++) {
        const ip = `${subnet}.${i}`;
        if (ip === localIp) continue;

        const p = (async () => {
            for (const port of ports) {
                const status = await checkPort(ip, port);
                if (status === 'open') {
                    console.log(`[FOUND] ${ip} (Port ${port} Open)`);
                    found.push({ ip, port });

                    // If port 80, try to get more info
                    if (port === 80) {
                        const web = await checkHttp(ip);
                        if (web) console.log(`   -> Web Server Active`);
                    }
                    break; // Found one port, assume device found
                }
            }
        })();
        promises.push(p);

        // Troop control to avoid EMFILE
        if (promises.length >= 50) {
            await Promise.all(promises);
            promises.length = 0;
        }
    }
    await Promise.all(promises);
    console.log('Scan Complete.');
    if (found.length === 0) console.log('No devices found. Ensure device is on same Wi-Fi.');
}

scan();
