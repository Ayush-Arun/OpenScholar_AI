# 🎓 OpenScholar AI
> **GenAI Research Digest & Technical Audit Platform**

OpenScholar AI is a high-performance, institutional-grade platform designed to synthesize multi-modal research repositories, perform automated technical audits, and generate actionable insights using state-of-the-art Large Language Models (LLMs).

---

## 🚀 Key Features

- **🔍 Research Scouting**: Automatically fetches and analyzes the latest papers from ArXiv and other research repositories.
- **💻 Technical Code Audit**: Scans GitHub repositories to evaluate build feasibility, documentation quality, and reproducibility.
- **📈 Trend Radar**: Identifies emerging technical trends and momentum in the AI landscape.
- **💬 Research Console**: A direct neural interface (Chat) for deep multi-modal analysis of specific research topics.
- **📧 Automated Digests**: Schedules and sends comprehensive weekly email summaries of top research and code breakthroughs.
- **📊 Interactive Visualizations**: Premium dashboard with radar charts, momentum bars, and technical complexity scores.

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express**: Core server architecture.
- **Anthropic / OpenAI SDKs**: Powering the neural synthesis and technical reasoning.
- **Cheerio & Axios**: Advanced web scraping and data retrieval.
- **Node-Cron**: Automated scheduling for weekly and daily scans.
- **Nodemailer**: SMTP integration for institutional email delivery.

### Frontend
- **React (Vite)**: Ultra-fast, responsive UI.
- **Recharts**: High-fidelity data visualizations.
- **Vanilla CSS**: Custom premium aesthetics with glassmorphism and modern typography.
- **Material Symbols**: Institutional iconography.

---

## 📦 Quick Start

### Prerequisites
- Node.js (v18+)
- NPM
- Docker & Docker Compose (optional)

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd OpenScholar_AI
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

3. **Configure Environment Variables**:
   Edit `backend/.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Launch the platform**:
   - **Backend**: `cd backend && npm start`
   - **Frontend**: `cd frontend && npm run dev`
   - Access at: `http://localhost:3000`

---

## 🐳 Docker Deployment

For a streamlined, containerized experience:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

## 🏗️ Architecture

- **`/backend`**: Express server, AI agents, and scheduler.
- **`/frontend`**: React application and UI components.
- **`/stitch_assets`**: Institutional design assets and mockups.

---

## 👥 Team
**Team SCAM*€₹$**  
Institutional Access · MS RIT
