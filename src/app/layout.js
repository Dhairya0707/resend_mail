import "./globals.css";

export const metadata = {
  title: "MailDispatch | Email Engine",
  description: "Production-grade local email dispatch engine for Resend. Features neobrutalist dashboard, real-time tracking, and multi-identity management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23dbffa6%22 stroke=%22black%22 stroke-width=%2210%22/><text x=%2250%22 y=%2270%22 font-family=%22serif%22 font-size=%2260%22 font-weight=%22bold%22 text-anchor=%22middle%22>M</text></svg>" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
