
import { GoogleGenAI, Type } from "@google/genai";
import { PortInfo, SecurityInsight } from "../types";

const API_KEY = process.env.API_KEY || "";

export const analyzeSecurity = async (target: string, openPorts: PortInfo[]): Promise<SecurityInsight[]> => {
  if (!API_KEY) return [];

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const portsList = openPorts.map(p => `${p.port} (${p.service})`).join(", ");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following open ports for host ${target} and provide security insights. If no ports are open, comment on standard hardening.
      Open Ports: ${portsList || "None detected"}`,
      config: {
        systemInstruction: "You are a professional Cyber Security Auditor. Provide a JSON list of security insights. Each insight should have 'vulnerability', 'severity' (low, medium, high, critical), and 'recommendation'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vulnerability: { type: Type.STRING },
              severity: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["vulnerability", "severity", "recommendation"]
          }
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as SecurityInsight[];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [];
  }
};
