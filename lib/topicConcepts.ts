/**
 * Concept frameworks for each topic.
 * These define WHAT students should learn, not HOW test questions are formatted.
 * LLM uses this to generate varied, interesting questions based on underlying concepts.
 */

export const topicConcepts: Record<string, { concepts: string[]; examples: string[] }> = {
  "number-patterns": {
    concepts: [
      "Arithmetic sequences (constant difference)",
      "Geometric sequences (constant ratio)",
      "Fibonacci-like patterns (recursive)",
      "Quadratic/polynomial sequences (second-order differences)",
      "Mixed patterns (combination of rules)",
    ],
    examples: [
      "Find the next term in a sequence with a fixed difference",
      "Find the next term in a sequence with a fixed ratio",
      "Identify the missing number in a number series",
      "Use odd/even, square, cube, or alternating patterns",
      "Explain the rule behind a growing number pattern",
    ],
  },

  percentages: {
    concepts: [
      "Basic percentage formula: (Part ÷ Total) × 100",
      "Finding percentage change (increase/decrease)",
      "Reverse percentage calculations (finding original from percentage)",
      "Percentage of percentage (compound percentages)",
      "Practical applications: discounts, interest, grades, success rates",
    ],
    examples: [
      "Market scenario: profit/loss in a business",
      "Exam scenario: passing percentage of students",
      "Discount scenario: original price vs sale price",
      "Growth scenario: population increase year-over-year",
      "Quality scenario: defect rates in manufacturing",
    ],
  },

  "work-and-time": {
    concepts: [
      "Work rate formula: Work = Rate × Time",
      "Combined work: multiple workers/machines doing same job",
      "Inverse relationship: more workers → less time",
      "Partial work: not all workers work full duration",
      "Efficiency: same work, different rates",
    ],
    examples: [
      "Team of workers building/completing a project",
      "Machines/taps filling/emptying a container",
      "Painting, farming, or construction scenarios",
      "Pipeline/network capacity (data, water, traffic)",
      "Mixed scenario: some workers for part of job",
    ],
  },

  "linear-equations": {
    concepts: [
      "Setting up equations from word problems (ax + by = c)",
      "Understanding variables represent unknown real quantities",
      "Solving systems: substitution, elimination",
      "Checking if solution makes practical sense",
      "Real-world constraints (positive quantities, whole numbers)",
    ],
    examples: [
      "Cost problems: multiple items with different prices",
      "Mixture problems: combining two materials/resources",
      "Age/relation problems: comparing two people",
      "Financial problems: income, expenses, balance",
      "Inventory: counting items by category",
    ],
  },
};

/**
 * Generate a varied question prompt for the LLM.
 * Includes concept framework but asks for DIFFERENT formats than official tests.
 */
export function getConceptGuidedPrompt(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  language: string
): string {
  const topicData = topicConcepts[topic];
  if (!topicData) {
    return "";
  }

  const { concepts, examples } = topicData;

  const difficultyGuide = {
    easy: "Simple, direct application of one concept. Single-step or two-step solution.",
    medium: "Requires combining two concepts or careful reading. May have a practical twist.",
    hard: "Multi-step reasoning. Requires choosing the right approach. May involve constraints or optimization.",
  };

  const topicRule =
    topic === "number-patterns"
      ? `STRICT TOPIC RULE: Every question must be a number sequence / pattern question only. Do NOT generate money, bakery, shopping, percentage, work-time, or linear-equation word problems. Each question must contain a visible numeric pattern, missing term, next term, or rule-finding task.`
      : `Generate questions that stay within the topic concepts and do not drift into unrelated chapters.`;

  return `
CONCEPT FRAMEWORK (do NOT copy test formats, use these concepts to CREATE VARIED questions):

Topic: ${topic}
Core Concepts:
${concepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Real-World Context Examples (generate DIFFERENT scenarios):
${examples.map((e) => `• ${e}`).join("\n")}

DIFFICULTY LEVEL: ${difficulty}
${difficultyGuide[difficulty]}

${topicRule}

IMPORTANT:
- Create a UNIQUE scenario (don't reuse NavGurukul/SOP test patterns)
- Make the question INTERESTING and PRACTICAL
- Students should learn the CONCEPT, not memorize test formats
- Question MUST be fully in ${language}, options in ${language}
- Create varied question structures (story-based, real-world, creative)
- The scenario should be different each time, not repetitive
`;
}
