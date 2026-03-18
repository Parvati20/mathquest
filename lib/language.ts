import { topicsData } from "./topicsData";

export type AppLanguage = "English" | "Hindi" | "Marathi";
export const LANGUAGE_STORAGE_KEY = "math-lang";

export const uiText = {
  English: {
    appName: "NavGurukul Math Prep",
    practiceResult: "Practice Result",
    topic: "Topic",
    correct: "Correct",
    wrong: "Wrong",
    marks: "Marks",
    score: "Score",
    accuracy: "Accuracy",
    greatWork: "Great work!",
    goodEffort: "Good effort!",
    morePractice: "More Practice",
    learnConcept: "Learn Concept",
    question: "Question",
    of: "of",
    correctFeedback: "Correct!",
    incorrect: "Incorrect.",
    chooseOption: "Please choose an option",
    submit: "Submit",
    next: "Next",
    showResult: "Show Results",
    aiMentor: "AI Mentor",
    generating: "Thinking...",
    generatingQuestions: "Generating AI Questions...",
    noQuestions: "No questions found.",
    addQuestions: "Please check back later or try a different topic.",
    fallbackBank: "Using question bank (Offline Mode)",
    aiRoundActive: "AI Round Active",
    backToTopics: "Back to Topics",
    theory: "Theory",
    formula: "Formula",
    solvedExamples: "Solved Examples",
    watchVideo: "Watch Video",
    letsGo: "Let's Go",
    logout: "Logout",
    remember: "Remember this",
    pickPower: "Pick Your Superpower",
    heroBody: "Master one topic at a time and level up your confidence",
    solved: "solved",
    pts: "pts",
    tapTopic: "Tap any topic to begin",
    thinkReady: "Think you're ready?",
    mockBody: "Take a timed mock to simulate real interview pressure",
    takeMock: "Take Mock Test",
    keepGoing: "Keep going, consistency wins",
    mockInterview: "Mock Interview Test",
    twentyQuestions: "20 questions • 10 minutes",
    mockIntro: "This test mixes all topics and gives instant performance feedback.",
    fullMarks: "Perfect Score!",
    testComplete: "Test Completed",
    perfectBody: "Outstanding work. You solved everything correctly.",
    retryBody: "Nice attempt. Review weak topics and try again.",
    weakTopics: "Weak Topics",
    noWeakTopic: "No weak topic found",
    correctAnswer: "Correct Answer",
    tryAgain: "Try Again",
    timerRunning: "timer running",
    submitTest: "Submit Test",
  },
  Hindi: {
    appName: "NavGurukul गणित तैयारी",
    practiceResult: "अभ्यास परिणाम",
    topic: "विषय",
    correct: "सही",
    wrong: "गलत",
    marks: "अंक",
    score: "स्कोर",
    accuracy: "सटीकता",
    greatWork: "बहुत बढ़िया!",
    goodEffort: "अच्छा प्रयास!",
    morePractice: "और अभ्यास",
    learnConcept: "कॉन्सेप्ट सीखें",
    question: "प्रश्न",
    of: "में से",
    correctFeedback: "सही जवाब!",
    incorrect: "गलत जवाब।",
    chooseOption: "कृपया एक विकल्प चुनें",
    submit: "सबमिट",
    next: "अगला",
    showResult: "परिणाम देखें",
    aiMentor: "AI गुरु",
    generating: "सोच रहा हूँ...",
    generatingQuestions: "AI प्रश्न बना रहा है...",
    noQuestions: "प्रश्न नहीं मिले।",
    addQuestions: "कृपया बाद में देखें या कोई और विषय चुनें।",
    fallbackBank: "प्रश्न बैंक (ऑफलाइन मोड)",
    aiRoundActive: "AI राउंड सक्रिय",
    backToTopics: "विषयों पर वापस",
    theory: "सिद्धांत",
    formula: "सूत्र",
    solvedExamples: "हल किए हुए उदाहरण",
    watchVideo: "वीडियो देखें",
    letsGo: "चलो शुरू करें",
    logout: "लॉगआउट",
    remember: "याद रखें",
    pickPower: "अपनी Superpower चुनो",
    heroBody: "एक-एक विषय अच्छे से सीखो और आत्मविश्वास बढ़ाओ",
    solved: "हल",
    pts: "अंक",
    tapTopic: "शुरू करने के लिए कोई विषय चुनें",
    thinkReady: "तैयार हो?",
    mockBody: "रियल इंटरव्यू जैसा अनुभव पाने के लिए मॉक टेस्ट दो",
    takeMock: "मॉक टेस्ट दें",
    keepGoing: "लगातार अभ्यास करते रहो",
    mockInterview: "मॉक इंटरव्यू टेस्ट",
    twentyQuestions: "20 प्रश्न • 10 मिनट",
    mockIntro: "यह टेस्ट सभी विषयों से प्रश्न लेकर आपकी तैयारी जांचता है।",
    fullMarks: "पूरा स्कोर!",
    testComplete: "टेस्ट पूरा हुआ",
    perfectBody: "शानदार! आपने सभी प्रश्न सही किए।",
    retryBody: "अच्छी कोशिश। कमजोर विषय दोहराएं और फिर प्रयास करें।",
    weakTopics: "कमजोर विषय",
    noWeakTopic: "कोई कमजोर विषय नहीं मिला",
    correctAnswer: "सही उत्तर",
    tryAgain: "फिर से प्रयास करें",
    timerRunning: "टाइमर चल रहा है",
    submitTest: "टेस्ट सबमिट करें",
  },
  Marathi: {
    appName: "NavGurukul गणित तयारी",
    practiceResult: "सराव निकाल",
    topic: "विषय",
    correct: "बरोबर",
    wrong: "चुकीचे",
    marks: "गुण",
    score: "स्कोर",
    accuracy: "अचूकता",
    greatWork: "खूप छान!",
    goodEffort: "छान प्रयत्न!",
    morePractice: "आणखी सराव",
    learnConcept: "संकल्पना शिका",
    question: "प्रश्न",
    of: "पैकी",
    correctFeedback: "बरोबर उत्तर!",
    incorrect: "चुकीचे उत्तर.",
    chooseOption: "कृपया एक पर्याय निवडा",
    submit: "सबमिट",
    next: "पुढे",
    showResult: "निकाल पाहा",
    aiMentor: "AI मार्गदर्शक",
    generating: "विचार चालू आहे...",
    generatingQuestions: "AI प्रश्न तयार करत आहे...",
    noQuestions: "प्रश्न सापडले नाहीत.",
    addQuestions: "कृपया नंतर पुन्हा प्रयत्न करा किंवा दुसरा विषय निवडा.",
    fallbackBank: "प्रश्नसंच वापरला जात आहे (ऑफलाइन मोड)",
    aiRoundActive: "AI राउंड सक्रिय",
    backToTopics: "विषयांकडे परत",
    theory: "सिद्धांत",
    formula: "सूत्र",
    solvedExamples: "सोडवलेली उदाहरणे",
    watchVideo: "व्हिडिओ पाहा",
    letsGo: "चला सुरू करूया",
    logout: "लॉगआउट",
    remember: "हे लक्षात ठेवा",
    pickPower: "तुमची Superpower निवडा",
    heroBody: "एकेक विषय मास्टर करा आणि आत्मविश्वास वाढवा",
    solved: "सोडवले",
    pts: "गुण",
    tapTopic: "कोणताही विषय निवडा आणि सुरू करा",
    thinkReady: "मुलाखतीसाठी तयार आहात?",
    mockBody: "खऱ्या इंटरव्यूचा अनुभव घेण्यासाठी टाइम्ड मॉक टेस्ट द्या",
    takeMock: "आता Mock Test द्या",
    keepGoing: "रोजचा सराव तुम्हाला पुढे नेतो",
    mockInterview: "मॉक इंटरव्यू टेस्ट",
    twentyQuestions: "20 प्रश्न • 10 मिनिटे",
    mockIntro: "या टेस्टमध्ये सर्व विषयांमधून प्रश्न येतील आणि त्वरित फीडबॅक मिळेल.",
    fullMarks: "पूर्ण गुण!",
    testComplete: "टेस्ट पूर्ण झाली",
    perfectBody: "अप्रतिम! सर्व प्रश्न बरोबर सोडवले.",
    retryBody: "छान प्रयत्न. कमकुवत विषय पुन्हा करा आणि पुन्हा टेस्ट द्या.",
    weakTopics: "कमकुवत विषय",
    noWeakTopic: "कमकुवत विषय आढळला नाही",
    correctAnswer: "बरोबर उत्तर",
    tryAgain: "पुन्हा प्रयत्न करा",
    timerRunning: "टायमर सुरू आहे",
    submitTest: "टेस्ट सबमिट करा",
  },
};

