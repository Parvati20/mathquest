import { topicsData } from "@/lib/topicsData";
import type { TopicQuestion } from "@/lib/questionsData";

export type AppLanguage = "English" | "Hindi" | "Marathi";

export const LANGUAGE_STORAGE_KEY = "mathquest-language";
export const languageOptions: AppLanguage[] = ["English", "Hindi", "Marathi"];

const uiText = {
  English: {
    appName: "NavGurukul Math Prep",
    logout: "Logout",
    remember: "Remember: Every expert was once a beginner. You've got this!",
    pickPower: "Pick Your Superpower!",
    heroBody: "Every topic you master brings you closer to NavGurukul. Let's crush it!",
    solved: "solved",
    pts: "pts",
    letsGo: "Let's Go!",
    thinkReady: "Think you're ready? Prove it!",
    mockBody: "Face 20 real interview-style questions in 15 minutes.",
    takeMock: "Take Mock Test Now!",
    keepGoing: "You're on fire! Keep this energy going!",
    tapTopic: "Tap any topic to start your journey",
    backToTopics: "Back to Topics",
    learnConcept: "Learn Concept",
    theory: "Theory",
    formula: "Formula",
    solvedExamples: "Solved Examples",
    watchVideo: "Watch Video",
    noQuestions: "No questions available yet",
    addQuestions: "Please add more questions for this difficulty.",
    practiceResult: "Practice Result",
    topic: "Topic",
    correct: "Correct",
    wrong: "Wrong",
    marks: "Marks",
    accuracy: "Accuracy",
    greatWork: "Great work! Fataka phodo!",
    goodEffort: "Good effort. Keep practicing and level up.",
    morePractice: "Do you want more practice? Start New 25 Questions",
    question: "Question",
    of: "of",
    chooseOption: "Choose one option and submit.",
    submit: "Submit",
    next: "Next",
    showResult: "Show Result",
    generating: "Generating explanation...",
    aiMentor: "AI Mentor",
    incorrect: "Incorrect.",
    correctFeedback: "Correct! Fataka phodo!",
    mockInterview: "Mock Interview Test",
    twentyQuestions: "20 questions • 15 minutes",
    mockIntro: "This test simulates the real NavGurukul math interview. Questions are mixed from all topics.",
    timerRunning: "Timer Running",
    submitTest: "Submit Test",
    testComplete: "Test Complete! Well done!",
    fullMarks: "Outstanding! Full Marks!",
    perfectBody: "Everything correct. Big celebration!",
    retryBody: "Keep going. Your next attempt can be even stronger.",
    score: "Score",
    weakTopics: "Weak Topics",
    noWeakTopic: "No weak topic. Excellent performance.",
    correctAnswer: "Correct answer",
    tryAgain: "Try Again - You Can Do Better!",
  },
  Hindi: {
    appName: "NavGurukul गणित तैयारी",
    logout: "Logout",
    remember: "याद रखो: हर expert कभी beginner था। तुम कर सकते हो!",
    pickPower: "अपनी सुपरपावर चुनो!",
    heroBody: "हर topic जो तुम master करोगे, तुम्हें NavGurukul के और करीब ले जाएगा।",
    solved: "हल",
    pts: "अंक",
    letsGo: "चलो शुरू करें!",
    thinkReady: "लगता है तुम तैयार हो? साबित करो!",
    mockBody: "15 मिनट में 20 interview-style सवाल हल करो।",
    takeMock: "अभी Mock Test दो!",
    keepGoing: "तुम शानदार कर रहे हो। ऐसे ही चलते रहो!",
    tapTopic: "कोई भी topic tap करो और शुरू करो",
    backToTopics: "Topics पर वापस जाओ",
    learnConcept: "Concept सीखो",
    theory: "Theory",
    formula: "Formula",
    solvedExamples: "हल किए हुए उदाहरण",
    watchVideo: "वीडियो देखो",
    noQuestions: "अभी इस level के लिए questions उपलब्ध नहीं हैं",
    addQuestions: "इस difficulty के लिए और questions जोड़ो।",
    practiceResult: "Practice Result",
    topic: "विषय",
    correct: "सही",
    wrong: "गलत",
    marks: "अंक",
    accuracy: "सटीकता",
    greatWork: "बहुत बढ़िया! ऐसे ही जारी रखो!",
    goodEffort: "अच्छी कोशिश। Practice करते रहो और improve करो।",
    morePractice: "और practice करनी है? 25 नए सवाल शुरू करो",
    question: "प्रश्न",
    of: "में से",
    chooseOption: "एक option चुनो और submit करो।",
    submit: "Submit",
    next: "अगला",
    showResult: "Result देखो",
    generating: "Explanation बन रही है...",
    aiMentor: "AI Mentor",
    incorrect: "गलत।",
    correctFeedback: "सही! शानदार!",
    mockInterview: "Mock Interview Test",
    twentyQuestions: "20 सवाल • 15 मिनट",
    mockIntro: "यह test असली NavGurukul math interview जैसा है। इसमें सभी topics से mixed सवाल होंगे।",
    timerRunning: "Timer चल रहा है",
    submitTest: "Test Submit करो",
    testComplete: "Test पूरा हुआ! बहुत बढ़िया!",
    fullMarks: "कमाल! पूरे अंक!",
    perfectBody: "सब सही। बड़ी celebration बनती है!",
    retryBody: "ऐसे ही मेहनत करते रहो। अगली बार score और बेहतर होगा।",
    score: "स्कोर",
    weakTopics: "कमज़ोर Topics",
    noWeakTopic: "कोई weak topic नहीं। शानदार प्रदर्शन।",
    correctAnswer: "सही उत्तर",
    tryAgain: "फिर से कोशिश करो - और बेहतर कर सकते हो!",
  },
  Marathi: {
    appName: "NavGurukul गणित तयारी",
    logout: "Logout",
    remember: "लक्षात ठेवा: प्रत्येक expert एकदा beginner होता. तुम्ही नक्की करू शकता!",
    pickPower: "तुमची सुपरपॉवर निवडा!",
    heroBody: "तुम्ही ज्या topic मध्ये मजबूत व्हाल, त्याने तुम्ही NavGurukul च्या आणखी जवळ जाल.",
    solved: "सोडवले",
    pts: "गुण",
    letsGo: "चला सुरू करूया!",
    thinkReady: "वाटतंय तयार आहात? सिद्ध करा!",
    mockBody: "15 मिनिटांत 20 interview-style प्रश्न सोडवा.",
    takeMock: "आता Mock Test द्या!",
    keepGoing: "तुमची गती छान आहे. अशीच चालू ठेवा!",
    tapTopic: "कोणताही topic tap करा आणि सुरू करा",
    backToTopics: "Topics कडे परत जा",
    learnConcept: "Concept शिका",
    theory: "Theory",
    formula: "Formula",
    solvedExamples: "उदाहरणांसह उत्तर",
    watchVideo: "व्हिडिओ पाहा",
    noQuestions: "या level साठी अजून प्रश्न उपलब्ध नाहीत",
    addQuestions: "या difficulty साठी आणखी प्रश्न जोडा.",
    practiceResult: "Practice Result",
    topic: "विषय",
    correct: "बरोबर",
    wrong: "चुकीचे",
    marks: "गुण",
    accuracy: "अचूकता",
    greatWork: "खूप छान! असेच करत रहा!",
    goodEffort: "छान प्रयत्न. Practice करत रहा आणि आणखी चांगले व्हा.",
    morePractice: "आणखी practice हवी आहे? 25 नवीन प्रश्न सुरू करा",
    question: "प्रश्न",
    of: "पैकी",
    chooseOption: "एक option निवडा आणि submit करा.",
    submit: "Submit",
    next: "पुढे",
    showResult: "Result पाहा",
    generating: "Explanation तयार होत आहे...",
    aiMentor: "AI Mentor",
    incorrect: "चूक.",
    correctFeedback: "बरोबर! छान केलं!",
    mockInterview: "Mock Interview Test",
    twentyQuestions: "20 प्रश्न • 15 मिनिटे",
    mockIntro: "ही test खऱ्या NavGurukul math interview सारखी आहे. सर्व topics मधून mixed प्रश्न येतील.",
    timerRunning: "Timer सुरू आहे",
    submitTest: "Test Submit करा",
    testComplete: "Test पूर्ण झाला! छान काम!",
    fullMarks: "अप्रतिम! पूर्ण गुण!",
    perfectBody: "सगळे बरोबर. मोठी celebration हवी!",
    retryBody: "असेच चालू ठेवा. पुढचा प्रयत्न अजून चांगला होऊ शकतो.",
    score: "स्कोर",
    weakTopics: "कमकुवत Topics",
    noWeakTopic: "कोणताही weak topic नाही. उत्कृष्ट कामगिरी.",
    correctAnswer: "बरोबर उत्तर",
    tryAgain: "पुन्हा प्रयत्न करा - अजून चांगले करू शकता!",
  },
} as const;

