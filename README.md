# 🎨 RedCanvas Proxy Server

Backend proxy server for **RedCanvas**.

This service acts as a secure middle layer between the RedCanvas frontend and external APIs (e.g. Reddit), handling requests, forwarding data, and protecting API keys.

---

## 🌍 Deployment

- ✅ Hosted on **Render**
- ✅ Connected to frontend deployed on **Netlify**
- ✅ Configured with CORS to allow frontend domain access

---

## 🧠 Purpose

The proxy server exists to:

- Prevent exposing API keys to the client
- Handle external API requests securely
- Normalize and format response data
- Bypass CORS limitations from third-party APIs
- Optionally implement caching or rate limiting

---

## 🔗 Architecture Used
[Architecture Diagram](./docs/architecture.png)