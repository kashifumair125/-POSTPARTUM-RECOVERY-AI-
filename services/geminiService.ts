import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecoveryPlan, VideoAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-pro-preview';

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
    model: MODEL_NAME,
    contents: { parts: [base64Data, { text: prompt }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  
  return JSON.parse(response.text!);
};

// --- 2. Generate Recovery Roadmap ---
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
  1. Summary: Warm, encouraging.
  2. Phases: 3 Phases (Reconnect, Stability, Strength).
  3. Exercises: 3-4 per phase. 
     - CRITICAL: Provide detailed "howTo" steps (array of strings).
     - Provide "whenToAvoid" specific to this user's symptoms.
     - Choose a "visualTag" from: ['lying_back', 'all_fours', 'standing', 'seated', 'plank'].
  
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
                  howTo: { type: Type.ARRAY, items: { type: Type.STRING } },
                  whenToAvoid: { type: Type.STRING },
                  safetyNote: { type: Type.STRING },
                  visualTag: { type: Type.STRING, enum: ['lying_back', 'all_fours', 'standing', 'seated', 'plank'] }
                },
                required: ["name", "reps", "frequency", "description", "howTo", "whenToAvoid", "visualTag"]
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
      model: MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json", responseSchema: schema }
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
    model: MODEL_NAME,
    contents: { parts: [base64Data, { text: prompt }] },
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text!) as VideoAnalysis;
};

// --- 4. Analyze Text Feedback (Step 4 in user flow) ---
export const analyzeExerciseFeedback = async (exerciseName: string, userFeedback: string): Promise<string> => {
  const prompt = `
    User performed the postpartum exercise "${exerciseName}".
    User reported: "${userFeedback}".
    
    As a physical therapist, provide specific advice. 
    If they report pain, tell them to stop and try a modification.
    If they feel nothing, suggest how to engage better.
    Keep it short (2-3 sentences).
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });

  return response.text || "Keep listening to your body. If pain persists, consult your doctor.";
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