const topicTranslations = {
  English: {
    "number-patterns": {
      title: topicsData["number-patterns"].title,
      theory: topicsData["number-patterns"].theory,
      formula: topicsData["number-patterns"].formula,
      examples: topicsData["number-patterns"].examples,
    },
    percentage: {
      title: topicsData.percentage.title,
      theory: topicsData.percentage.theory,
      formula: topicsData.percentage.formula,
      examples: topicsData.percentage.examples,
    },
    "work-time": {
      title: topicsData["work-time"].title,
      theory: topicsData["work-time"].theory,
      formula: topicsData["work-time"].formula,
      examples: topicsData["work-time"].examples,
    },
    "linear-equations": {
      title: topicsData["linear-equations"].title,
      theory: topicsData["linear-equations"].theory,
      formula: topicsData["linear-equations"].formula,
      examples: topicsData["linear-equations"].examples,
    },
    "simple-interest": {
      title: topicsData["simple-interest"].title,
      theory: topicsData["simple-interest"].theory,
      formula: topicsData["simple-interest"].formula,
      examples: topicsData["simple-interest"].examples,
    },
    "profit-loss": {
      title: topicsData["profit-loss"].title,
      theory: topicsData["profit-loss"].theory,
      formula: topicsData["profit-loss"].formula,
      examples: topicsData["profit-loss"].examples,
    },
  },
  Hindi: {
    "number-patterns": {
      title: "संख्या पैटर्न",
      theory: "Number patterns ऐसी संख्याओं की श्रेणी होती है जो किसी निश्चित गणितीय नियम का पालन करती है। Pattern पहचानने का मतलब है लगातार आने वाली संख्याओं के बीच का नियम समझना।",
      formula: "Arithmetic Pattern: a, a+d, a+2d...\nGeometric Pattern: a, a×r, a×r²...",
      examples: [
        { q: "अगली संख्या खोजो: 2, 5, 8, 11, ?", a: "Pattern: हर बार 3 जोड़ रहे हैं। अगली संख्या = 11 + 3 = 14" },
        { q: "अगली संख्या खोजो: 3, 6, 12, 24, ?", a: "Pattern: हर बार 2 से गुणा हो रहा है। अगली संख्या = 24 × 2 = 48" },
      ],
    },
    percentage: {
      title: "प्रतिशत",
      theory: "Percentage का मतलब है 'प्रति सौ'। यह किसी संख्या को 100 के भिन्न के रूप में व्यक्त करने का तरीका है।",
      formula: "Percentage = (Part / Whole) × 100\nPart = (Percentage × Whole) / 100",
      examples: [{ q: "150 का 20% क्या है?", a: "20% of 150 = (20/100) × 150 = 30" }],
    },
    "work-time": {
      title: "कार्य और समय",
      theory: "Work and time के सवाल किसी काम को पूरा करने में लगने वाले समय और काम की गति के संबंध पर आधारित होते हैं।",
      formula: "Total Work = Efficiency × Time\nCombined Time (A+B) = (a × b) / (a + b)",
      examples: [{ q: "A 10 दिन में और B 15 दिन में काम करता है। साथ में?", a: "Combined rate = 1/10 + 1/15 = 1/6. साथ में = 6 दिन" }],
    },
    "linear-equations": {
      title: "रेखिक समीकरण",
      theory: "Linear equation एक ऐसा algebraic equation है जिसमें हर term की घात 1 होती है। Graph पर यह सीधी रेखा बनाती है।",
      formula: "Standard Form: ax + b = c\ny = mx + c (Slope-Intercept Form)",
      examples: [{ q: "x के लिए हल करो: 2x + 5 = 15", a: "2x = 10 => x = 5" }],
    },
    "simple-interest": {
      title: "साधारण ब्याज",
      theory: "Simple interest मूलधन, ब्याज दर और समय के आधार पर निकाला जाता है।",
      formula: "SI = (P × R × T) / 100\nAmount = Principal + SI",
      examples: [{ q: "P=1000, R=5%, T=2 वर्ष. SI निकालो।", a: "SI = (1000 × 5 × 2) / 100 = ₹100" }],
    },
    "profit-loss": {
      title: "लाभ और हानि",
      theory: "जब Selling Price, Cost Price से अधिक हो तो profit होता है। जब Cost Price, Selling Price से अधिक हो तो loss होता है।",
      formula: "Profit % = (Profit/CP) × 100\nLoss % = (Loss/CP) × 100",
      examples: [{ q: "100 में खरीदा, 120 में बेचा। Profit %?", a: "Profit = 20. Profit % = 20%" }],
    },
  },
  Marathi: {
    "number-patterns": {
      title: "संख्या पॅटर्न",
      theory: "Number patterns म्हणजे अशा संख्यांची मालिका जी एका ठराविक गणिती नियमाने चालते. Pattern ओळखणे म्हणजे सलग संख्यांमधला नियम समजणे.",
      formula: "Arithmetic Pattern: a, a+d, a+2d...\nGeometric Pattern: a, a×r, a×r²...",
      examples: [
        { q: "पुढची संख्या शोधा: 2, 5, 8, 11, ?", a: "Pattern: प्रत्येक वेळी 3 ची बेरीज होते. पुढची संख्या = 11 + 3 = 14" },
        { q: "पुढची संख्या शोधा: 3, 6, 12, 24, ?", a: "Pattern: प्रत्येक वेळी 2 ने गुणाकार होतो. पुढची संख्या = 24 × 2 = 48" },
      ],
    },
    percentage: {
      title: "टक्केवारी",
      theory: "Percentage म्हणजे 'शंभरामागे'. एखाद्या संख्येला 100 च्या भिन्नामध्ये व्यक्त करण्याची पद्धत आहे.",
      formula: "Percentage = (Part / Whole) × 100\nPart = (Percentage × Whole) / 100",
      examples: [{ q: "150 चे 20% किती?", a: "20% of 150 = (20/100) × 150 = 30" }],
    },
    "work-time": {
      title: "काम आणि वेळ",
      theory: "Work and time चे प्रश्न एखादे काम पूर्ण करण्यासाठी लागणारा वेळ आणि कामाचा वेग यांच्यातील संबंधावर आधारित असतात.",
      formula: "Total Work = Efficiency × Time\nCombined Time (A+B) = (a × b) / (a + b)",
      examples: [{ q: "A 10 दिवसांत आणि B 15 दिवसांत काम पूर्ण करतो. दोघे मिळून?", a: "Combined rate = 1/10 + 1/15 = 1/6. दोघे मिळून = 6 दिवस" }],
    },
    "linear-equations": {
      title: "रेषीय समीकरणे",
      theory: "Linear equation हे असे algebraic equation आहे ज्यातील प्रत्येक term ची घात 1 असते. Graph वर ते सरळ रेषा बनवते.",
      formula: "Standard Form: ax + b = c\ny = mx + c (Slope-Intercept Form)",
      examples: [{ q: "x साठी सोडवा: 2x + 5 = 15", a: "2x = 10 => x = 5" }],
    },
    "simple-interest": {
      title: "साधे व्याज",
      theory: "Simple interest हे मूळरक्कम, व्याजदर आणि कालावधी यांवर आधारित काढले जाते.",
      formula: "SI = (P × R × T) / 100\nAmount = Principal + SI",
      examples: [{ q: "P=1000, R=5%, T=2 वर्षे. SI शोधा.", a: "SI = (1000 × 5 × 2) / 100 = ₹100" }],
    },
    "profit-loss": {
      title: "नफा आणि तोटा",
      theory: "जेव्हा Selling Price हा Cost Price पेक्षा जास्त असतो तेव्हा profit होतो. Cost Price जास्त असेल तर loss होतो.",
      formula: "Profit % = (Profit/CP) × 100\nLoss % = (Loss/CP) × 100",
      examples: [{ q: "100 ला विकत घेतले, 120 ला विकले. Profit %?", a: "Profit = 20. Profit % = 20%" }],
    },
  },
} as const;

