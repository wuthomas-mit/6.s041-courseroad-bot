import axios from 'axios';
import requirementsService from './requirementsService';

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

  // Helper to trim long text to a maximum character length
  trimText(text, maxLength = 30000) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    // Simple truncation with a note
    return text.substring(0, maxLength) + 
      `\n\n[Note: Text was truncated due to length. The full data is available but has been summarized for this response.]`;
  }

  // Send a message to the OpenAI API
  async sendMessage(message, context) {
    if (!this.hasApiKey()) {
      throw new Error('OpenAI API key not set. Please set your API key first.');
    }

    try {
      // Get the selected programs of study
      const coursesOfStudy = context.coursesOfStudy || [];
      
      // Get relevant requirements data based on selected programs
      let requirementsData = await requirementsService.getRequirementsForPrograms(coursesOfStudy);

      // Get selected course 6 programs for more targeted information
      const selectedCourse6Programs = coursesOfStudy.filter(program => program.startsWith('major6'));

      // Trim the text to reasonable sizes for the context window
      const eecsPrograms = this.trimText(requirementsData.eecsPrograms, 8000);
      const eecsRequirements = requirementsData.eecsRequirements ? 
        this.trimText(requirementsData.eecsRequirements, 20000) : '';

      // Create system message with context about CourseRoad
      const systemMessage = `You are a friendly, conversational AI assistant for MIT CourseRoad, a course planning tool for MIT students. 
Your goal is to help students plan their academic path by guiding them through degree requirements, course options, and program choices — in a way that feels approachable, helpful, and not overwhelming.

Instead, structure your response like this:

INTRODUCTION
A warm intro acknowledging their interest.

REQUIREMENTS
1. GIRs:
   - Science: Brief explanation
   - HASS: Brief explanation
   - Other requirements

2. Major Core:
   - Key courses required for the major
   - Additional requirements

3. Electives:
   - Overview of elective options

NEXT STEPS
A friendly follow-up question to guide next steps.

Use plenty of line breaks and spacing. Avoid markdown formatting. Instead use plain text formatting with clear structure:
- Use ALL CAPS for section headers
- Use numbers and indented bullets (with spaces) for lists
- Leave empty lines between sections and items for readability
- Use simple formatting that will display well in any text field

Use this context to help tailor your responses:
Selected Subjects: ${JSON.stringify(context.selectedSubjects)}
Programs of Study: ${JSON.stringify(coursesOfStudy)}

Here's additional reference information about MIT requirements and programs:

=== MIT EECS Program Requirements Summary ===
${eecsPrograms}

${eecsRequirements ? `=== Detailed EECS Degree Requirements ===
${eecsRequirements}` : ''}

${selectedCourse6Programs.length > 0 ? 
  `The student is particularly interested in the following Course 6 programs: ${selectedCourse6Programs.join(', ')}. 
  Prioritize these when giving suggestions.` : ''}

Be concise, encouraging, and informative. Use plain text formatting with plenty of line breaks, indentation, and spaces to ensure your responses are readable and well-structured. Avoid markdown or rich text formatting. Focus on clear visual organization using spaces, line breaks, and simple characters.`;

      


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
          temperature: 0.3, // Lower temperature for more structured, predictable responses
          max_tokens: 1000 // Increased to handle longer responses with detailed information
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