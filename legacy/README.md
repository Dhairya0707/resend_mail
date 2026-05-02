# 🚀 MailDispatch Node Engine

**MailDispatch** is a high-performance, minimalist local mail relay and dashboard designed for developers using the [Resend](https://resend.com) API. It provides a sleek UI for composing, previewing, and tracking email dispatches without needing to build a custom backend for every project.

**🌐 Live Demo:** [https://maildispatch.yourdomain.com](https://maildispatch.yourdomain.com)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Engine](https://img.shields.io/badge/engine-Node.js-orange.svg)

---

## ✨ Features

- **Local Proxy Engine:** A lightweight Node.js server that handles CORS and secure communication with the Resend API.
- **Real-time Preview:** Live HTML/Text rendering of your email content before transmission.
- **Identity Management:** Easily switch between verified sender identities.
- **Dispatch Logs:** Persistent local history of all sent emails, response codes, and timestamps.
- **Terminal Integration:** Built-in status monitoring and diagnostic heartbeat.
- **Privacy First:** Your API keys and logs are stored locally in your browser's `localStorage`.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, CSS3 (Modern Material Design)
- **API:** Resend Mail API
- **Package Manager:** pnpm

---

## 🔑 Getting Your Resend API Key

To use MailDispatch, you'll need an API key from Resend:

1.  **Sign Up:** Create a free account at [resend.com](https://resend.com).
2.  **Verify Domain/Email:** Follow Resend's guide to verify a domain or a single sender email address.
3.  **Generate Key:** Navigate to the **API Keys** section in your Resend dashboard.
4.  **Copy Key:** Create a new API key (e.g., named "MailDispatch") and copy it.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- [pnpm](https://pnpm.io/) installed
- A [Resend API Key](https://resend.com/api-keys)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/resend_mail.git
cd resend_mail
pnpm install
```

### 3. Running the Engine
Start the local proxy server:
```bash
pnpm dev
```
The engine will start on `http://localhost:5050`.

### 4. Configuration & Security
1.  Open `index.html` in your browser (or access via the local server if hosted).
2.  Navigate to **Settings**.
3.  Paste your **Resend API Key**.
4.  Add your **Verified Identities** (the emails you are authorized to send from in Resend).

> [!IMPORTANT]
> **Privacy First:** Your API key is stored **only** in your browser's `localStorage`. It is never sent to or stored on any server except when it's used as an authorization header to communicate directly with Resend's official API. There is no backend database involved in this project.

---

## 🛡️ Security & Privacy

- **No Data Collection:** MailDispatch does not have a database. All logs and settings stay in your browser.
- **Local Proxy:** The Node.js server acts as a relay to prevent CORS issues while keeping your API key out of client-side code where possible during transit.
- **Safe Transmission:** All requests to Resend are made over HTTPS.

---

## 📖 Usage

### Composing an Email
1. Go to the **Compose** tab.
2. Select a "From" address from your verified identities.
3. Enter the recipient and subject.
4. Toggle between **HTML** and **Text** modes.
5. Click **Send Dispatch**.

### Monitoring Logs
The **Dashboard** and **Logs** tabs provide a detailed history of your dispatches. Click on any log entry to view the full JSON response from the Resend API.

---

## 📜 License

Distributed under the ISC License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Developed with ❤️ by [Dhairya Darji](https://github.com/dhairya-darji)
