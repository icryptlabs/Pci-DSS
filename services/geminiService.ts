import { GoogleGenAI } from "@google/genai";
import { ComplianceStatus } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

// Ensure the API key is available
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getReportGenerationPrompt = (
    deviceId: string,
    hashValidationStatus: ComplianceStatus,
    logScanSummary: string,
): string => {
    const hashResult = hashValidationStatus === ComplianceStatus.COMPLIANT 
        ? "The device configuration hash matched the secure baseline, indicating no unauthorized changes."
        : "CRITICAL: The device configuration hash DID NOT MATCH the secure baseline, indicating a possible unauthorized and malicious change.";
    
    const logResult = logScanSummary;

    return `
You are a Senior Security Analyst for a retail company, responsible for PCI DSS compliance reporting.
An automated attestation event has occurred for a device. Analyze the following data and generate a concise, professional compliance report in markdown format.

**Device ID:** ${deviceId}

**Analysis Data:**
1.  **Configuration Hash Integrity:** ${hashResult}
2.  **Log File Scan Summary:** ${logResult}

**Instructions:**
-   Start with a headline: "Compliance Report: [Device ID] - [Date]"
-   Provide a "Final Status" of either "COMPLIANT" or "NON-COMPLIANT".
-   Write a short "Executive Summary" (2-3 sentences) explaining the overall compliance status.
-   Include a "Detailed Findings" section with bullet points for both the hash integrity and log scan results.
-   Conclude with a "Recommended Actions" section. If compliant, recommend continued monitoring. If non-compliant, recommend immediate investigation, isolation of the device, and a security audit.
`;
};

export const generateComplianceReport = async (
  reportData: { deviceId: string; hashValidationStatus: ComplianceStatus; logScanSummary: string }
): Promise<string> => {
  try {
    const prompt = getReportGenerationPrompt(
        reportData.deviceId,
        reportData.hashValidationStatus,
        reportData.logScanSummary
    );
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating compliance report from Gemini:", error);
    return "Could not generate automated report due to an API error.";
  }
};

export const askWithGrounding = async (prompt: string, useGrounding: boolean): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                tools: useGrounding ? [{ googleSearch: {} }] : [],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        let sources: { title: string; uri: string }[] | undefined;
        if (groundingChunks) {
            sources = groundingChunks
                .map(chunk => chunk.web)
                .filter(web => web?.uri && web?.title)
                .map(web => ({ title: web.title!, uri: web.uri! }));
        }

        return { text, sources };

    } catch (error) {
        console.error("Error asking Gemini:", error);
        return { text: "Sorry, I encountered an error. Please try again." };
    }
};