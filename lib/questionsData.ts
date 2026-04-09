export type Difficulty = "easy" | "medium" | "hard";

export interface TopicQuestion {
  id: string;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
  translations?: Partial<
    Record<
      string,
      {
        question: string;
        options?: [string, string, string, string];
        explanation: string;
      }
    >
  >;
}

function uniqueWrongAnswers(correct: number, deltas: number[]) {
  const output: number[] = [];

  for (const delta of deltas) {
    const candidate = Math.max(0, correct + delta);
    if (candidate !== correct && !output.includes(candidate)) {
      output.push(candidate);
    }

    if (output.length === 3) {
      break;
    }
  }

  let step = 1;
  while (output.length < 3) {
    const fallback = correct + step;
    if (!output.includes(fallback) && fallback !== correct) {
      output.push(fallback);
    }
    step += 1;
  }

  return output;
}

function buildNumericMcq(correct: number, deltas: number[], indexSeed: number) {
  const wrong = uniqueWrongAnswers(correct, deltas);
  const answerIndex = indexSeed % 4;
  const options = ["", "", "", ""] as [string, string, string, string];

  options[answerIndex] = String(correct);

  let wrongCursor = 0;
  for (let i = 0; i < 4; i += 1) {
    if (!options[i]) {
      options[i] = String(wrong[wrongCursor]);
      wrongCursor += 1;
    }
  }

  return { options, answerIndex };
}

