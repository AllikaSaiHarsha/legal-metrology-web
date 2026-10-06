# Legal Metrology Compliance Web App

A full-stack web application designed to automate Legal Metrology Rule compliance checks. The platform allows users to upload product labeling and packaging images, extracting critical information via Optical Character Recognition (OCR) and computer vision to verify adherence to statutory regulations.

---

## 🚀 Tech Stack

### **Frontend**
* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS

### **Backend & Processing**
* **API Framework:** Python [FastAPI](https://fastapi.tiangolo.com/)
* **Computer Vision:** OpenCV
* **Text Extraction:** Tesseract OCR

---

## ✨ Key Features

* **Image Upload Pipeline:** A seamless frontend-to-backend interface for ingesting product packaging and label photographs.
* **Automated OCR Extraction:** Leverages OpenCV for image preprocessing (noise reduction, contrast enhancement) and Tesseract OCR to accurately parse text data (e.g., net quantity, manufacturer details, pricing).
* **Real-time Compliance Validation:** Automatically cross-references extracted label data against standard Legal Metrology guidelines to flag discrepancies.
* **Modern UI/UX:** Built with a responsive, intuitive interface optimized for fast verification workflows.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* Python (v3.9+)
* Tesseract OCR installed on your system (ensure `tesseract` is added to your system environment variables)

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/AllikaSaiHarsha/legal-metrology-web.git](https://github.com/AllikaSaiHarsha/legal-metrology-web.git)
   cd legal-metrology-web
