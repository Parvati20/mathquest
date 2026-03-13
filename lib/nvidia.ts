export async function getMathExplanation(topic: string, question: string, language: string = "Hindi") {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { 
            role: "system", 
            content: [
              `You are a helpful NavGurukul math mentor. Reply only in ${language}.`,
              "Keep the response short and practical.",
              "Do not give long concept theory.",
              "Do not ask new questions.",
              "Use this exact format:",
              "Step 1: ...",
              "Step 2: ...",
              "Step 3: ...",
              "Answer: ...",
              "Each step must be one short sentence.",
            ].join(" ")
          },
          { 
            role: "user", 
            content: `Topic: ${topic}\nQuestion: ${question}\nSolve this exact question only.`
          }
        ],
        temperature: 0.1,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`NVIDIA API request failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "I could not generate an explanation right now.";
    return raw
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (error) {
    console.error("NVIDIA API Error:", error);
    return "Sorry, I couldn't generate an explanation right now.";
  }
}