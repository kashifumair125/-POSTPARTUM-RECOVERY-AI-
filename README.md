# Postpartum Recovery AI Assistant 🌸

A privacy-first, AI-powered web application designed to guide women through their postpartum recovery journey. This app combines **Google Gemini's multimodal AI** with **interactive 3D visualizations** to provide medically aware, culturally sensitive, and personalized physical therapy roadmaps.

---

## 🤰 For Mothers (User Guide)

### What is this?
Postpartum Recovery AI is your digital companion for the "4th Trimester" and beyond. Unlike generic fitness apps, this tool understands that every birth is different. It creates a recovery plan based on your specific delivery method (C-section vs. Vaginal), symptoms (e.g., Diastasis Recti, leaking), and energy levels.

### Key Features

1.  **Personalized Roadmap:**
    *   Input your details (weeks postpartum, pain levels, delivery type).
    *   Receive a 12-week phased recovery plan (Reconnect → Stability → Strength).
    *   Includes daily checklists and "Mom-First" wellness tips.

2.  **Diastasis Recti Analyzer (AI Vision):**
    *   Upload a photo of your abdomen.
    *   The AI estimates gap severity and tissue integrity to recommend safe movements.
    *   *Privacy Note:* Photos are processed by AI in memory and **never stored** on any server.

3.  **Form Correction Lab (AI Video Analysis):**
    *   Unsure if you're doing an exercise correctly?
    *   Upload a 5-10 second video clip.
    *   The AI analyzes your posture and movement to provide safety scores and specific corrections.

4.  **Interactive 3D Guides:**
    *   View exercises via a procedural 3D mannequin.
    *   **Visual cues:** Muscles glow when active, joints highlight red if they are under stress.
    *   **Realism:** The model breathes, balances, and reacts to exertion levels.

5.  **"Rose" - Your Health Coach:**
    *   Chat with an empathetic AI coach specialized in women's health.
    *   Ask questions via text or voice.

### Privacy & Safety
*   **Local-First:** Your health data, logs, and plans are stored locally on your device (browser storage). We do not maintain a central database of your medical history.
*   **Medical Disclaimer:** This app is for informational purposes. Always consult your doctor before starting exercise after birth.

---

## 💻 For Developers (Technical Documentation)

### Tech Stack
*   **Frontend:** React 19, TypeScript, Tailwind CSS.
*   **AI Core:** Google Gemini API (`@google/genai`).
*   **3D Engine:** Three.js (Procedural generation, no external GLB assets required).
*   **Icons:** Lucide React.
*   **Build/Bundling:** Standard ES Modules (No complex build step required for this demo structure).

### Architecture Overview

#### 1. AI Integration (`services/geminiService.ts`)
We utilize a hybrid model approach for cost and latency optimization:
*   **Gemini 2.5 Flash:** Used for high-speed tasks like generating the JSON Roadmap structure and simple text feedback.
*   **Gemini 3.0 Pro Preview:** Used for complex multimodal reasoning:
    *   **Vision:** Analyzing user uploaded images for medical conditions (Diastasis).
    *   **Video:** Analyzing movement patterns in video clips for form correction.
    *   **Reasoning:** The Chatbot ("Rose") uses "Thinking Mode" to provide empathetic and medically sound advice.

#### 2. Procedural 3D Engine (`components/ExerciseAnimation.tsx`)
Instead of loading heavy 3D assets, the mannequin is generated procedurally using Three.js primitives.
*   **Dynamic Textures:** Skin and fabric textures are generated via HTML5 Canvas API at runtime.
*   **Physics Simulation:** We simulate breathing, muscle swelling (squash & stretch), micro-tremors, and balance sway based on a sine-wave timeline.
*   **Visual Feedback:**
    *   `jointHighlightMat`: Changes color (Orange -> Red) based on joint stress intensity.
    *   `highlightMat`: Emits a glow on muscle groups currently active in the animation phase.

#### 3. State Management (`services/storageService.ts`)
*   Implements a **Local-First** architecture.
*   User state (`AppState`) is persisted to `localStorage`.
*   Includes utilities for calculating streaks and logging daily activity.

### Setup & Installation

1.  **Environment Variables:**
    You must have a Google Gemini API Key.
    The app expects the key to be available via `process.env.API_KEY`.

2.  **Running the App:**
    This project is structured as a standard React application.
    ```bash
    npm install
    npm start
    ```

### Key Components

*   `App.tsx`: Main router and state container. Handles theme switching and layout.
*   `AssessmentForm.tsx`: Multi-step wizard to collect user physiology data.
*   `RecoveryPlanView.tsx`: The main dashboard displaying the timeline, daily exercises, and gamification.
*   `VideoLab.tsx`: Component handling video file uploads and displaying AI analysis results.
*   `BellyAnalyzer.tsx`: Component handling image uploads for Diastasis analysis.

### Performance Optimizations
*   **Lazy Loading:** 3D components are initialized only when the modal opens.
*   **Model Selection:** We default to `gemini-2.5-flash` for critical path rendering to ensure the roadmap generates in < 3 seconds.
*   **PWA:** `manifest.json` and `sw.js` are included to allow the app to be installed on mobile devices.

### License
MIT License.
