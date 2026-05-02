import https from 'https';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = JSON.stringify(req.body);
    const authHeader = req.headers.authorization;

    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
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
        });
    });

    proxyReq.on('error', (e) => {
        res.status(500).json({ error: e.message });
    });

    proxyReq.write(data);
    proxyReq.end();
}
