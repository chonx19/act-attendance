const url = 'http://192.168.1.3/control?api_key=';
const requestBody = {
    mid: "1",
    cmd: "GetUserInfo",
    payload: { id: "1" }
};

console.log(`Connecting to ${url}...`);

async function test() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch Error:', e.cause || e);
    }
}

test();
