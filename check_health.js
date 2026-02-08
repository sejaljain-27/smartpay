import http from 'http';

const req = http.get('http://localhost:3000/health', (res) => {
    console.log('Status Code:', res.statusCode);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.end();
