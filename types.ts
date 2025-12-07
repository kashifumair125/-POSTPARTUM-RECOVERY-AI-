import { Type } from "@google/genai";

export enum DeliveryMethod {
  VAGINAL = 'Vaginal Delivery',
  C_SECTION = 'C-Section'
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary',
  LIGHT = 'Light Activity',
  MODERATE = 'Moderate',
  ATHLETE = 'Athlete'
}

export interface UserProfile {
  name?: string;
  deliveryMethod: string;
  weeksPostpartum: number;
  symptoms: string;
  culturalContext: boolean;
  activityLevel: string;
  energyLevel: number;
  painLevel: number;
  diastasisInfo: {
    bellyAppearance: string;
    gapFeel: string;
    bulging: boolean;
  };
  capabilities: {
    canWalk: boolean;
    canStand: boolean;
    leaking: boolean;
  };
}

export interface Exercise {
  name: string;
  reps: string;
  frequency: string; // "2x per day"
  description: string; // Short summary
  howTo: string[]; // Step by step instructions
  whenToAvoid: string; // "Stop if you feel..."
  safetyNote?: string;
  visualTag: 'lying_back' | 'all_fours' | 'standing' | 'seated' | 'plank'; // For animation mapping
}

export interface RecoveryPhase {
  phaseName: string;
  weekRange: string;
  focus: string;
  description: string;
  exercises: Exercise[];
  culturalTip?: string;
}

export interface RecoveryPlan {
  summary: string;
  phases: RecoveryPhase[];
  diastasisNote?: string;
}

export interface DiastasisAnalysis {
  severity: string;
  gapEstimation: string;
  recommendation: string;
  safeToExercise: boolean;
}

export interface VideoAnalysis {
  feedback: string;
  corrections: string[];
  safetyScore: number; // 1-10
}
