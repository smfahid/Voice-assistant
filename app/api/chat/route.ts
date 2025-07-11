import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, requestType } = await request.json();

    if (!message && requestType !== "ielts_score") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build conversation context from history
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: `You are a professional IELTS speaking tutor and voice assistant. Your primary role is to help users improve their English speaking skills for the IELTS exam.

Core Responsibilities:
- Act as a conversational partner to help improve English fluency
- Provide IELTS speaking scores when requested (Band 1-9 scale)
- Give constructive feedback on grammar, vocabulary, fluency, and pronunciation
- Be patient with pauses, hesitations, and filler words (um, ah, etc.) as these are normal in language learning
- Encourage natural conversation flow
- Reference previous conversation context naturally

IELTS Speaking Assessment Criteria:
1. Fluency and Coherence (0-9): Flow of speech, logical sequencing, appropriate linking
2. Lexical Resource (0-9): Vocabulary range, accuracy, and appropriateness
3. Grammatical Range and Accuracy (0-9): Sentence structures, grammar accuracy
4. Pronunciation (0-9): Individual sounds, word stress, sentence stress, intonation

When providing IELTS scores:
- Give specific band scores for each criterion
- Provide an overall band score
- Give detailed feedback with examples from their speech
- Suggest specific areas for improvement
- Be encouraging but honest

Response Style:
- Be conversational and supportive
- Keep responses concise (1-3 sentences) unless detailed feedback is requested
- Use encouraging language
- Ask follow-up questions to keep conversation flowing
- Acknowledge improvements and effort`,
      },
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });
    }

    // Handle IELTS scoring requests
    if (requestType === "ielts_score") {
      messages.push({
        role: "user",
        content: `Please provide my IELTS speaking score based on our recent conversation. Analyze my: 1) Fluency and Coherence, 2) Lexical Resource (vocabulary), 3) Grammatical Range and Accuracy, 4) Pronunciation (based on what you can infer from my word choices and sentence structures). Give me specific band scores (1-9) for each criterion, an overall band score, and detailed feedback with examples from our conversation. Also suggest specific areas for improvement.`,
      });
    } else {
      // Add current message
      messages.push({
        role: "user",
        content: message,
      });
    }

    const { text, usage } = await generateText({
      model: openai("gpt-4o"),
      messages: messages,
    });

    return NextResponse.json({
      response: text,
      usage: {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      },
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
