import axios from 'axios';

// This service handles communication with the OpenAI API
class ChatService {
  constructor() {
    // Try to get API key from environment variables first
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = import.meta.env.VITE_LLM_MODEL || 'gpt-3.5-turbo';
  }

  // Set the API key
  setApiKey(key) {
    this.apiKey = key;
  }

  // Check if API key is set
  hasApiKey() {
    return this.apiKey && this.apiKey.trim() !== '';
  }

  // Send a message to the OpenAI API
  async sendMessage(message, context) {
    if (!this.hasApiKey()) {
      throw new Error('OpenAI API key not set. Please set your API key first.');
    }

    try {
      // Create system message with context about CourseRoad
      const systemMessage = `You are an AI assistant for MIT CourseRoad, a course planning tool for MIT students. 
      You help students plan their academic journey by providing information about courses, requirements, 
      and degree programs. Use the following context to help answer questions about the student's current course selection:
      Selected Subjects: ${JSON.stringify(context.selectedSubjects)}
      Programs of Study: ${JSON.stringify(context.coursesOfStudy)}`;

      // Make request to OpenAI API
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Return the response text
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      if (error.response && error.response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      
      throw new Error('Failed to get a response from the AI. Please try again later.');
    }
  }
}

// Create and export a singleton instance
const chatService = new ChatService();
export default chatService; 