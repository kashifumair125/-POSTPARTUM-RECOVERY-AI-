
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecoveryPlan, VideoAnalysis, UserProfile, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const FAST_MODEL = 'gemini-2.5-flash';
const SMART_MODEL = 'gemini-3-pro-preview';

/**
 * HELPER: Cleans AI output to ensure valid JSON.
 * Google Gemini often returns Markdown code blocks (```json ... ```) which fails JSON.parse.
 */
const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) throw new Error("AI returned empty response.");
  
  let cleanText = text.trim();
  
  // Remove markdown formatting if present
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error. Raw Text:", text);
    throw new Error("Failed to parse AI response. Please try again.");
  }
};

// --- 1. Analyze Diastasis Recti (Image) ---
export const analyzeDiastasisImage = async (
  file: File, 
  weeksPostpartum: number,
  symptoms?: { bulging: boolean; pain: boolean },
  language: string = 'en'
) => {
  const base64Data = await fileToGenerativePart(file);
  
  let symptomContext = "";
  if (symptoms) {
    symptomContext = `
    ADDITIONAL SYMPTOMS REPORTED BY USER:
    - Visible Bulging/Doming on exertion: ${symptoms.bulging ? "YES (High Risk indicator)" : "NO"}
    - Lower Back Pain or Pelvic Pressure: ${symptoms.pain ? "YES" : "NO"}
    `;
  }

  const prompt = `
  Analyze this postpartum belly image (User is ${weeksPostpartum} weeks pp). 
  ${symptomContext}
  
  Task: Estimate Diastasis Recti severity, gap size, and provide a safety recommendation.
  If the user reported "Bulging/Doming", prioritize core stability and deep transverse abdominis engagement in the recommendation.
  If the user reported "Pain", suggest consulting a PT immediately if severity is high.

  IMPORTANT: Provide the 'recommendation', 'severity', and 'gapEstimation' values translated into ${language} language.
  `;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      severity: { type: Type.STRING },
      gapEstimation: { type: Type.STRING },
      recommendation: { type: Type.STRING },
      safeToExercise: { type: Type.BOOLEAN },
    },
    required: ["severity", "gapEstimation", "recommendation", "safeToExercise"]
  };

  try {
    const response = await ai.models.generateContent({
      model: SMART_MODEL, 
      contents: { parts: [base64Data, { text: prompt }] },
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    
    return cleanAndParseJSON(response.text);
  } catch (error: any) {
    console.error("Diastasis Analysis Error:", error);
    throw new Error("Unable to analyze image. Please ensure the image is clear and try again.");
  }
};

// --- 2. Generate Recovery Roadmap (Optimized for Variety) ---
export const generateRecoveryRoadmap = async (profile: any, language: string = 'en'): Promise<RecoveryPlan> => {
  const culturalPrompt = profile.culturalContext
    ? `Include culturally sensitive advice relevant to South Asian and Middle Eastern women (e.g., confinement diet, wrapping, rest) aligned with medical safety.`
    : "";

  const prompt = `Create a highly PERSONALIZED 12-WEEK postpartum recovery roadmap.
  
  USER PROFILE:
  - Delivery: ${profile.deliveryMethod}
  - Weeks PP: ${profile.weeksPostpartum}
  - Activity Level: ${profile.activityLevel}
  - Symptoms: ${profile.symptoms}
  - Diastasis Check: Gap Feel: ${profile.diastasisInfo.gapFeel}, Appearance: ${profile.diastasisInfo.bellyAppearance}
  - Physical: Energy ${profile.energyLevel}/10, Pain ${profile.painLevel}/10
  - Capabilities: Can walk? ${profile.capabilities.canWalk}, Leaking? ${profile.capabilities.leaking}
  
  ${culturalPrompt}

  LANGUAGE REQUIREMENT:
  **CRITICAL:** The entire output content (descriptions, names, summaries, how-to steps) MUST be in **${language}**.
  However, the JSON KEYS (like 'phases', 'exercises', 'visualTag') MUST remain in English.
  The 'visualTag' values MUST remain strictly one of the enum values in English.

  REQUIREMENTS:
  1. Summary: Warm, encouraging, feminine tone in ${language}.
  2. Phases: 3 Distinct Phases.
     - Phase 1 (Weeks 1-4): Reconnection & Restore. Focus on breath, pelvic floor, and gentle support.
     - Phase 2 (Weeks 5-8): Stability & Control. Focus on deep core, balance, and coordination.
     - Phase 3 (Weeks 9-12): Functional Strength. Focus on standing movements, glutes, and total body integration.

  3. Exercise Selection Rules (CRITICAL for Diversity):
     - **NO REPETITION**: An exercise name used in one phase MUST NOT appear in any other phase.
     - **VISUAL VARIETY**: Use different visualTags for different phases.
       - *Phase 1*: Focus on 'lying_back', 'seated', 'glute_bridge'.
       - *Phase 2*: Focus on 'all_fours', 'bird_dog', 'lying_back'.
       - *Phase 3*: Focus on 'standing', 'lunge', 'plank', 'side_plank'.
     - **NAMING MATTERS**: The visualizer adapts to the name. 
       - Use names appropriate for the visualTag but translated to ${language} (e.g., "Heel Slides" -> "Deslizamientos de talón").

  4. Data Fields (EXPANDED & DETAILED):
     - **description**: Provide a rich, 2-3 sentence overview of the movement. Focus on the *feeling* and *intention*.
     - **benefits**: Provide a detailed, empathetic explanation of WHY this helps a new mom.
     - **howTo**: Detailed array of steps in ${language}.
     - **whenToAvoid**: Specific to this user's symptoms in ${language}.
     - **visualTag**: STRICTLY from: ['lying_back', 'all_fours', 'standing', 'seated', 'plank', 'glute_bridge', 'bird_dog', 'side_plank', 'lunge'].
  
  Return JSON only.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      diastasisNote: { type: Type.STRING },
      phases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phaseName: { type: Type.STRING },
            weekRange: { type: Type.STRING },
            focus: { type: Type.STRING },
            description: { type: Type.STRING },
            culturalTip: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reps: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  description: { type: Type.STRING },
                  benefits: { type: Type.STRING },
                  howTo: { type: Type.ARRAY, items: { type: Type.STRING } },
                  whenToAvoid: { type: Type.STRING },
                  safetyNote: { type: Type.STRING },
                  visualTag: { 
                    type: Type.STRING, 
                    enum: ['lying_back', 'all_fours', 'standing', 'seated', 'plank', 'glute_bridge', 'bird_dog', 'side_plank', 'lunge'] 
                  }
                },
                required: ["name", "reps", "frequency", "description", "benefits", "howTo", "whenToAvoid", "visualTag"]
              }
            }
          },
          required: ["phaseName", "weekRange", "focus", "description", "exercises"]
        }
      }
    },
    required: ["summary", "phases"]
  };

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL, 
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: schema,
      }
    });
    return cleanAndParseJSON(response.text) as RecoveryPlan;
  } catch (error) {
    console.error("Plan Gen Error:", error);
    throw new Error("Failed to generate plan. Please try again.");
  }
};

// --- 3. Analyze Exercise Video ---
export const analyzeExerciseVideo = async (file: File, exerciseName: string, language: string = 'en'): Promise<VideoAnalysis> => {
  const base64Data = await fileToGenerativePart(file);
  const prompt = `User is doing "${exerciseName}". Analyze form. Give feedback, 3 corrections, and safety score (1-10). Provide response in ${language} language.`;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      feedback: { type: Type.STRING },
      corrections: { type: Type.ARRAY, items: { type: Type.STRING } },
      safetyScore: { type: Type.NUMBER }
    },
    required: ["feedback", "corrections", "safetyScore"]
  };

  try {
    const response = await ai.models.generateContent({
      model: SMART_MODEL, 
      contents: { parts: [base64Data, { text: prompt }] },
      config: { responseMimeType: "application/json", responseSchema: schema }
    });

    return cleanAndParseJSON(response.text) as VideoAnalysis;
  } catch (error) {
     console.error("Video Analysis Error:", error);
     throw new Error("Video analysis failed. Please try a shorter clip or different angle.");
  }
};

// --- 4. Analyze Text Feedback ---
export const analyzeExerciseFeedback = async (exerciseName: string, userFeedback: string, language: string = 'en'): Promise<string> => {
  const prompt = `
    User performed the postpartum exercise "${exerciseName}".
    User reported: "${userFeedback}".
    As a physical therapist specialized in women's health, provide specific advice.
    Keep it short (2-3 sentences), warm and encouraging.
    Respond in ${language}.
  `;
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: { parts: [{ text: prompt }] },
    });
    return response.text || "Keep listening to your body.";
  } catch (e) {
    return "I'm having trouble connecting right now, but please listen to your body and rest if needed.";
  }
};

// --- 5. Health Coach Chat (With Thinking Mode) ---
export const chatWithHealthCoach = async (
  message: string, 
  history: ChatMessage[], 
  profile: UserProfile | null,
  language: string = 'en'
): Promise<string> => {
  
  // Construct a context-rich prompt
  let context = `You are a warm, empathetic, and medically-aware Postpartum Health Coach named 'Rose'. Speak in ${language}.`;
  
  if (profile) {
    context += `
      USER CONTEXT:
      - Weeks Postpartum: ${profile.weeksPostpartum}
      - Delivery: ${profile.deliveryMethod}
      - Known Issues: ${profile.symptoms}
      - Diastasis: ${profile.diastasisInfo.gapFeel}, ${profile.diastasisInfo.bellyAppearance}
      
      GUIDELINES:
      - If user reports severe pain (chest pain, heavy bleeding, headache), advise them to call a doctor immediately.
      - Keep answers short, encouraging, and easy to read on a mobile device.
      - Use "we" and "us" to foster connection.
    `;
  } else {
    context += " The user has not completed their profile yet, so give general, conservative advice.";
  }

  const conversation = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Rose'}: ${m.text}`).join('\n');
  
  const prompt = `
    ${context}

    RECENT CONVERSATION:
    ${conversation}
    User: ${message}
    Rose (in ${language}):
  `;

  try {
    const response = await ai.models.generateContent({
      model: SMART_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    return response.text || "I'm here to listen. Could you tell me more about how you're feeling?";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a little trouble thinking right now. Could you ask that again?";
  }
};

// Helper
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
