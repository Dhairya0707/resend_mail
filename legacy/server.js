const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const app = express();
const port = 5050;

app.use(cors());
app.use(express.json());

// Explicit Routing for Assets (Resolves 404 issues)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));

// Status Heartbeat
app.get('/status', (req, res) => {
    res.json({
        status: "online",
        engine: "MailDispatch Node.js 1.0",
        pnpm: true
    });
});
app.get('/api/status', (req, res) => {
    res.json({
        status: "online",
        engine: "MailDispatch Node.js 1.0",
        pnpm: true
    });
});

// Mail Dispatch Proxy
app.post('/send', (req, res) => {
    const data = JSON.stringify(req.body);
    const authHeader = req.headers.authorization;

    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': authHeader
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let responseData = '';
        proxyRes.on('data', (chunk) => {
            responseData += chunk;
        });
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode).send(responseData);
            console.log(`[${new Date().toISOString()}] Dispatch: ${proxyRes.statusCode}`);
        });
    });

    proxyReq.on('error', (e) => {
        console.error(`[${new Date().toISOString()}] Error: ${e.message}`);
        res.status(500).json({ error: e.message });
    });

    proxyReq.write(data);
    proxyReq.end();
});
app.post('/api/send', (req, res) => {
    const data = JSON.stringify(req.body);
    const authHeader = req.headers.authorization;

    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': authHeader
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let responseData = '';
        proxyRes.on('data', (chunk) => {
            responseData += chunk;
        });
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode).send(responseData);
            console.log(`[${new Date().toISOString()}] Dispatch: ${proxyRes.statusCode}`);
        });
    });

    proxyReq.on('error', (e) => {
        console.error(`[${new Date().toISOString()}] Error: ${e.message}`);
        res.status(500).json({ error: e.message });
    });

    proxyReq.write(data);
    proxyReq.end();
});

const fs = require('fs');

const server = app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(` MAILDISPATCH NODE ENGINE STARTED `);
    console.log(` URL: http://localhost:${port}`);
    console.log(` Runtime: Node.js + pnpm`);
    console.log(`========================================`);
    
    // Diagnostic Check
    const assets = ['index.html', 'style.css', 'app.js'];
    console.log(`Checking Assets:`);
    assets.forEach(asset => {
        const fullPath = path.join(__dirname, asset);
        if (fs.existsSync(fullPath)) {
            console.log(`  [OK] ${asset}`);
        } else {
            console.log(`  [MISSING] ${asset} at ${fullPath}`);
        }
    });
    console.log(`========================================\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[CRITICAL ERROR] Port ${port} is already in use by another app.`);
        console.error(`Try changing the port in server.js or killing the process using it.\n`);
    } else {
        console.error(`\n[SERVER ERROR]`, err);
    }
});
