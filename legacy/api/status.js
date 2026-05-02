export default function handler(req, res) {
    res.status(200).json({
        status: "online",
        engine: "MailDispatch Vercel Edge 1.0",
        pnpm: true
    });
}
