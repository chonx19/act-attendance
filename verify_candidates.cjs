const net = require('net');

const targets = ['192.168.1.141', '192.168.1.159'];
const ports = [80, 4370, 5005, 8080, 8000, 23, 21];

const checkPort = (ip, port) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000); // 2 seconds
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, ip);
    });
};

async function run() {
    console.log('Deep scanning candidates...');
    for (const ip of targets) {
        console.log(`Checking ${ip}...`);
        for (const port of ports) {
            const open = await checkPort(ip, port);
            if (open) console.log(`  [MATCH] ${ip}:${port} is OPEN`);
        }
    }
    console.log('Done.');
}
run();
