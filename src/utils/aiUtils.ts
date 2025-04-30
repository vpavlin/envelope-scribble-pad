
import axios from 'axios';

// Create an axios client for the Akash API
const client = axios.create({
  baseURL: 'https://chatapi.akash.network/api/v1',
  headers: {
    'Content-Type': 'application/json',
  }
});

interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface ChatResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Gets an AI-generated summary or suggestions for a note
 * @param content The note content to analyze
 * @param apiKey The Akash API key
 * @param prompt Optional custom prompt
 * @returns The AI response text
 */
export const getNoteSummary = async (
  content: string, 
  apiKey: string, 
  prompt: string = "Summarize this note in 2-3 bullet points:"
): Promise<string> => {
  try {
    // Set the Authorization header with the API key
    client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    
    // If content is provided, add it to the prompt
    const finalPrompt = content ? `${prompt}\n\n${content}` : prompt;
    
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "You help users analyze and summarize notes. Be concise and insightful."
      },
      {
        role: "user",
        content: finalPrompt
      }
    ];
    
    const response = await client.post<ChatResponse>(
      '/chat/completions',
      {
        model: "Meta-Llama-3-1-8B-Instruct-FP8",
        messages
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI summary:', error);
    return "Failed to generate summary. Please check your API key or try again later.";
  }
};

/**
 * Gets AI-generated suggestions for enhancing a note
 * @param content The note content to enhance
 * @param apiKey The Akash API key
 * @returns The AI suggestions
 */
export const getNoteEnhancement = async (
  content: string,
  apiKey: string
): Promise<string> => {
  return getNoteSummary(content, apiKey, 
    "Provide 2-3 suggestions to enhance or expand on this note:");
};