type UiTextMap = typeof uiText;
export type UiText = UiTextMap["English"];

const localizedTopics: Record<AppLanguage, Record<string, (typeof topicsData)[keyof typeof topicsData]>> = {
  English: topicsData,
  Hindi: {
    "number-patterns": {
      ...topicsData["number-patterns"],
      title: "संख्या पैटर्न",
      theory: "संख्या पैटर्न ऐसी श्रृंखलाएं हैं जो एक नियम का पालन करती हैं। नियम पहचानकर अगली संख्या निकाली जाती है।",
      formula: "अंकगणित पैटर्न: a, a+d, a+2d...\nज्यामितीय पैटर्न: a, a×r, a×r²...",
      examples: [
        { q: "अगली संख्या बताओ: 2, 5, 8, 11, ?", a: "हर बार 3 जोड़ रहे हैं। अगली = 14" },
        { q: "अगली संख्या बताओ: 3, 6, 12, 24, ?", a: "हर बार 2 से गुणा। अगली = 48" },
      ],
    },
    percentage: {
      ...topicsData.percentage,
      title: "प्रतिशत",
      theory: "प्रतिशत का मतलब है सौ में से हिस्सा।",
      formula: "प्रतिशत = (भाग / कुल) × 100\nभाग = (प्रतिशत × कुल) / 100",
      examples: [
        { q: "150 का 20% कितना है?", a: "(20/100) × 150 = 30" },
      ],
    },
    "work-time": {
      ...topicsData["work-time"],
      title: "काम और समय",
      theory: "काम-समय में समय और कार्य-दर (efficiency) का संबंध समझा जाता है।",
      formula: "कुल काम = दक्षता × समय\nA+B का समय = (a × b) / (a + b)",
      examples: [
        { q: "A 10 दिन में और B 15 दिन में काम करता है। साथ में?", a: "दर = 1/10 + 1/15 = 1/6, समय = 6 दिन" },
      ],
    },
    "linear-equations": {
      ...topicsData["linear-equations"],
      title: "रैखिक समीकरण",
      theory: "रैखिक समीकरण में चर की घात 1 होती है और ग्राफ सीधी रेखा देता है।",
      formula: "मानक रूप: ax + b = c\ny = mx + c",
      examples: [
        { q: "हल करो: 2x + 5 = 15", a: "2x = 10 इसलिए x = 5" },
      ],
    },
    "simple-interest": {
      ...topicsData["simple-interest"],
      title: "साधारण ब्याज",
      theory: "साधारण ब्याज मूलधन, दर और समय पर निकाला जाता है।",
      formula: "SI = (P × R × T) / 100\nAmount = Principal + SI",
      examples: [
        { q: "P=1000, R=5%, T=2 वर्ष। SI?", a: "SI = (1000 × 5 × 2)/100 = 100" },
      ],
    },
    "profit-loss": {
      ...topicsData["profit-loss"],
      title: "लाभ और हानि",
      theory: "SP > CP हो तो लाभ, और CP > SP हो तो हानि।",
      formula: "लाभ % = (लाभ/CP) × 100\nहानि % = (हानि/CP) × 100",
      examples: [
        { q: "100 में खरीदा, 120 में बेचा। लाभ %?", a: "लाभ = 20, लाभ% = 20%" },
      ],
    },
  },
  Marathi: {
    "number-patterns": {
      ...topicsData["number-patterns"],
      title: "संख्या पॅटर्न",
      theory: "संख्या पॅटर्न म्हणजे ठराविक नियमाने चालणाऱ्या संख्यांची मालिका.",
      formula: "अंकगणित पॅटर्न: a, a+d, a+2d...\nभूमितीय पॅटर्न: a, a×r, a×r²...",
      examples: [
        { q: "पुढची संख्या शोधा: 2, 5, 8, 11, ?", a: "प्रत्येक वेळी 3 ने वाढते. पुढची = 14" },
        { q: "पुढची संख्या शोधा: 3, 6, 12, 24, ?", a: "प्रत्येक वेळी 2 ने गुणिले. पुढची = 48" },
      ],
    },
    percentage: {
      ...topicsData.percentage,
      title: "टक्केवारी",
      theory: "टक्केवारी म्हणजे शंभरातून भाग व्यक्त करण्याची पद्धत.",
      formula: "टक्केवारी = (भाग / एकूण) × 100\nभाग = (टक्केवारी × एकूण) / 100",
      examples: [
        { q: "150 चे 20% किती?", a: "(20/100) × 150 = 30" },
      ],
    },
    "work-time": {
      ...topicsData["work-time"],
      title: "काम आणि वेळ",
      theory: "काम-वेळ प्रश्नांमध्ये कामाची गती आणि लागणारा वेळ यांचा संबंध समजतो.",
      formula: "एकूण काम = कार्यक्षमता × वेळ\nA+B वेळ = (a × b) / (a + b)",
      examples: [
        { q: "A 10 दिवसात आणि B 15 दिवसात काम करतो. दोघे मिळून?", a: "दर = 1/10 + 1/15 = 1/6, वेळ = 6 दिवस" },
      ],
    },
    "linear-equations": {
      ...topicsData["linear-equations"],
      title: "रेषीय समीकरणे",
      theory: "रेषीय समीकरणात चलाचा घात 1 असतो आणि ग्राफ सरळ रेषा असतो.",
      formula: "मानक रूप: ax + b = c\ny = mx + c",
      examples: [
        { q: "सोडवा: 2x + 5 = 15", a: "2x = 10 म्हणून x = 5" },
      ],
    },
    "simple-interest": {
      ...topicsData["simple-interest"],
      title: "साधे व्याज",
      theory: "साधे व्याज हे मूळ रक्कम, दर आणि वेळ यावर आधारित असते.",
      formula: "SI = (P × R × T) / 100\nAmount = Principal + SI",
      examples: [
        { q: "P=1000, R=5%, T=2 वर्षे. SI किती?", a: "SI = (1000 × 5 × 2)/100 = 100" },
      ],
    },
    "profit-loss": {
      ...topicsData["profit-loss"],
      title: "नफा आणि तोटा",
      theory: "SP > CP असेल तर नफा, CP > SP असेल तर तोटा.",
      formula: "नफा % = (नफा/CP) × 100\nतोटा % = (तोटा/CP) × 100",
      examples: [
        { q: "100 ला विकत घेतले, 120 ला विकले. नफा %?", a: "नफा = 20, नफा % = 20%" },
      ],
    },
  },
};