function applyRules(text: string, rules: Array<[RegExp, (...args: string[]) => string]>): string {
  for (const [pattern, replacement] of rules) {
    if (pattern.test(text)) {
      return text.replace(pattern, (...match) => replacement(...(match.slice(1, -2) as string[])));
    }
  }
  return text;
}

const hindiRules: Array<[RegExp, (...args: string[]) => string]> = [
  [/^What comes next: (.+)$/u, (sequence) => `अगला क्या होगा: ${sequence}`],
  [/^Find the next term: (.+)$/u, (sequence) => `अगला पद खोजो: ${sequence}`],
  [/^What is (\d+)% of (\d+)\?$/u, (percent, base) => `${base} का ${percent}% क्या है?`],
  [/^(\d+) is what percent of (\d+)\?$/u, (part, whole) => `${whole} का ${part} कितने प्रतिशत है?`],
  [/^After a (\d+)% increase, a value becomes (\d+)\. Original value is$/u, (increase, finalValue) => `${increase}% बढ़ने के बाद मान ${finalValue} हो जाता है। मूल मान क्या है?`],
  [/^If A does 1\/(\d+) of work in one day, A alone finishes the work in how many days\?$/u, (days) => `अगर A एक दिन में काम का 1/${days} हिस्सा करता है, तो A अकेले काम कितने दिनों में पूरा करेगा?`],
  [/^A can finish a work in (\d+) days and B in (\d+) days\. Together they finish in how many days\?$/u, (a, b) => `A एक काम ${a} दिनों में और B ${b} दिनों में पूरा करता है। दोनों मिलकर कितने दिनों में काम पूरा करेंगे?`],
  [/^A and B together finish a work in (\d+) days\. A alone takes (\d+) days\. B alone takes$/u, (together, a) => `A और B मिलकर काम ${together} दिनों में पूरा करते हैं। A अकेले ${a} दिन लेता है। B अकेले कितने दिन लेगा?`],
  [/^If x \+ y = (\d+) and y = (\d+), then x = \?$/u, (sum, y) => `अगर x + y = ${sum} और y = ${y}, तो x = ?`],
  [/^Solve for x: 2x \+ y = (\d+) and x \+ y = (\d+)$/u, (c1, c2) => `x के लिए हल करो: 2x + y = ${c1} और x + y = ${c2}`],
  [/^If (\d+)x \+ (\d+)y = (\d+) and (\d+)x \+ (\d+)y = (\d+), then y = \?$/u, (a1, b1, c1, a2, b2, c2) => `अगर ${a1}x + ${b1}y = ${c1} और ${a2}x + ${b2}y = ${c2}, तो y = ?`],
  [/^Find simple interest: P=(\d+), R=(\d+)%.*, T=(\d+) years$/u, (p, r, t) => `Simple interest निकालो: P=${p}, R=${r}%, T=${t} वर्ष`],
  [/^If SI=(\d+), rate=(\d+)% and time=(\d+) years, principal is$/u, (si, rate, time) => `अगर SI=${si}, rate=${rate}% और time=${time} वर्ष है, तो principal क्या है?`],
  [/^At what rate \(in %\) will principal (\d+) double in (\d+) years on simple interest\?$/u, (p, t) => `Simple interest पर ${p} मूलधन ${t} वर्षों में दोगुना होने के लिए rate कितनी होगी?`],
  [/^If CP=(\d+) and SP=(\d+), profit is$/u, (cp, sp) => `अगर CP=${cp} और SP=${sp}, तो profit कितना है?`],
  [/^An item of CP=(\d+) is sold at (\d+)% profit\. Profit amount is$/u, (cp, percent) => `CP=${cp} वाली वस्तु ${percent}% profit पर बेची गई है। Profit amount क्या है?`],
  [/^An item is sold for (\d+) at (\d+)% loss\. Cost price is$/u, (sp, loss) => `एक वस्तु ${sp} में ${loss}% loss पर बेची गई है। Cost price क्या है?`],
  [/^This is an arithmetic pattern with \+(\d+)\. So next is (\d+) \+ (\d+) = (\d+)\.$/u, (diff, term4, add, answer) => `यह arithmetic pattern है जिसमें हर बार +${diff} जुड़ रहा है। अगला मान ${term4} + ${add} = ${answer} होगा।`],
  [/^This is a geometric pattern with x(\d+)\. So next is (\d+) x (\d+) = (\d+)\.$/u, (ratio, term4, mul, answer) => `यह geometric pattern है जिसमें हर बार x${ratio} हो रहा है। अगला मान ${term4} x ${mul} = ${answer} होगा।`],
  [/^These follow near-square growth \(difference increases by 2 each step\)\. Next value is (\d+)\.$/u, (answer) => `यह near-square pattern है जिसमें हर step पर अंतर 2 से बढ़ता है। अगला मान ${answer} है।`],
  [/^(\d+)% of (\d+) = \((\d+)\/100\) x (\d+) = (\d+)\.$/u, (p, base, p2, base2, answer) => `${base} का ${p}% = (${p2}/100) x ${base2} = ${answer}।`],
  [/^Percent = \((\d+)\/(\d+)\) x 100 = (\d+)%\.$/u, (part, whole, answer) => `प्रतिशत = (${part}/${whole}) x 100 = ${answer}%।`],
  [/^Original x \(1 \+ (\d+)\/100\) = (\d+), so original = (\d+)\.$/u, (inc, finalValue, answer) => `Original x (1 + ${inc}/100) = ${finalValue}, इसलिए original = ${answer}।`],
  [/^If one-day work is 1\/(\d+), full work takes (\d+) days\.$/u, (days, answer) => `अगर एक दिन का काम 1/${days} है, तो पूरा काम ${answer} दिनों में होगा।`],
  [/^Combined time = \(a x b\)\/\(a \+ b\) = \((\d+) x (\d+)\)\/\((\d+)\) = ([\d.]+) days\.$/u, (a, b, sum, answer) => `Combined time = (a x b)/(a + b) = (${a} x ${b})/(${sum}) = ${answer} दिन।`],
  [/^1\/B = 1\/(\d+) - 1\/(\d+)\. Solving gives B = (\d+) days\.$/u, (together, a, answer) => `1/B = 1/${together} - 1/${a}। हल करने पर B = ${answer} दिन।`],
  [/^x = (\d+) - (\d+) = (\d+)\.$/u, (sum, y, answer) => `x = ${sum} - ${y} = ${answer}।`],
  [/^Subtract equations: x = (\d+) - (\d+) = (\d+)\.$/u, (c1, c2, answer) => `समीकरण घटाने पर x = ${c1} - ${c2} = ${answer}।`],
  [/^On solving the two equations, y = (\d+)\.$/u, (answer) => `दोनों समीकरण हल करने पर y = ${answer}।`],
  [/^SI = \(P x R x T\)\/100 = \((\d+) x (\d+) x (\d+)\)\/100 = (\d+)\.$/u, (p, r, t, answer) => `SI = (P x R x T)/100 = (${p} x ${r} x ${t})/100 = ${answer}।`],
  [/^P = \(SI x 100\)\/\(R x T\) = \((\d+) x 100\)\/\((\d+) x (\d+)\) = (\d+)\.$/u, (si, r, t, answer) => `P = (SI x 100)/(R x T) = (${si} x 100)/(${r} x ${t}) = ${answer}।`],
  [/^To double under SI, SI = principal\. So R = 100\/T = 100\/(\d+) = ([\d.]+)%\.$/u, (t, answer) => `SI में दोगुना होने के लिए SI = principal होता है। इसलिए R = 100/T = 100/${t} = ${answer}%।`],
  [/^Profit = SP - CP = (\d+) - (\d+) = (\d+)\.$/u, (sp, cp, answer) => `Profit = SP - CP = ${sp} - ${cp} = ${answer}।`],
  [/^Profit = (\d+)% of (\d+) = (\d+)\.$/u, (percent, cp, answer) => `Profit = ${percent}% of ${cp} = ${answer}।`],
  [/^SP = CP x \(1 - (\d+)\/100\)\. Solving gives CP = (\d+)\.$/u, (loss, answer) => `SP = CP x (1 - ${loss}/100)। हल करने पर CP = ${answer}।`],
];

