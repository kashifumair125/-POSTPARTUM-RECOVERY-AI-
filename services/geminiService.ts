import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecoveryPlan, VideoAnalysis, UserProfile, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const FAST_MODEL = 'gemini-2.5-flash';
const SMART_MODEL = 'gemini-3-pro-preview';

// --- 1. Analyze Diastasis Recti (Image) ---
export const analyzeDiastasisImage = async (file: File, weeksPostpartum: number) => {
  const base64Data = await fileToGenerativePart(file);
  const prompt = `Analyze this postpartum belly image (User is ${weeksPostpartum} weeks pp). Estimate Diastasis Recti severity, gap size, and provide a safety recommendation.`;
  
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

  const response = await ai.models.generateContent({
    model: SMART_MODEL, // Use Pro for image analysis accuracy
    contents: { parts: [base64Data, { text: prompt }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  
  return JSON.parse(response.text!);
};

// --- 2. Generate Recovery Roadmap (Optimized for Speed) ---
export const generateRecoveryRoadmap = async (profile: any): Promise<RecoveryPlan> => {
  const culturalPrompt = profile.culturalContext
    ? `Include culturally sensitive advice relevant to South Asian and Middle Eastern women (e.g., confinement diet, wrapping, rest) aligned with medical safety.`
    : "";

  const prompt = `Create a PERSONALIZED 12-WEEK postpartum recovery roadmap.
  
  USER PROFILE:
  - Delivery: ${profile.deliveryMethod}
  - Weeks PP: ${profile.weeksPostpartum}
  - Activity Level: ${profile.activityLevel}
  - Symptoms: ${profile.symptoms}
  - Diastasis Check: Gap Feel: ${profile.diastasisInfo.gapFeel}, Appearance: ${profile.diastasisInfo.bellyAppearance}
  - Physical: Energy ${profile.energyLevel}/10, Pain ${profile.painLevel}/10
  - Capabilities: Can walk? ${profile.capabilities.canWalk}, Leaking? ${profile.capabilities.leaking}
  
  ${culturalPrompt}

  REQUIREMENTS:
  1. Summary: Warm, encouraging, feminine tone.
  2. Phases: 3 Phases (Reconnect, Stability, Strength).
  3. Exercises: 3-4 per phase. 
     - CRITICAL: Provide detailed "howTo" steps (array of strings).
     - CRITICAL: Include a "benefits" field. Explain WHY this specific exercise helps a postpartum body.
     - Provide "whenToAvoid" specific to this user's symptoms.
     - DIVERSITY REQUIRED: Mix of positions (supine, seated, standing, all-fours).
     - NO REPETITION: Do NOT repeat the exact same exercise name across phases.
     - Choose a "visualTag" from: ['lying_back', 'all_fours', 'standing', 'seated', 'plank', 'glute_bridge', 'bird_dog', 'side_plank', 'lunge'].
     - Select the visualTag that best fits the movement pattern.
  
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
    // Use FLASH model for speed (User request: "make it fast")
    const response = await ai.models.generateContent({
      model: FAST_MODEL, 
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: schema,
      }
    });
    return JSON.parse(response.text!) as RecoveryPlan;
  } catch (error) {
    console.error("Plan Gen Error:", error);
    throw new Error("Failed to generate plan.");
  }
};

// --- 3. Analyze Exercise Video ---
export const analyzeExerciseVideo = async (file: File, exerciseName: string): Promise<VideoAnalysis> => {
  const base64Data = await fileToGenerativePart(file);
  const prompt = `User is doing "${exerciseName}". Analyze form. Give feedback, 3 corrections, and safety score (1-10).`;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      feedback: { type: Type.STRING },
      corrections: { type: Type.ARRAY, items: { type: Type.STRING } },
      safetyScore: { type: Type.NUMBER }
    },
    required: ["feedback", "corrections", "safetyScore"]
  };

  const response = await ai.models.generateContent({
    model: SMART_MODEL, // Keep Pro for video analysis as it requires high visual reasoning
    contents: { parts: [base64Data, { text: prompt }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text!) as VideoAnalysis;
};

// --- 4. Analyze Text Feedback ---
export const analyzeExerciseFeedback = async (exerciseName: string, userFeedback: string): Promise<string> => {
  const prompt = `
    User performed the postpartum exercise "${exerciseName}".
    User reported: "${userFeedback}".
    As a physical therapist specialized in women's health, provide specific advice.
    Keep it short (2-3 sentences), warm and encouraging.
  `;
  const response = await ai.models.generateContent({
    model: FAST_MODEL, // Text feedback is quick
    contents: { parts: [{ text: prompt }] },
  });
  return response.text || "Keep listening to your body.";
};

// --- 5. Health Coach Chat (With Thinking Mode) ---
export const chatWithHealthCoach = async (
  message: string, 
  history: ChatMessage[], 
  profile: UserProfile | null
): Promise<string> => {
  
  // Construct a context-rich prompt
  let context = "You are a warm, empathetic, and medically-aware Postpartum Health Coach named 'Rose'.";
  
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

  // Format history for the model (simplified)
  const conversation = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Rose'}: ${m.text}`).join('\n');
  
  const prompt = `
    ${context}

    RECENT CONVERSATION:
    ${conversation}
    User: ${message}
    Rose:
  `;

  // Keep Pro with Thinking for Chat to ensure high quality medical/emotional advice
  const response = await ai.models.generateContent({
    model: SMART_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      thinkingConfig: { thinkingBudget: 4096 } // Reduced budget slightly for better latency while keeping reasoning
    }
  });

  return response.text || "I'm here to listen. Could you tell me more about how you're feeling?";
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