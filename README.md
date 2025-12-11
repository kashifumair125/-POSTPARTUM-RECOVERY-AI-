
# Postpartum Recovery AI Assistant 🌸

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Tech](https://img.shields.io/badge/AI-Google%20Gemini-blue)
![Privacy](https://img.shields.io/badge/Privacy-Local%20First-purple)

**A privacy-first, AI-powered companion designed to bridge the gap in postpartum healthcare.** 

This web application combines **Google Gemini's multimodal AI** with **interactive 3D visualizations** to provide medically aware, culturally sensitive, and personalized physical therapy roadmaps for new mothers.

---

## 🧩 The Problem

The "4th Trimester" (the first 12 weeks after birth) is a critical period often neglected in modern healthcare. 
*   **The Care Gap:** New mothers are typically discharged from the hospital within 2 days but don't see a doctor again until 6 weeks later.
*   **Information Overload:** Moms often turn to social media for fitness advice, which can lead to unsafe exercises causing injury (e.g., worsening Diastasis Recti).
*   **Lack of Access:** Pelvic floor physical therapy is expensive and inaccessible to many.
*   **Generic Advice:** Most fitness apps do not account for delivery methods (C-Section vs. Vaginal) or specific complications.

## 🌍 Social Impact

**PostpartumAI** aims to democratize access to safe recovery guidance:
1.  **Reducing Long-term Injury:** By providing AI-driven form correction and safety filters, we prevent conditions like uterine prolapse and chronic back pain.
2.  **Mental Health Support:** The empathetic AI coach ("Rose") provides reassurance during a time of high anxiety and isolation.
3.  **Cultural Inclusivity:** The app supports 8 languages and includes culturally specific wellness advice (e.g., confinement practices for South Asian/Middle Eastern users), respecting traditions often ignored by Western medicine.

---

## 🚀 Key Features

### 1. Personalized Recovery Roadmap
Instead of a generic "get fit" plan, the AI generates a 12-week phased journey based on:
*   Delivery Method (C-Section / Vaginal)
*   Current Symptoms (Leaking, Pain)
*   Diastasis Recti Status
*   Energy Levels

### 2. Diastasis Recti Analyzer (AI Vision)
*   **How it works:** Users upload a photo of their abdomen. Gemini 3.0 Pro analyzes tissue integrity, doming, and gap width.
*   **Result:** Provides a severity estimate and automatically adjusts the exercise plan to avoid unsafe movements.
*   **Privacy:** Images are processed in-memory and **never stored** on any server.

### 3. AI Form Correction Lab (Video Analysis)
*   **How it works:** Users record a 5-10 second clip of an exercise.
*   **Result:** The AI acts as a virtual physical therapist, analyzing alignment and providing a safety score (1-10) with specific corrections.

### 4. Interactive 3D Mannequin
*   **Procedural Animation:** A custom Three.js engine generates a 3D model that breathes and moves.
*   **Realism:** The model reacts to "exertion"—breathing gets heavier, muscles flush red, and sweat appears based on the intensity of the movement.
*   **Inclusivity:** Users can toggle body types (Postpartum/Curvy, Athletic, Standard) and skin tones to see themselves represented.

### 5. "Rose" - The AI Health Coach
*   A context-aware chatbot that knows your specific medical profile.
*   Supports Voice-to-Text and Text-to-Speech for hands-free interaction while holding a baby.

---

## 🎯 Who Is This App For?

*   **New Mothers (0-12 months postpartum):** Looking for safe, guided recovery.
*   **C-Section Moms:** Needing specific scar-care and gentle mobility work.
*   **Moms with Diastasis Recti:** Needing core-safe workouts.
*   **Non-English Speakers:** The app fully supports Spanish, French, German, Arabic, Hindi, Chinese, and Japanese.

---

## 📖 How To Use

1.  **Assessment:** Complete the 3-step onboarding quiz. Be honest about pain levels and delivery details.
2.  **Generate Plan:** The AI will craft your 12-week roadmap.
3.  **Daily Check-in:** Log your exercises. Use the **3D Guide** to see how movements are performed.
4.  **Check Safety:** 
    *   Use the **Belly Analyzer** if you suspect ab separation.
    *   Use the **Video Lab** if you are unsure about your squat or core form.
5.  **Chat:** Tap the message icon to ask "Rose" questions like *"Is it normal to feel pressure when I sneeze?"*

---

## 🛠️ Technical Architecture

### Tech Stack
*   **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons.
*   **AI Models:** 
    *   `gemini-2.5-flash`: For high-speed text generation and logic.
    *   `gemini-3-pro-preview`: For complex vision (Image/Video) analysis and deep reasoning.
*   **3D Engine:** Three.js (Custom procedural rig, no external model files).
*   **Storage:** LocalStorage (Primary) + Supabase (Optional Cloud Sync).

### Privacy & Security
*   **Local-First:** All sensitive health data lives in the user's browser.
*   **Stateless AI:** When analyzing images/video, data is sent to the API and immediately discarded. No training on user data.
*   **Cloud Sync:** Users must explicitly sign up to sync data; otherwise, the app works 100% offline.

---

## 👨‍💻 Getting Started (For Developers)

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kashifumair/postpartum-ai.git
    cd postpartum-ai
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_gemini_api_key
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server:**
    ```bash
    npm start
    ```

### Building for Production
This app is ready for deployment on Vercel, Netlify, or AWS Amplify.
1.  Run `npm run build`.
2.  Ensure your environment variables are set in your CI/CD pipeline / Hosting Dashboard.

---

## ⚠️ Known Issues & Limitations

*   **Video Analysis Latency:** Uploading large video files on slow connections may take time. The AI processing itself is fast (~3-5s).
*   **Browser Support:** The Web Speech API (Voice interaction) works best in Chrome and Safari.
*   **Medical Limit:** The AI is strictly an informational tool. It detects high-risk keywords (e.g., "heavy bleeding") and directs users to seek emergency care, but it cannot diagnose medical emergencies.

---

## 👤 Author

**Kashif**  
*Full Stack Developer & AI Enthusiast*

I built this application to explore how Multimodal AI can solve real-world healthcare accessibility problems.

*   **GitHub:** [github.com/kashifumair](https://github.com/kashifumair)
*   **Linkedin:** [linkedin.com/in/umair-kashif](https://www.linkedin.com/in/umair-kashif/) (Placeholder)

### 💌 Support & Feedback

If you have suggestions, feature requests, or want to report a bug, please reach out:

*   **Email:** [kashifumair125@gmail.com](mailto:kashifumair125@gmail.com)
*   **In-App:** Use the "Feedback" button in the footer to send an email directly.

---
*© 2024 PostpartumAI. All rights reserved.*