const marathiRules: Array<[RegExp, (...args: string[]) => string]> = [
  [/^What comes next: (.+)$/u, (sequence) => `पुढे काय येईल: ${sequence}`],
  [/^Find the next term: (.+)$/u, (sequence) => `पुढचा पद शोधा: ${sequence}`],
  [/^What is (\d+)% of (\d+)\?$/u, (percent, base) => `${base} चे ${percent}% किती?`],
  [/^(\d+) is what percent of (\d+)\?$/u, (part, whole) => `${whole} पैकी ${part} किती टक्के आहे?`],
  [/^After a (\d+)% increase, a value becomes (\d+)\. Original value is$/u, (increase, finalValue) => `${increase}% वाढीनंतर किंमत ${finalValue} होते. मूळ किंमत किती होती?`],
  [/^If A does 1\/(\d+) of work in one day, A alone finishes the work in how many days\?$/u, (days) => `जर A एका दिवशी कामाचे 1/${days} भाग करतो, तर A एकटाच काम किती दिवसांत पूर्ण करेल?`],
  [/^A can finish a work in (\d+) days and B in (\d+) days\. Together they finish in how many days\?$/u, (a, b) => `A एक काम ${a} दिवसांत आणि B ${b} दिवसांत पूर्ण करतो. दोघे मिळून काम किती दिवसांत पूर्ण करतील?`],
  [/^A and B together finish a work in (\d+) days\. A alone takes (\d+) days\. B alone takes$/u, (together, a) => `A आणि B मिळून काम ${together} दिवसांत पूर्ण करतात. A एकटा ${a} दिवस घेतो. B एकटा किती दिवस घेईल?`],
  [/^If x \+ y = (\d+) and y = (\d+), then x = \?$/u, (sum, y) => `जर x + y = ${sum} आणि y = ${y}, तर x = ?`],
  [/^Solve for x: 2x \+ y = (\d+) and x \+ y = (\d+)$/u, (c1, c2) => `x साठी सोडवा: 2x + y = ${c1} आणि x + y = ${c2}`],
  [/^If (\d+)x \+ (\d+)y = (\d+) and (\d+)x \+ (\d+)y = (\d+), then y = \?$/u, (a1, b1, c1, a2, b2, c2) => `जर ${a1}x + ${b1}y = ${c1} आणि ${a2}x + ${b2}y = ${c2}, तर y = ?`],
  [/^Find simple interest: P=(\d+), R=(\d+)%.*, T=(\d+) years$/u, (p, r, t) => `Simple interest शोधा: P=${p}, R=${r}%, T=${t} वर्षे`],
  [/^If SI=(\d+), rate=(\d+)% and time=(\d+) years, principal is$/u, (si, rate, time) => `जर SI=${si}, rate=${rate}% आणि time=${time} वर्षे असेल, तर principal किती?`],
  [/^At what rate \(in %\) will principal (\d+) double in (\d+) years on simple interest\?$/u, (p, t) => `Simple interest वर ${p} मूळरक्कम ${t} वर्षांत दुप्पट होण्यासाठी rate किती लागेल?`],
  [/^If CP=(\d+) and SP=(\d+), profit is$/u, (cp, sp) => `जर CP=${cp} आणि SP=${sp}, तर profit किती आहे?`],
  [/^An item of CP=(\d+) is sold at (\d+)% profit\. Profit amount is$/u, (cp, percent) => `CP=${cp} असलेली वस्तू ${percent}% profit वर विकली आहे. Profit amount किती?`],
  [/^An item is sold for (\d+) at (\d+)% loss\. Cost price is$/u, (sp, loss) => `एक वस्तू ${sp} ला ${loss}% loss वर विकली आहे. Cost price किती आहे?`],
  [/^This is an arithmetic pattern with \+(\d+)\. So next is (\d+) \+ (\d+) = (\d+)\.$/u, (diff, term4, add, answer) => `हा arithmetic pattern आहे ज्यात प्रत्येक वेळी +${diff} वाढते. पुढचे मूल्य ${term4} + ${add} = ${answer} असेल.`],
  [/^This is a geometric pattern with x(\d+)\. So next is (\d+) x (\d+) = (\d+)\.$/u, (ratio, term4, mul, answer) => `हा geometric pattern आहे ज्यात प्रत्येक वेळी x${ratio} होते. पुढचे मूल्य ${term4} x ${mul} = ${answer} असेल.`],
  [/^These follow near-square growth \(difference increases by 2 each step\)\. Next value is (\d+)\.$/u, (answer) => `हा near-square pattern आहे ज्यात प्रत्येक पायरीला फरक 2 ने वाढतो. पुढचे मूल्य ${answer} आहे.`],
  [/^(\d+)% of (\d+) = \((\d+)\/100\) x (\d+) = (\d+)\.$/u, (p, base, p2, base2, answer) => `${base} चे ${p}% = (${p2}/100) x ${base2} = ${answer}.`],
  [/^Percent = \((\d+)\/(\d+)\) x 100 = (\d+)%\.$/u, (part, whole, answer) => `टक्केवारी = (${part}/${whole}) x 100 = ${answer}%.`],
  [/^Original x \(1 \+ (\d+)\/100\) = (\d+), so original = (\d+)\.$/u, (inc, finalValue, answer) => `Original x (1 + ${inc}/100) = ${finalValue}, म्हणून original = ${answer}.`],
  [/^If one-day work is 1\/(\d+), full work takes (\d+) days\.$/u, (days, answer) => `जर एका दिवसाचे काम 1/${days} असेल, तर पूर्ण काम ${answer} दिवसांत होईल.`],
  [/^Combined time = \(a x b\)\/\(a \+ b\) = \((\d+) x (\d+)\)\/\((\d+)\) = ([\d.]+) days\.$/u, (a, b, sum, answer) => `Combined time = (a x b)/(a + b) = (${a} x ${b})/(${sum}) = ${answer} दिवस.`],
  [/^1\/B = 1\/(\d+) - 1\/(\d+)\. Solving gives B = (\d+) days\.$/u, (together, a, answer) => `1/B = 1/${together} - 1/${a}. सोडवल्यावर B = ${answer} दिवस.`],
  [/^x = (\d+) - (\d+) = (\d+)\.$/u, (sum, y, answer) => `x = ${sum} - ${y} = ${answer}.`],
  [/^Subtract equations: x = (\d+) - (\d+) = (\d+)\.$/u, (c1, c2, answer) => `समीकरणे वजा केल्यावर x = ${c1} - ${c2} = ${answer}.`],
  [/^On solving the two equations, y = (\d+)\.$/u, (answer) => `दोन्ही समीकरणे सोडवल्यावर y = ${answer}.`],
  [/^SI = \(P x R x T\)\/100 = \((\d+) x (\d+) x (\d+)\)\/100 = (\d+)\.$/u, (p, r, t, answer) => `SI = (P x R x T)/100 = (${p} x ${r} x ${t})/100 = ${answer}.`],
  [/^P = \(SI x 100\)\/\(R x T\) = \((\d+) x 100\)\/\((\d+) x (\d+)\) = (\d+)\.$/u, (si, r, t, answer) => `P = (SI x 100)/(R x T) = (${si} x 100)/(${r} x ${t}) = ${answer}.`],
  [/^To double under SI, SI = principal\. So R = 100\/T = 100\/(\d+) = ([\d.]+)%\.$/u, (t, answer) => `SI मध्ये दुप्पट होण्यासाठी SI = principal असते. म्हणून R = 100/T = 100/${t} = ${answer}%.`],
  [/^Profit = SP - CP = (\d+) - (\d+) = (\d+)\.$/u, (sp, cp, answer) => `Profit = SP - CP = ${sp} - ${cp} = ${answer}.`],
  [/^Profit = (\d+)% of (\d+) = (\d+)\.$/u, (percent, cp, answer) => `Profit = ${percent}% of ${cp} = ${answer}.`],
  [/^SP = CP x \(1 - (\d+)\/100\)\. Solving gives CP = (\d+)\.$/u, (loss, answer) => `SP = CP x (1 - ${loss}/100). सोडवल्यावर CP = ${answer}.`],
];

export function getUiText(language: AppLanguage) {
  return uiText[language];
}

export function getLocalizedTopicContent(topic: keyof typeof topicsData, language: AppLanguage) {
  return topicTranslations[language][topic];
}

export function getLocalizedQuestion(question: TopicQuestion, language: AppLanguage): TopicQuestion {
  if (language === "English") {
    return question;
  }

  const rules = language === "Hindi" ? hindiRules : marathiRules;

  return {
    ...question,
    question: applyRules(question.question, rules),
    explanation: applyRules(question.explanation, rules),
  };
}

export function getLocalizedDifficultyLabel(difficulty: string, language: AppLanguage) {
  if (language === "Hindi") {
    return { easy: "आसान", medium: "मध्यम", hard: "कठिन" }[difficulty] ?? difficulty;
  }

  if (language === "Marathi") {
    return { easy: "सोपे", medium: "मध्यम", hard: "कठीण" }[difficulty] ?? difficulty;
  }

  return difficulty;
}
