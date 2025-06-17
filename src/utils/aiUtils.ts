
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

interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

/**
 * Fetches available models from the Akash API
 * @param apiKey The Akash API key
 * @returns Array of available models
 */
export const getAvailableModels = async (apiKey: string): Promise<ModelInfo[]> => {
  try {
    // Set the Authorization header with the API key
    client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    
    const response = await client.get<ModelsResponse>('/models');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};

/**
 * Removes <think> tags from AI response content
 * @param content The raw AI response content
 * @returns Content with <think> tags removed
 */
const removeThinkTags = (content: string): string => {
  // Remove <think>...</think> blocks including the tags themselves
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
};

/**
 * Gets an AI-generated response for a note
 * @param content The note content to analyze
 * @param apiKey The Akash API key
 * @param prompt The custom prompt to use
 * @param systemPrompt Optional system prompt
 * @param title Optional note title for context
 * @param model Optional model to use
 * @returns The AI response text
 */
export const getAIResponse = async (
  content: string, 
  apiKey: string, 
  prompt: string,
  systemPrompt: string = "You help users analyze and summarize notes. Be concise and insightful. Use markdown formatting to structure your responses - use bold, italics, bullet points, etc. as needed to highlight key information.",
  title?: string,
  model: string = "Meta-Llama-3-1-8B-Instruct-FP8"
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
        model,
        messages
      }
    );
    
    const rawContent = response.data.choices[0].message.content;
    // Remove <think> tags for reasoning models
    return removeThinkTags(rawContent);
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
 * @param model Optional model to use
 * @returns The AI summary
 */
export const getNoteSummary = async (
  content: string,
  apiKey: string,
  title?: string,
  model?: string
): Promise<string> => {
  // Load custom prompt from localStorage or use default
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  const summaryPrompt = promptsConfig.summary?.prompt || "Summarize this note in 2-3 bullet points (use markdown formatting):";
  const systemPrompt = promptsConfig.summary?.systemPrompt || "You help users analyze and summarize notes. Be concise and insightful. Use markdown formatting to structure your responses - use bold, italics, bullet points, etc. as needed to highlight key information.";
  const selectedModel = model || promptsConfig.summary?.model || "Meta-Llama-3-1-8B-Instruct-FP8";
  
  return getAIResponse(content, apiKey, summaryPrompt, systemPrompt, title, selectedModel);
};

/**
 * Gets AI-generated suggestions for enhancing a note
 * @param content The note content to enhance
 * @param apiKey The Akash API key
 * @param title Optional note title for context
 * @param model Optional model to use
 * @returns The AI suggestions
 */
export const getNoteEnhancement = async (
  content: string,
  apiKey: string,
  title?: string,
  model?: string
): Promise<string> => {
  // Load custom prompt from localStorage or use default
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  const enhancePrompt = promptsConfig.enhancement?.prompt || "Provide 2-3 suggestions to enhance or expand on this note (use markdown formatting):";
  const systemPrompt = promptsConfig.enhancement?.systemPrompt || "You help users enhance and expand their notes. Be creative and insightful. Use markdown formatting to structure your responses.";
  const selectedModel = model || promptsConfig.enhancement?.model || "Meta-Llama-3-1-8B-Instruct-FP8";
  
  return getAIResponse(content, apiKey, enhancePrompt, systemPrompt, title, selectedModel);
};

/**
 * Executes a custom AI prompt on the note content
 * @param content The note content
 * @param apiKey The Akash API key
 * @param promptId The ID of the custom prompt
 * @param title Optional note title for context
 * @param model Optional model to use
 * @returns The AI response
 */
export const executeCustomPrompt = async (
  content: string,
  apiKey: string,
  promptId: string,
  title?: string,
  model?: string
): Promise<string> => {
  // Load custom prompts from localStorage
  const promptsConfig = JSON.parse(localStorage.getItem("lope-ai-prompts") || "{}");
  const customPrompts = promptsConfig.customPrompts || [];
  const customPrompt = customPrompts.find((p: any) => p.id === promptId);
  
  if (!customPrompt) {
    return "Custom prompt not found";
  }
  
  const selectedModel = model || customPrompt.model || "Meta-Llama-3-1-8B-Instruct-FP8";
  
  return getAIResponse(
    content, 
    apiKey, 
    customPrompt.prompt,
    customPrompt.systemPrompt || "You are a helpful assistant. Analyze the given text and respond appropriately.",
    title,
    selectedModel
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
