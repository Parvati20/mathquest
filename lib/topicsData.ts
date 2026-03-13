// lib/topicsData.ts

export const topicsData = {
  "number-patterns": {
    title: "Number Patterns",
    theory: "Number patterns are sequences of numbers that follow a specific mathematical rule. Finding the pattern means identifying the rule that connects consecutive numbers.",
    formula: "Arithmetic Pattern: a, a+d, a+2d...\nGeometric Pattern: a, a×r, a×r²...",
    videoId: "Pe-D7zFe-wg", 
    examples: [
      { q: "Find the next number: 2, 5, 8, 11, ?", a: "Pattern: Adding 3 each time. Next = 11 + 3 = 14" },
      { q: "Find the next number: 3, 6, 12, 24, ?", a: "Pattern: Multiplying by 2 each time. Next = 24 × 2 = 48" }
    ]
  },
  "percentage": {
    title: "Percentage",
    theory: "Percentage means 'per hundred'. It is a way to express a number as a fraction of 100.",
    formula: "Percentage = (Part / Whole) × 100\nPart = (Percentage × Whole) / 100",
    videoId: "gbR_m1byDns",
    examples: [
      { q: "What is 20% of 150?", a: "20% of 150 = (20/100) × 150 = 30" }
    ]
  },
  "work-time": {
    title: "Work & Time",
    theory: "Work and time problems deal with the relationship between the time taken to complete a job and the rate of work (efficiency).",
    formula: "Total Work = Efficiency × Time\nCombined Time (A+B) = (a × b) / (a + b)",
    videoId: "kMShwk06mYQ", 
    examples: [
      { q: "A can do a job in 10 days, B in 15 days. Together?", a: "Combined rate = 1/10 + 1/15 = 1/6. Together = 6 days" }
    ]
  },
  "linear-equations": {
    title: "Linear Equations",
    theory: "A linear equation is an algebraic equation where each term has an exponent of 1. When graphed, it forms a straight line.",
    formula: "Standard Form: ax + b = c\ny = mx + c (Slope-Intercept Form)",
    videoId: "pQEAHPqsBpI", 
    examples: [
      { q: "Solve for x: 2x + 5 = 15", a: "2x = 10 => x = 5" }
    ]
  },
  "simple-interest": {
    title: "Simple Interest",
    theory: "Simple interest is calculated on the principal amount, interest rate, and time period.",
    formula: "SI = (P × R × T) / 100\nAmount = Principal + SI",
    videoId: "VS0l5NXUigI", 
    examples: [
      { q: "P=1000, R=5%, T=2 yrs. Find SI.", a: "SI = (1000 × 5 × 2) / 100 = ₹100" }
    ]
  },
  "profit-loss": {
    title: "Profit & Loss",
    theory: "Profit occurs when Selling Price (SP) is greater than Cost Price (CP). Loss occurs when CP is greater than SP.",
    formula: "Profit % = (Profit/CP) × 100\nLoss % = (Loss/CP) × 100",
    videoId: "B4z52xTAhnk", 
    examples: [
      { q: "Bought for 100, sold for 120. Profit %?", a: "Profit = 20. Profit % = 20%" }
    ]
  }
};