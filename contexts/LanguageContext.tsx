
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ar' | 'zh' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Welcome Back, Mama",
    subtitle: "Safe, judgment-free guidance tailored to your body.",
    signIn: "Sign In",
    signOut: "Sign Out",
    getStarted: "Create My Roadmap",
    analyzing: "Analyzing physiology...",
    dailyPlan: "Daily Plan",
    consistency: "Consistency",
    coach: "Coach Me",
    aiLab: "AI Video Lab",
    medicalDisclaimer: "Medical Disclaimer: This AI assistant is for informational purposes only. Consult your doctor before exercise.",
    step1: "The Basics",
    step2: "Body Check",
    step3: "Capabilities",
    next: "Next",
    back: "Back",
    generate: "Generate Plan",
    weeksPP: "Weeks Postpartum",
    deliveryType: "Delivery Method",
    vaginal: "Vaginal Delivery",
    csection: "C-Section",
    symptoms: "Current Symptoms",
    uploadVideo: "Upload Video Clip",
    analyzeForm: "Analyze My Form",
    feedback: "Feedback",
    reset: "Reset"
  },
  es: {
    welcome: "Bienvenida de nuevo, Mamá",
    subtitle: "Guía segura y sin juicios adaptada a tu cuerpo.",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    getStarted: "Crear mi plan",
    analyzing: "Analizando fisiología...",
    dailyPlan: "Plan Diario",
    consistency: "Constancia",
    coach: "Entréname",
    aiLab: "Laboratorio de IA",
    medicalDisclaimer: "Aviso médico: Este asistente de IA es solo para fines informativos. Consulta a tu médico antes de hacer ejercicio.",
    step1: "Lo Básico",
    step2: "Chequeo Corporal",
    step3: "Capacidades",
    next: "Siguiente",
    back: "Atrás",
    generate: "Generar Plan",
    weeksPP: "Semanas Posparto",
    deliveryType: "Método de Parto",
    vaginal: "Parto Vaginal",
    csection: "Cesárea",
    symptoms: "Síntomas Actuales",
    uploadVideo: "Subir Video",
    analyzeForm: "Analizar mi Forma",
    feedback: "Comentarios",
    reset: "Reiniciar"
  },
  fr: {
    welcome: "Bon retour, Maman",
    subtitle: "Des conseils sûrs et sans jugement adaptés à votre corps.",
    signIn: "Se connecter",
    signOut: "Déconnexion",
    getStarted: "Créer ma feuille de route",
    analyzing: "Analyse de la physiologie...",
    dailyPlan: "Plan Quotidien",
    consistency: "Cohérence",
    coach: "Coachez-moi",
    aiLab: "Labo Vidéo IA",
    medicalDisclaimer: "Avis médical : Cet assistant IA est à titre informatif seulement. Consultez votre médecin avant l'exercice.",
    step1: "Les Bases",
    step2: "Bilan Corporel",
    step3: "Capacités",
    next: "Suivant",
    back: "Retour",
    generate: "Générer le Plan",
    weeksPP: "Semaines Post-partum",
    deliveryType: "Méthode d'accouchement",
    vaginal: "Voie Basse",
    csection: "Césarienne",
    symptoms: "Symptômes Actuels",
    uploadVideo: "Télécharger une vidéo",
    analyzeForm: "Analyser ma forme",
    feedback: "Retour",
    reset: "Réinitialiser"
  },
  de: {
    welcome: "Willkommen zurück, Mama",
    subtitle: "Sichere, vorurteilsfreie Anleitung, angepasst an deinen Körper.",
    signIn: "Anmelden",
    signOut: "Abmelden",
    getStarted: "Plan erstellen",
    analyzing: "Analysiere Physiologie...",
    dailyPlan: "Tagesplan",
    consistency: "Konsistenz",
    coach: "Trainiere mich",
    aiLab: "KI Video Labor",
    medicalDisclaimer: "Medizinischer Hinweis: Dieser KI-Assistent dient nur zu Informationszwecken. Konsultieren Sie Ihren Arzt.",
    step1: "Grundlagen",
    step2: "Körpercheck",
    step3: "Fähigkeiten",
    next: "Weiter",
    back: "Zurück",
    generate: "Plan Generieren",
    weeksPP: "Wochen Postpartum",
    deliveryType: "Entbindungsmethode",
    vaginal: "Vaginale Geburt",
    csection: "Kaiserschnitt",
    symptoms: "Aktuelle Symptome",
    uploadVideo: "Video hochladen",
    analyzeForm: "Form analysieren",
    feedback: "Feedback",
    reset: "Zurücksetzen"
  },
  hi: {
    welcome: "वापसी पर स्वागत है, माँ",
    subtitle: "आपके शरीर के अनुकूल सुरक्षित और निर्णय-मुक्त मार्गदर्शन।",
    signIn: "साइन इन करें",
    signOut: "साइन आउट",
    getStarted: "मेरा रोडमैप बनाएं",
    analyzing: "शारीरिक विश्लेषण हो रहा है...",
    dailyPlan: "दैनिक योजना",
    consistency: "निरंतरता",
    coach: "मुझे प्रशिक्षित करें",
    aiLab: "एआई वीडियो लैब",
    medicalDisclaimer: "चिकित्सा अस्वीकरण: यह एआई सहायक केवल सूचनात्मक उद्देश्यों के लिए है। व्यायाम से पहले डॉक्टर से सलाह लें।",
    step1: "बुनियादी जानकारी",
    step2: "शरीर की जांच",
    step3: "क्षमताएं",
    next: "अगला",
    back: "वापस",
    generate: "योजना बनाएं",
    weeksPP: "प्रसव के बाद के सप्ताह",
    deliveryType: "प्रसव विधि",
    vaginal: "सामान्य प्रसव",
    csection: "सी-सेक्शन",
    symptoms: "वर्तमान लक्षण",
    uploadVideo: "वीडियो अपलोड करें",
    analyzeForm: "मेरे व्यायाम का विश्लेषण करें",
    feedback: "प्रतिक्रिया",
    reset: "रीसेट"
  },
  ar: {
    welcome: "مرحباً بعودتك يا أمي",
    subtitle: "توجيه آمن ومصمم خصيصاً لجسمك.",
    signIn: "تسجيل الدخول",
    signOut: "خروج",
    getStarted: "إنشاء خطتي",
    analyzing: "تحليل الفسيولوجيا...",
    dailyPlan: "الخطة اليومية",
    consistency: "الاستمرارية",
    coach: "دربني",
    aiLab: "مختبر الفيديو الذكي",
    medicalDisclaimer: "إخلاء مسؤولية طبي: هذا المساعد الذكي للأغراض الإعلامية فقط. استشيري طبيبك قبل التمرين.",
    step1: "الأساسيات",
    step2: "فحص الجسم",
    step3: "القدرات",
    next: "التالي",
    back: "رجوع",
    generate: "إنشاء الخطة",
    weeksPP: "أسابيع بعد الولادة",
    deliveryType: "طريقة الولادة",
    vaginal: "ولادة طبيعية",
    csection: "ولادة قيصرية",
    symptoms: "الأعراض الحالية",
    uploadVideo: "رفع فيديو",
    analyzeForm: "تحليل أدائي",
    feedback: "تعليقات",
    reset: "إعادة ضبط"
  },
  zh: {
    welcome: "欢迎回来，妈妈",
    subtitle: "为您量身定制的安全、无偏见的康复指导。",
    signIn: "登录",
    signOut: "登出",
    getStarted: "制定我的康复路线图",
    analyzing: "正在分析生理状况...",
    dailyPlan: "每日计划",
    consistency: "坚持",
    coach: "指导我",
    aiLab: "AI 视频实验室",
    medicalDisclaimer: "免责声明：此 AI 助手仅供参考。运动前请咨询医生。",
    step1: "基本信息",
    step2: "身体检查",
    step3: "能力评估",
    next: "下一步",
    back: "上一步",
    generate: "生成计划",
    weeksPP: "产后周数",
    deliveryType: "分娩方式",
    vaginal: "顺产",
    csection: "剖腹产",
    symptoms: "当前症状",
    uploadVideo: "上传视频",
    analyzeForm: "分析我的动作",
    feedback: "反馈",
    reset: "重置"
  },
  ja: {
    welcome: "お帰りなさい、ママ",
    subtitle: "あなたの体に合わせた、安全で優しいガイダンス。",
    signIn: "サインイン",
    signOut: "サインアウト",
    getStarted: "ロードマップを作成",
    analyzing: "生理状態を分析中...",
    dailyPlan: "毎日のプラン",
    consistency: "継続性",
    coach: "コーチング",
    aiLab: "AI ビデオラボ",
    medicalDisclaimer: "免責事項：このAIアシスタントは情報提供のみを目的としています。運動前に医師に相談してください。",
    step1: "基本情報",
    step2: "ボディチェック",
    step3: "能力",
    next: "次へ",
    back: "戻る",
    generate: "プランを作成",
    weeksPP: "産後週数",
    deliveryType: "出産方法",
    vaginal: "経膣分娩",
    csection: "帝王切開",
    symptoms: "現在の症状",
    uploadVideo: "動画をアップロード",
    analyzeForm: "フォームを分析",
    feedback: "フィードバック",
    reset: "リセット"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Auto-detect language
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) {
      setLanguage(browserLang);
    }
  }, []);

  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
    