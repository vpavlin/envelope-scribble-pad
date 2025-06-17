
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
 * Gets an AI-generated response for a note
 * @param content The note content to analyze
 * @param apiKey The Akash API key
 * @param prompt The custom prompt to use
 * @param systemPrompt Optional system prompt
 * @param title Optional note title for context
 * @returns The AI response text
 */
export const getAIResponse = async (
  content: string, 
  apiKey: string, 
  prompt: string,
  systemPrompt: string = "You help users analyze and summarize notes. Be concise and insightful. Use markdown formatting to structure your responses - use bold, italics, bullet points, etc. as needed to highlight key information.",
  title?: string
): Promise<string> => {
  try {
    // Set the Authorization header with the API key
    client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    
    // Build the context with title and content
    let contextText = '';
    if (title) {
      contextText += `Title: ${title}\n\n`;
    }
    if (content) {
      contextText += `Content: ${content}`;
    }
    
    // If context is provided, add it to the prompt
    const finalPrompt = contextText ? `${prompt}\n\n${contextText}` : prompt;
    
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt
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
    console.error('Error getting AI response:', error);
    return "Failed to generate response. Please check your API key or try again later.";
  }
};

/**
 * Gets an AI-generated summary for a note
 * @param content The note content to analyze
 * @param apiKey The Akash API key
 * @param title Optional note title for context
 * @returns The AI summary
 */
export const getNoteSummary = async (
  content: string,
  apiKey: string,
  title?: string
): Promise<string> => {
  // Load custom prompt from localStorage or use default
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  const summaryPrompt = promptsConfig.summary?.prompt || "Summarize this note in 2-3 bullet points (use markdown formatting):";
  const systemPrompt = promptsConfig.summary?.systemPrompt || "You help users analyze and summarize notes. Be concise and insightful. Use markdown formatting to structure your responses - use bold, italics, bullet points, etc. as needed to highlight key information.";
  
  return getAIResponse(content, apiKey, summaryPrompt, systemPrompt, title);
};

/**
 * Gets AI-generated suggestions for enhancing a note
 * @param content The note content to enhance
 * @param apiKey The Akash API key
 * @param title Optional note title for context
 * @returns The AI suggestions
 */
export const getNoteEnhancement = async (
  content: string,
  apiKey: string,
  title?: string
): Promise<string> => {
  // Load custom prompt from localStorage or use default
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  const enhancePrompt = promptsConfig.enhancement?.prompt || "Provide 2-3 suggestions to enhance or expand on this note (use markdown formatting):";
  const systemPrompt = promptsConfig.enhancement?.systemPrompt || "You help users enhance and expand their notes. Be creative and insightful. Use markdown formatting to structure your responses.";
  
  return getAIResponse(content, apiKey, enhancePrompt, systemPrompt, title);
};

/**
 * Executes a custom AI prompt on the note content
 * @param content The note content
 * @param apiKey The Akash API key
 * @param promptId The ID of the custom prompt
 * @param title Optional note title for context
 * @returns The AI response
 */
export const executeCustomPrompt = async (
  content: string,
  apiKey: string,
  promptId: string,
  title?: string
): Promise<string> => {
  // Load custom prompts from localStorage
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  const customPrompts = promptsConfig.customPrompts || [];
  const customPrompt = customPrompts.find((p: any) => p.id === promptId);
  
  if (!customPrompt) {
    return "Custom prompt not found";
  }
  
  return getAIResponse(
    content, 
    apiKey, 
    customPrompt.prompt,
    customPrompt.systemPrompt || "You are a helpful assistant. Analyze the given text and respond appropriately.",
    title
  );
};

/**
 * Get all configured prompts (built-in and custom)
 */
export const getConfiguredPrompts = () => {
  const defaultPrompts = [
    {
      id: "summary",
      label: "Summarize",
      description: "Generate a concise summary of the note",
      prompt: "Summarize this note in 2-3 bullet points (use markdown formatting):",
      systemPrompt: "You help users analyze and summarize notes. Be concise and insightful. Use markdown formatting to structure your responses - use bold, italics, bullet points, etc. as needed to highlight key information.",
      builtin: true
    },
    {
      id: "enhancement",
      label: "Enhance",
      description: "Get suggestions to improve the note",
      prompt: "Provide 2-3 suggestions to enhance or expand on this note (use markdown formatting):",
      systemPrompt: "You help users enhance and expand their notes. Be creative and insightful. Use markdown formatting to structure your responses.",
      builtin: true
    }
  ];

  // Load custom prompts from localStorage
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  
  // Merge built-in prompts with any customizations
  const builtInPrompts = defaultPrompts.map(prompt => {
    if (promptsConfig[prompt.id]) {
      return {
        ...prompt,
        ...promptsConfig[prompt.id],
        builtin: true
      };
    }
    return prompt;
  });
  
  // Add custom prompts
  const customPrompts = promptsConfig.customPrompts || [];
  
  return [...builtInPrompts, ...customPrompts];
};

/**
 * Save all prompt configurations to localStorage
 */
export const savePromptConfig = (configuration: any) => {
  localStorage.setItem("lope-ai-prompts", JSON.stringify(configuration));
};
