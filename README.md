# Legal Metrology Web Command Center 💻⚡

[![Web CI](https://github.com/AllikaSaiHarsha/legal-metrology-web/actions/workflows/ci.yml/badge.svg)](https://github.com/AllikaSaiHarsha/legal-metrology-web/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-316192?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> 📦 **Legal Metrology Vision Ecosystem**  
> 📱 [Mobile Field Scanner App](https://github.com/AllikaSaiHarsha/legal-metrology-app) • 💻 [Web Command Center](https://github.com/AllikaSaiHarsha/legal-metrology-web) • 🧠 [AI Vision Backend](https://github.com/AllikaSaiHarsha/legal-metrology-backend)

A production-grade web command center and administrative dashboard for Legal Metrology officers in India to review packaging audits, verify Rule 6 compliance, manage inspector accounts, and generate official compliance reports.

**Live Deployment:** [legal-metrology-web.vercel.app](https://legal-metrology-web.vercel.app)

---

## 🚀 Modern Architecture & Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions, React 19)
* **Language:** TypeScript
* **Styling & UI:** Tailwind CSS, Framer Motion, Lucide Icons, React Bits animations
* **Database & ORM:** Neon Serverless PostgreSQL with [Prisma ORM](https://www.prisma.io)
* **Authentication:** NextAuth.js with bcrypt credentials hashing and Role-Based Access Control (RBAC)
* **Reporting:** jsPDF & jsPDF-AutoTable for automated PDF compliance violation notices
* **Analytics:** Recharts interactive data visualization
* **Connected Service:** Communicates asynchronously with the [Legal Metrology Vision API](https://github.com/AllikaSaiHarsha/legal-metrology-backend)

---

## ✨ Key Capabilities

* **Command Dashboard:** Real-time stream of field inspection reports submitted by mobile officers.
* **Violation Analytics:** Charts tracking violation rates, top non-compliant categories (MRP tampering, missing expiry, missing USP), and regional distribution.
* **Audit Deep-Dive:** Interactive image viewer with color-coded 2D bounding boxes overlaid directly onto the evidence photograph.
* **PDF Report Generation:** Instant one-click export of statutory compliance notices and violation records for official proceedings.
* **RBAC & Team Management:** Granular permissions for Admin, Senior Inspector, and Field Officer roles.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js 18+ or 20+
* PostgreSQL database (e.g., [Neon DB](https://neon.tech))

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AllikaSaiHarsha/legal-metrology-web.git
   cd legal-metrology-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   # Populate DATABASE_URL, NEXTAUTH_SECRET, and NEXT_PUBLIC_BACKEND_URL in .env
   ```

4. **Initialize Database Schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   # Optional: Seed sample test data
   node seed.js
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Lint & Typecheck:**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