function generateNumberPatterns(): TopicQuestion[] {
  const questions: TopicQuestion[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const start = 2 + i;
    const diff = 1 + (i % 5);
    const term4 = start + 3 * diff;
    const answer = term4 + diff;
    const { options, answerIndex } = buildNumericMcq(answer, [-1, 1, diff + 1, -(diff + 1)], i);

    questions.push({
      id: `np-e-${i}`,
      difficulty: "easy",
      question: `What comes next: ${start}, ${start + diff}, ${start + 2 * diff}, ${term4}, ?`,
      options,
      answerIndex,
      explanation: `This is an arithmetic pattern with +${diff}. So next is ${term4} + ${diff} = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const start = 2 + (i % 4);
    const ratio = 2 + (i % 3);
    const term4 = start * ratio * ratio * ratio;
    const answer = term4 * ratio;
    const { options, answerIndex } = buildNumericMcq(answer, [-ratio, ratio, answer / 2 > 0 ? -Math.floor(answer / 2) : -1, Math.floor(answer / 3)], i + 2);

    questions.push({
      id: `np-m-${i}`,
      difficulty: "medium",
      question: `Find the next term: ${start}, ${start * ratio}, ${start * ratio * ratio}, ${term4}, ?`,
      options,
      answerIndex,
      explanation: `This is a geometric pattern with x${ratio}. So next is ${term4} x ${ratio} = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const n = i + 3;
    const answer = (n + 1) * (n + 1) + i;
    const sequence = [
      n * n + i - 2 * n + 1,
      (n - 1) * (n - 1) + i,
      n * n + i,
      (n + 1) * (n + 1) + i - (2 * n + 1),
    ];
    const term4 = sequence[3];
    const { options, answerIndex } = buildNumericMcq(answer, [-2, 2, -(2 * n + 1), 2 * n + 3], i + 4);

    questions.push({
      id: `np-h-${i}`,
      difficulty: "hard",
      question: `What comes next: ${sequence[0]}, ${sequence[1]}, ${sequence[2]}, ${term4}, ?`,
      options,
      answerIndex,
      explanation: `These follow near-square growth (difference increases by 2 each step). Next value is ${answer}.`,
    });
  }

  return questions;
}

function generatePercentage(): TopicQuestion[] {
  const questions: TopicQuestion[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const percent = 5 * ((i % 6) + 1);
    const base = 40 + i * 10;
    const answer = (percent * base) / 100;
    const { options, answerIndex } = buildNumericMcq(answer, [-10, 10, -5, 5], i);

    questions.push({
      id: `pc-e-${i}`,
      difficulty: "easy",
      question: `What is ${percent}% of ${base}?`,
      options,
      answerIndex,
      explanation: `${percent}% of ${base} = (${percent}/100) x ${base} = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const part = 20 + i * 3;
    const whole = part * (2 + (i % 3));
    const answer = Math.round((part / whole) * 100);
    const { options, answerIndex } = buildNumericMcq(answer, [-5, 5, -10, 10], i + 1);

    questions.push({
      id: `pc-m-${i}`,
      difficulty: "medium",
      question: `${part} is what percent of ${whole}?`,
      options,
      answerIndex,
      explanation: `Percent = (${part}/${whole}) x 100 = ${answer}%.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const original = 120 + i * 15;
    const increase = 10 + (i % 5) * 5;
    const finalValue = Math.round(original * (1 + increase / 100));
    const answer = original;
    const { options, answerIndex } = buildNumericMcq(answer, [-20, 20, -15, 15], i + 2);

    questions.push({
      id: `pc-h-${i}`,
      difficulty: "hard",
      question: `After a ${increase}% increase, a value becomes ${finalValue}. Original value is`,
      options,
      answerIndex,
      explanation: `Original x (1 + ${increase}/100) = ${finalValue}, so original = ${answer}.`,
    });
  }

  return questions;
}

function generateWorkTime(): TopicQuestion[] {
  const questions: TopicQuestion[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const days = 4 + i;
    const answer = days;
    const { options, answerIndex } = buildNumericMcq(answer, [-1, 1, -2, 2], i);

    questions.push({
      id: `wt-e-${i}`,
      difficulty: "easy",
      question: `If A does 1/${days} of work in one day, A alone finishes the work in how many days?`,
      options,
      answerIndex,
      explanation: `If one-day work is 1/${days}, full work takes ${days} days.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const a = 6 + i;
    const b = 8 + i;
    const answer = Number(((a * b) / (a + b)).toFixed(1));
    const answerIndex = i % 4;
    const wrong = [
      Number((answer + 0.5).toFixed(1)),
      Number((answer - 0.5).toFixed(1)),
      Number((answer + 1).toFixed(1)),
    ];
    const options = ["", "", "", ""] as [string, string, string, string];
    options[answerIndex] = String(answer);
    let cursor = 0;
    for (let k = 0; k < 4; k += 1) {
      if (!options[k]) {
        options[k] = String(wrong[cursor]);
        cursor += 1;
      }
    }

    questions.push({
      id: `wt-m-${i}`,
      difficulty: "medium",
      question: `A can finish a work in ${a} days and B in ${b} days. Together they finish in how many days?`,
      options,
      answerIndex,
      explanation: `Combined time = (a x b)/(a + b) = (${a} x ${b})/(${a + b}) = ${answer} days.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const together = 4 + (i % 6);
    const a = together + 4 + (i % 4);
    const answer = Math.round((a * together) / (a - together));
    const { options, answerIndex } = buildNumericMcq(answer, [-2, 2, -3, 3], i + 2);

    questions.push({
      id: `wt-h-${i}`,
      difficulty: "hard",
      question: `A and B together finish a work in ${together} days. A alone takes ${a} days. B alone takes`,
      options,
      answerIndex,
      explanation: `1/B = 1/${together} - 1/${a}. Solving gives B = ${answer} days.`,
    });
  }

  return questions;
}

function generateLinearEquations(): TopicQuestion[] {
  const questions: TopicQuestion[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const x = 2 + (i % 7);
    const y = 1 + (i % 5);
    const sum = x + y;
    const answer = x;
    const { options, answerIndex } = buildNumericMcq(answer, [-1, 1, -2, 2], i);

    questions.push({
      id: `le-e-${i}`,
      difficulty: "easy",
      question: `If x + y = ${sum} and y = ${y}, then x = ?`,
      options,
      answerIndex,
      explanation: `x = ${sum} - ${y} = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const x = 2 + (i % 6);
    const y = 3 + (i % 5);
    const c1 = 2 * x + y;
    const c2 = x + y;
    const answer = x;
    const { options, answerIndex } = buildNumericMcq(answer, [-1, 1, -2, 2], i + 1);

    questions.push({
      id: `le-m-${i}`,
      difficulty: "medium",
      question: `Solve for x: 2x + y = ${c1} and x + y = ${c2}`,
      options,
      answerIndex,
      explanation: `Subtract equations: x = ${c1} - ${c2} = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const x = 2 + (i % 6);
    const y = 1 + (i % 6);
    const a1 = 2 + (i % 3);
    const b1 = 1 + (i % 4);
    const a2 = 1 + (i % 4);
    const b2 = 2 + (i % 3);
    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y;
    const answer = y;
    const { options, answerIndex } = buildNumericMcq(answer, [-1, 1, -2, 2], i + 2);

    questions.push({
      id: `le-h-${i}`,
      difficulty: "hard",
      question: `If ${a1}x + ${b1}y = ${c1} and ${a2}x + ${b2}y = ${c2}, then y = ?`,
      options,
      answerIndex,
      explanation: `On solving the two equations, y = ${answer}.`,
    });
  }

  return questions;
}

function generateSimpleInterest(): TopicQuestion[] {
  const questions: TopicQuestion[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const p = 500 + i * 100;
    const r = 5 + (i % 6);
    const t = 1 + (i % 4);
    const answer = Math.round((p * r * t) / 100);
    const { options, answerIndex } = buildNumericMcq(answer, [-20, 20, -10, 10], i);

    questions.push({
      id: `si-e-${i}`,
      difficulty: "easy",
      question: `Find simple interest: P=${p}, R=${r}%, T=${t} years`,
      options,
      answerIndex,
      explanation: `SI = (P x R x T)/100 = (${p} x ${r} x ${t})/100 = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const si = 120 + i * 20;
    const r = 4 + (i % 6);
    const t = 2 + (i % 4);
    const answer = Math.round((si * 100) / (r * t));
    const { options, answerIndex } = buildNumericMcq(answer, [-100, 100, -50, 50], i + 1);

    questions.push({
      id: `si-m-${i}`,
      difficulty: "medium",
      question: `If SI=${si}, rate=${r}% and time=${t} years, principal is`,
      options,
      answerIndex,
      explanation: `P = (SI x 100)/(R x T) = (${si} x 100)/(${r} x ${t}) = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const p = 1000 + i * 150;
    const t = 2 + (i % 5);
    const answer = Number((100 / t).toFixed(1));
    const answerIndex = (i + 2) % 4;
    const wrong = [
      Number((answer + 1).toFixed(1)),
      Number((answer - 1).toFixed(1)),
      Number((answer + 2).toFixed(1)),
    ];
    const options = ["", "", "", ""] as [string, string, string, string];
    options[answerIndex] = String(answer);
    let cursor = 0;
    for (let k = 0; k < 4; k += 1) {
      if (!options[k]) {
        options[k] = String(wrong[cursor]);
        cursor += 1;
      }
    }

    questions.push({
      id: `si-h-${i}`,
      difficulty: "hard",
      question: `At what rate (in %) will principal ${p} double in ${t} years on simple interest?`,
      options,
      answerIndex,
      explanation: `To double under SI, SI = principal. So R = 100/T = 100/${t} = ${answer}%.`,
    });
  }

  return questions;
}

function generateProfitLoss(): TopicQuestion[] {
  const questions: TopicQuestion[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const cp = 100 + i * 20;
    const profit = 10 + (i % 6) * 5;
    const sp = cp + profit;
    const answer = profit;
    const { options, answerIndex } = buildNumericMcq(answer, [-5, 5, -10, 10], i);

    questions.push({
      id: `pl-e-${i}`,
      difficulty: "easy",
      question: `If CP=${cp} and SP=${sp}, profit is`,
      options,
      answerIndex,
      explanation: `Profit = SP - CP = ${sp} - ${cp} = ${answer}.`,
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    const cp = 200 + i * 30;
    const pPercent = 5 + (i % 6) * 5;
    const answer = Math.round((cp * pPercent) / 100);
    const { options, answerIndex } = buildNumericMcq(answer, [-10, 10, -20, 20], i + 1);

    questions.push({
      id: `pl-m-${i}`,
      difficulty: "medium",
      question: `An item of CP=${cp} is sold at ${pPercent}% profit. Profit amount is`,
      options,
      answerIndex,
      explanation: `Profit = ${pPercent}% of ${cp} = ${answer}.`,
    });
  }
  for (let i = 1; i <= 20; i += 1) {
    const cp = 300 + i * 25;
    const lossPercent = 5 + (i % 5) * 5;
    const sp = Math.round(cp * (1 - lossPercent / 100));
    const answer = cp;
    const { options, answerIndex } = buildNumericMcq(answer, [-25, 25, -50, 50], i + 2);

    questions.push({
      id: `pl-h-${i}`,
      difficulty: "hard",
      question: `An item is sold for ${sp} at ${lossPercent}% loss. Cost price is`,
      options,
      answerIndex,
      explanation: `SP = CP x (1 - ${lossPercent}/100). Solving gives CP = ${answer}.`,
    });
  }

  return questions;
}
export const questionsData: Record<string, TopicQuestion[]> = {
  "number-patterns": generateNumberPatterns(),
  percentage: generatePercentage(),
  "work-time": generateWorkTime(),
  "linear-equations": generateLinearEquations(),
  "simple-interest": generateSimpleInterest(),
  "profit-loss": generateProfitLoss(),
};
export const TOTAL_QUESTION_COUNT = Object.values(questionsData).reduce(
  (sum, topicQuestions) => sum + topicQuestions.length,
  0,
);
