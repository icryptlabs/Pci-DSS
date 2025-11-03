
import { GoogleGenAI } from "@google/genai";
import { ComplianceStatus } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

// Ensure the API key is available
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getCompliancePrompt = (status: ComplianceStatus, requirementId: string): string => {
  if (status === ComplianceStatus.COMPLIANT) {
    return `You are a PCI DSS compliance assistant. A device's configuration hash matched the expected secure baseline for requirement '${requirementId}'. Briefly explain in one sentence why this indicates a secure state.`;
  }
  return `You are a PCI DSS compliance assistant. A device's configuration hash FAILED to match the expected secure baseline for requirement '${requirementId}'. Briefly explain in one sentence the security risk this unauthorized change poses.`;
};

export const getComplianceReasoning = async (
  status: ComplianceStatus,
  requirementId: string
): Promise<string> => {
  try {
    const prompt = getCompliancePrompt(status, requirementId);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching compliance reasoning from Gemini:", error);
    return "Could not retrieve automated analysis due to an API error.";
  }
};
