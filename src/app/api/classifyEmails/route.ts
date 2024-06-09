// src/app/api/classifyEmails/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

interface ClassifyEmailRequest {
  emailTitles: string[];
}

interface Classification {
  title: string;
  category: string;
}

// Type guard to check if an error has a response property
function isErrorWithResponse(error: unknown): error is { response: { status: number } } {
  return typeof error === "object" && error !== null && "response" in error && typeof (error as any).response.status === "number";
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { emailTitles }: ClassifyEmailRequest = await req.json();

    if (!Array.isArray(emailTitles) || emailTitles.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty emailTitles format' });
    }

    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'API key not found in local storage' });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const filteredEmailTitles = emailTitles.filter((title) => title).map((title) => title.trim());

    if (filteredEmailTitles.length === 0) {
      return NextResponse.json({ classifiedEmails: [] });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Classify the following email titles into categories: Important, Promotions, Social, Marketing, Spam, General.\n\n${filteredEmailTitles.join("\n")}

    your response should be like this for eg:
    **Spam:**

* **PaYvYznFp, here's your monthly Xbox Newsletter** (Generic and likely unsolicited)`;

    console.log("Prompt sent to API:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    console.log("Response from API:", text);

    const classifications = parseClassifications(text, filteredEmailTitles);

    if (classifications.length !== filteredEmailTitles.length) {
      console.warn('Classification response length does not match email titles length');
      return NextResponse.json({ error: 'Classification response length does not match email titles length' });
    }

    const classifiedEmails: Classification[] = classifications.map((category, index) => ({
      title: filteredEmailTitles[index],
      category: category.trim(),
    }));

    return NextResponse.json({ classifiedEmails });
  } catch (error: unknown) {
    console.error("Error classifying emails with Gemini API:", error);
    if (isErrorWithResponse(error) && (error.response.status === 401 || error.response.status === 403)) {
      return NextResponse.json({ error: 'Invalid Gemini API key. Please check your key and try again.' });
    }
    return NextResponse.json({ error: 'Error classifying emails' });
  }
}

function parseClassifications(responseText: string, emailTitles: string[]): string[] {
  const categories = ["Important", "Promotions", "Social", "Marketing", "Spam", "General"];
  const classifications = new Array(emailTitles.length).fill("Uncategorized");

  categories.forEach((category) => {
    const categorySection = responseText.split(`**${category}:**`)[1];
    if (categorySection) {
      const emailsInCategory = categorySection
        .split("\n")
        .filter((line) => line.startsWith("*"))
        .map((line) => line.replace(/^\* \*\*/, "").replace(/\*\*.*$/, "").trim());
      emailsInCategory.forEach((email) => {
        const index = emailTitles.findIndex((title) => title.includes(email));
        if (index !== -1) {
          classifications[index] = category;
        }
      });
    }
  });

  return classifications;
}
