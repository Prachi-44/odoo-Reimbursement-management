import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger.js";

export interface OcrResult {
  amount: number | null;
  date: string | null;
  vendor: string | null;
  description: string | null;
  currency: string | null;
  category: string | null;
  rawText: string;
}

const VALID_CATEGORIES = [
  "Travel",
  "Meals & Entertainment",
  "Office Supplies",
  "Software & Subscriptions",
  "Hardware & Equipment",
  "Marketing",
  "Training & Education",
  "Accommodation",
  "Transportation",
  "Healthcare",
  "Utilities",
  "Other",
];

export async function scanReceiptFromBase64(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<OcrResult> {
  try {
    logger.info("Starting AI-powered OCR receipt scan");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `You are a receipt OCR assistant. Analyze this receipt image and extract the following information. Respond with ONLY valid JSON, no markdown fences, no extra text.

Extract:
- amount: total amount as a number (e.g. 42.50), null if not found
- date: date in ISO 8601 format (YYYY-MM-DD), null if not found
- vendor: business/store name as a string, null if not found
- description: brief description of what was purchased (1-2 sentences), null if not found
- currency: 3-letter ISO currency code (USD, EUR, GBP, etc.), null if not found
- category: best matching category from this list: ${VALID_CATEGORIES.join(", ")}
- rawText: full text visible on the receipt

JSON format:
{
  "amount": <number|null>,
  "date": "<string|null>",
  "vendor": "<string|null>",
  "description": "<string|null>",
  "currency": "<string|null>",
  "category": "<string|null>",
  "rawText": "<string>"
}`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    logger.info({ content }, "Raw OCR response from GPT");

    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as OcrResult;

    if (!VALID_CATEGORIES.includes(parsed.category ?? "")) {
      parsed.category = "Other";
    }

    logger.info({ parsed }, "OCR extraction complete");
    return parsed;
  } catch (err) {
    logger.error({ err }, "OCR extraction failed");
    return {
      amount: null,
      date: null,
      vendor: null,
      description: null,
      currency: null,
      category: null,
      rawText: "OCR extraction failed. Please fill in the details manually.",
    };
  }
}
