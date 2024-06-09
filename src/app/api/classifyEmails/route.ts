// src/app/api/classifyEmails/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { emailTitles } = await req.json();

    if (!Array.isArray(emailTitles) || emailTitles.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty emailTitles format' });
    }

    // Retrieve the API key from local storage
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'API key not found in local storage' });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const filteredEmailTitles = emailTitles.filter(title => title).map(title => title.trim());

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

    // Parse the response to extract the classifications
    const classifications = parseClassifications(text, filteredEmailTitles);

    if (classifications.length !== filteredEmailTitles.length) {
      console.warn('Classification response length does not match email titles length');
      return NextResponse.json({ error: 'Classification response length does not match email titles length' });
    }

    const classifiedEmails = classifications.map((category, index) => ({
      title: filteredEmailTitles[index],
      category: category.trim(),
    }));

    return NextResponse.json({ classifiedEmails });
  } catch (error) {
    console.error("Error classifying emails with Gemini API:", error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      return NextResponse.json({ error: 'Invalid Gemini API key. Please check your key and try again.' });
    }
    return NextResponse.json({ error: 'Error classifying emails' });
  }
}

// Helper function to parse the classifications from the structured response
function parseClassifications(responseText, emailTitles) {
  const categories = ["Important", "Promotions", "Social", "Marketing", "Spam", "General"];
  const classifications = new Array(emailTitles.length).fill("Uncategorized");

  categories.forEach(category => {
    const categorySection = responseText.split(`**${category}:**`)[1];
    if (categorySection) {
      const emailsInCategory = categorySection.split("\n").filter(line => line.startsWith("*")).map(line => line.replace(/^\* \*\*/, "").replace(/\*\*.*$/, "").trim());
      emailsInCategory.forEach(email => {
        const index = emailTitles.findIndex(title => title.includes(email));
        if (index !== -1) {
          classifications[index] = category;
        }
      });
    }
  });

  return classifications;
}