export function getUiText(language: AppLanguage): UiText {
  return uiText[language] || uiText.English;
}

export function getLocalizedDifficultyLabel(diff: string, language: AppLanguage) {
  const labels: Record<AppLanguage, Record<string, string>> = {
    English: { easy: "Easy", medium: "Medium", hard: "Hard" },
    Hindi: { easy: "आसान", medium: "मध्यम", hard: "कठिन" },
    Marathi: { easy: "सोपे", medium: "मध्यम", hard: "कठीण" },
  };

  return labels[language]?.[diff] || diff;
}

export function getLocalizedTopicContent(topicId: string, language: AppLanguage) {
  const localized = localizedTopics[language]?.[topicId];
  if (localized) {
    return localized;
  }

  const fallback = topicsData[topicId as keyof typeof topicsData];
  return fallback || { title: topicId, theory: "", formula: "", examples: [] };
}

function localizeGeneratedQuestionText(text: string, language: AppLanguage): string {
  if (language === "English") {
    return text;
  }

  const replace = (source: string, english: string, hindi: string, marathi: string) => {
    if (language === "Hindi") {
      return source.replace(english, hindi);
    }

    return source.replace(english, marathi);
  };

  let localized = text;

  localized = replace(localized, "What comes next:", "अगली संख्या क्या होगी:", "पुढची संख्या कोणती:");
  localized = replace(localized, "Find the next term:", "अगला पद ज्ञात करें:", "पुढचा पद शोधा:");
  localized = replace(localized, "What is ", "क्या है ", "किती आहे ");
  localized = replace(localized, " is what percent of ", " , का कितने प्रतिशत है ", " हे ");
  localized = replace(localized, "After a ", "यदि ", "जर ");
  localized = replace(localized, "% increase, a value becomes ", "% बढ़ोतरी के बाद मान ", "% वाढीनंतर मूल्य ");
  localized = replace(localized, ". Original value is", " हो जाता है। मूल मान है", " होते. मूळ मूल्य आहे");
  localized = replace(localized, "If A does 1/", "यदि A एक दिन में 1/", "जर A एका दिवशी 1/");
  localized = replace(localized, " of work in one day, A alone finishes the work in how many days?", " काम करता है, तो A अकेला काम कितने दिनों में पूरा करेगा?", " काम करतो, तर A एकट्याने काम किती दिवसांत पूर्ण करेल?");
  localized = replace(localized, "A can finish a work in ", "A एक काम ", "A एक काम ");
  localized = replace(localized, " days and B in ", " दिनों में और B ", " दिवसांत आणि B ");
  localized = replace(localized, " days. Together they finish in how many days?", " दिनों में करता है। साथ में कितने दिन लगेंगे?", " दिवसांत करतो. दोघांना मिळून किती दिवस लागतील?");
  localized = replace(localized, "A and B together finish a work in ", "A और B मिलकर एक काम ", "A आणि B मिळून एक काम ");
  localized = replace(localized, " days. A alone takes ", " दिनों में करते हैं। A अकेला ", " दिवसांत करतात. A एकटा ");
  localized = replace(localized, " days. B alone takes", " दिन लेता है। B अकेला लेगा", " दिवस घेतो. B एकटा घेईल");
  localized = replace(localized, "If x + y = ", "यदि x + y = ", "जर x + y = ");
  localized = replace(localized, " and y = ", " और y = ", " आणि y = ");
  localized = replace(localized, ", then x = ?", ", तो x = ?", ", तर x = ?");
  localized = replace(localized, "Solve for x:", "x के लिए हल करें:", "x साठी सोडवा:");
  localized = replace(localized, "If ", "यदि ", "जर ");
  localized = replace(localized, " then y = ?", " तो y = ?", " तर y = ?");
  localized = replace(localized, "Find simple interest:", "सरल ब्याज ज्ञात करें:", "साधे व्याज शोधा:");
  localized = replace(localized, " years", " वर्ष", " वर्षे");
  localized = replace(localized, "rate=", "दर=", "दर=");
  localized = replace(localized, " and time=", " और समय=", " आणि वेळ=");
  localized = replace(localized, ", principal is", ", मूलधन है", ", मूळ रक्कम आहे");
  localized = replace(localized, "At what rate (in %) will principal ", "किस दर (%) पर मूलधन ", "कोणत्या दराने (%) मूळ रक्कम ");
  localized = replace(localized, " double in ", " , में दोगुना होगा ", " , मध्ये दुप्पट होईल ");
  localized = replace(localized, " on simple interest?", " सरल ब्याज पर?", " साध्या व्याजावर?");
  localized = replace(localized, "If CP=", "यदि CP=", "जर CP=");
  localized = replace(localized, " and SP=", " और SP=", " आणि SP=");
  localized = replace(localized, ", profit is", ", लाभ है", ", नफा आहे");
  localized = replace(localized, "An item of CP=", "CP= वाली वस्तु ", "CP= असलेली वस्तू ");
  localized = replace(localized, " is sold at ", " को ", " ला ");
  localized = replace(localized, "% profit. Profit amount is", "% लाभ पर बेचा गया। लाभ राशि है", "% नफ्यावर विकली. नफा रक्कम आहे");
  localized = replace(localized, "An item is sold for ", "एक वस्तु ", "एक वस्तू ");
  localized = replace(localized, " at ", " पर ", " वर ");
  localized = replace(localized, "% loss. Cost price is", "% हानि पर बेची गई। क्रय मूल्य है", "% तोट्यावर विकली. खरेदी किंमत आहे");

  // Special handling for: "X is what percent of Y?"
  if (language === "Hindi") {
    localized = localized.replace(/^(\d+)\s*, का कितने प्रतिशत है\s*(\d+)\?$/i, "$1, $2 का कितने प्रतिशत है?");
  }
  if (language === "Marathi") {
    localized = localized.replace(/^(\d+)\s*हे\s*(\d+)\?$/i, "$1 हे $2 चे किती टक्के आहे?");
  }

  return localized;
}
export function getLocalizedQuestion<T extends {
  translations?: Partial<Record<AppLanguage, { question: string; options: string[]; explanation: string }>>;
  question: string;
  options: string[];
  explanation: string;
}>(question: T | null, language: AppLanguage): T | null {
  if (!question) {
    return null;
  }

  const translated = question.translations?.[language];
  if (!translated) {
    if (language === "English") {
      return question;
    }

    return {
      ...question,
      question: localizeGeneratedQuestionText(question.question, language),
    };
  }

  return {
    ...question,
    question: translated.question,
    options: translated.options,
    explanation: translated.explanation,
  };
}

export const languageOptions: AppLanguage[] = ["English", "Hindi", "Marathi"];
