# Legal Metrology Web Command Center 💻⚡

[![Web CI](https://github.com/AllikaSaiHarsha/legal-metrology-web/actions/workflows/ci.yml/badge.svg)](https://github.com/AllikaSaiHarsha/legal-metrology-web/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live_Portal-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://legal-metrology-web.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-316192?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> 📦 **Legal Metrology Vision Ecosystem**  
> 📱 [Mobile Field Scanner App](https://github.com/AllikaSaiHarsha/legal-metrology-app) • 💻 [Web Command Center](https://github.com/AllikaSaiHarsha/legal-metrology-web) • 🧠 [AI Vision Backend](https://github.com/AllikaSaiHarsha/legal-metrology-backend)

**LegalMetrics** is a full-stack, enterprise-grade command portal and automated compliance inspection platform designed for Legal Metrology officers and consumer protection authorities in India. 

It leverages **Google Gemini Multimodal AI** to instantly audit retail product packaging labels against the statutory requirements of **Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011**, detect non-compliant markings, and generate legally admissible PDF violation notices in seconds.

---

## 🌐 Live Product Access & Demo Credentials

* **Production URL:** [https://legal-metrology-web.vercel.app](https://legal-metrology-web.vercel.app)
* **Pre-configured Demo Account:**
  - **Email:** `admin@metrology.gov`
  - **Password:** `admin`
  *(The login portal automatically pre-populates these credentials for one-click demo access).*

---

## 📸 Product Interface & Live Inspection Showcase

<div align="center">
  <p><strong>Zero-Shot AI Vision Inspection with 2D Bounding Boxes & Rule 6 Statutory Scorecard:</strong></p>
  <img src="public/docs/inspection-results-preview.png" alt="LegalMetrics Live AI Inspection with 2D Bounding Boxes" width="100%" />
</div>

<br/>

<div align="center">
  <p><strong>Executive Command Center & Real-Time Violation Analytics:</strong></p>
  <img src="public/docs/dashboard-preview.png" alt="LegalMetrics Executive Compliance Dashboard" width="100%" />
</div>

<br/>

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <p align="center"><strong>Packaging Ingestion & Framing Reticle</strong></p>
        <img src="public/docs/scanner-preview.png" alt="Live Package Scanner" width="100%" />
      </td>
      <td width="50%">
        <p align="center"><strong>Enforcement Officer Authentication</strong></p>
        <img src="public/docs/login-preview.png" alt="Secure Enforcement Portal" width="100%" />
      </td>
    </tr>
  </table>
</div>

---

## 🧐 What Problem Does This Product Solve?

In India, every packaged commodity (FMCG goods, cosmetics, packaged food, electronics) is legally required under **Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011** to display 9 mandatory declarations in a legible, standardized format:
1. **Product Name / Generic Identity**
2. **Net Quantity / Weight / Measure**
3. **Maximum Retail Price (MRP)** (inclusive of all taxes)
4. **Unit Sale Price (USP)** (e.g., ₹ per gram or ₹ per ml)
5. **Date of Manufacture / Packing / Import**
6. **Best Before / Expiration Date**
7. **Consumer Care / Grievance Redressal Contact** (Name, phone, email, address)
8. **Manufacturer / Packer / Importer Name & Complete Address**
9. **Country of Origin** (for imported goods)

### The Challenge:
Enforcement officers conduct thousands of on-site retail market inspections manually:
* **Human Auditing is Slow & Subjective:** Manually inspecting tiny fine print on curved bottles, reflective metallic pouches, and multi-lingual packaging takes several minutes per SKU.
* **Complex Deceptions Go Unnoticed:** Omission of Unit Sale Price (USP), hidden tax surcharges, illegible consumer grievance contacts, and misleading date stamps often evade manual checks.
* **Paper-Based Audits Delay Enforcement:** Documenting evidence, calculating violation fines, and generating notices by hand creates a massive administrative bottleneck.

### The Solution:
**LegalMetrics** automates this entire audit pipeline into a **3-second AI-driven workflow**:
1. Take a photo of the package.
2. Multimodal AI localizes declarations and verifies statutory compliance.
3. Generate a formal, timestamped PDF violation notice ready for judicial filing.

---

## 🔄 End-to-End System Workflow

```mermaid
flowchart TD
    subgraph Capture["1. Capture & Upload"]
        A["📸 Retail Package Photo<br/>(Camera / Upload)"]
    end

    subgraph Intelligence["2. AI Multimodal Engine"]
        B["🧠 Google Gemini Vision AI<br/>(Zero-Shot Text & 2D Bounding Boxes)"]
        C["⚖️ Rule 6 Statutory Engine<br/>(Cross-reference declarations & rules)"]
    end

    subgraph Portal["3. Web Command Center"]
        D["💻 Interactive Spatial Viewer<br/>(2D Bounding Box Overlay)"]
        E["📊 Compliance Scorecard<br/>(Pass / Fail Breakdown)"]
        F["📄 Automated PDF Notice<br/>(Timestamped Legal Violation Record)"]
        G["🗄️ Neon PostgreSQL<br/>(Audit Trail & Inspector RBAC)"]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
```

---

## 📖 Step-by-Step: How to Use the Product

### Step 1: Sign In to the Command Center
1. Navigate to [legal-metrology-web.vercel.app](https://legal-metrology-web.vercel.app).
2. The sign-in screen pre-populates the demo administrator credentials (`admin@metrology.gov` / `admin`).
3. Click **Sign In** to access the live operations command center.

---

### Step 2: Perform an AI Packaging Scan (`/scan`)
1. Click **Scan / Inspect** in the left sidebar (or navigate to `/scan`).
2. **Upload Packaging Evidence:**
   - Drag and drop an image of any retail product label, or click the upload zone to select a file (`.jpg`, `.png`, `.webp`).
   - *(A test sample image is available directly in the repository at `public/test_sample.png`)*.
3. Click **Analyze Packaging**.
4. **The Multimodal Engine executes:**
   - Detects brand, product name, and manufacturer.
   - Extracts MRP, Unit Sale Price, Net Quantity, Expiry, and Customer Care text verbatim.
   - Calculates 2D bounding boxes normalized to the exact coordinates on the packaging.

---

### Step 3: Review Interactive 2D Bounding Boxes & Compliance Breakdown
1. **Visual Evidence Overlay:**
   - Hover over or click any declaration badge (e.g., `MRP`, `Net Weight`, `Customer Care`) on the right-hand panel.
   - The interactive image viewer highlights the exact physical location of that declaration on the package in real time.
2. **Statutory Pass/Fail Verdicts:**
   - **Passed (Green):** Text is clear, legible, and compliant with Rule 6 provisions.
   - **Failed (Red):** Declaration is missing, obscured, or lacks mandatory clauses (e.g., MRP stated without "inclusive of all taxes", or missing Unit Sale Price).

---

### Step 4: Save & Generate Official Violation Reports (`/reports`)
1. In the inspection panel, review the pre-filled Product Name and Manufacturer details.
2. Click **Save Inspection** to commit the audit record, timestamp, inspector ID, and evidence photograph to the cloud database.
3. Click **Generate Official Notice (PDF)**:
   - Instantly downloads a formatted Legal Metrology Notice containing:
     - Official Government-style header and seal.
     - Timestamp, Inspector Name, and Product Details.
     - Photographic evidence with labeled bounding boxes.
     - Itemized table of statutory violations cited under Rule 6.
     - Signature block for enforcement officers.

---

### Step 5: Monitor Enforcement Analytics & Audits (`/`, `/inspections`, `/violations`)
* **Live Overview (`/`):** View total inspections conducted, violation rate percentage, and recent scan logs.
* **Audit History (`/inspections`):** Search, filter, and inspect historical audits by status (`Passed`, `Failed`, `Under Review`).
* **Violation Analytics (`/violations`):** Analyze top non-compliance categories (e.g., percentage of items lacking Unit Sale Price vs. MRP tampering).
* **Inspector Management (`/team`):** Manage officers, assign roles (Admin, Senior Inspector, Field Officer), and monitor individual field audit activity.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router, Server Actions, React 19) |
| **Language** | **TypeScript 5** |
| **UI & Animations** | **Tailwind CSS 4**, Framer Motion, Lucide Icons, React Bits UI |
| **Database & ORM** | **Neon Serverless PostgreSQL** with **Prisma ORM** |
| **Authentication** | **NextAuth.js** with bcrypt credentials hashing & RBAC |
| **AI Vision Microservice** | **Python FastAPI** powered by **Google Gemini Vision** (`google-genai` SDK) |
| **Document Engine** | **jsPDF** & **jsPDF-AutoTable** for legal PDF synthesis |
| **Hosting & CI/CD** | **Vercel** with automated **GitHub Actions CI** |

---

## 💻 Local Development & Installation

### Prerequisites
* Node.js 18.18+ or 20+
* A running PostgreSQL database (e.g., [Neon DB](https://neon.tech))
* The [Legal Metrology Backend](https://github.com/AllikaSaiHarsha/legal-metrology-backend) running locally or hosted on Render

### Installation Steps

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
   ```
   Fill in your `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@your-neon-host/metrology?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-32-character-secret"
   NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
   ```

4. **Initialize Database Schema & Seed Data:**
   ```bash
   npx prisma generate
   npx prisma db push
   node seed.js
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and log in with `admin@metrology.gov` / `admin`.

6. **Run Quality Checks:**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
