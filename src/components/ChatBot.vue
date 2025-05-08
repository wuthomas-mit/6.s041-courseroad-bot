<template>
  <div class="chat-container">
    <v-card class="chat-card">
      <v-card-title class="chat-header">
        <span>CourseRoad Assistant</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="minimizeChatbot">
          <v-icon>{{ isMinimized ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
        </v-btn>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <div v-if="!isMinimized">
        <div v-if="!apiKeySet" class="api-key-container">
          <p>Please enter your OpenAI API key to use the chatbot:</p>
          <v-text-field
            v-model="apiKey"
            label="OpenAI API Key"
            type="password"
            outlined
            dense
            hide-details
            class="mb-2"
          ></v-text-field>
          <v-btn color="primary" @click="saveApiKey" :disabled="!apiKey.trim()">
            Save API Key
          </v-btn>
          <p class="text-caption mt-2">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
          <p class="text-caption">
            Don't have an API key? Get one from 
            <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI's platform</a>.
          </p>
        </div>
        
        <div v-else>
          <v-card-text class="chat-messages">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.sender === 'user' ? 'user-message' : 'bot-message']"
            >
              <div class="message-content">
                <div v-if="message.sender === 'bot'" class="bot-avatar">
                  <v-icon small>mdi-robot</v-icon>
                </div>
                <div v-if="message.sender === 'user'" class="user-avatar">
                  <v-icon small>mdi-account</v-icon>
                </div>
                <div class="message-text" v-html="formatMessage(message.text)"></div>
              </div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
            
            <div v-if="showSuggestions && messages.length <= 1" class="suggested-questions">
              <p class="text-subtitle-2">Try asking:</p>
              <v-chip
                v-for="(question, i) in suggestedQuestions"
                :key="i"
                class="ma-1"
                @click="askSuggestedQuestion(question)"
              >
                {{ question }}
              </v-chip>
            </div>
            
            <div v-if="error" class="error-message">
              <v-alert type="error" dense>{{ error }}</v-alert>
            </div>
            <div v-if="isLoading" class="loading-indicator">
              <v-progress-circular
                indeterminate
                color="primary"
                size="20"
              ></v-progress-circular>
            </div>
            <div ref="messagesEnd"></div>
          </v-card-text>

          <v-card-actions class="chat-input">
            <v-text-field
              v-model="inputMessage"
              placeholder="Ask a question about courses..."
              outlined
              dense
              hide-details
              @keyup.enter="sendMessage"
            ></v-text-field>
            <v-btn icon color="primary" @click="sendMessage" :disabled="!inputMessage.trim() || isLoading">
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </v-card-actions>
          
          <div v-if="showSettings" class="chat-settings">
            <v-divider></v-divider>
            <v-card-text>
              <p class="text-subtitle-2">API Settings</p>
              <v-text-field
                v-model="apiKey"
                label="OpenAI API Key"
                type="password"
                outlined
                dense
                hide-details
                class="mb-2"
              ></v-text-field>
              <v-btn color="primary" @click="saveApiKey" :disabled="!apiKey.trim()">
                Update API Key
              </v-btn>
              <v-btn text @click="showSettings = false" class="ml-2">
                Cancel
              </v-btn>
            </v-card-text>
          </div>
          
          <v-card-actions v-if="!showSettings" class="chat-footer">
            <v-btn text small @click="showSettings = true">
              <v-icon small class="mr-1">mdi-cog</v-icon>
              API Settings
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn text small @click="clearChat">
              <v-icon small class="mr-1">mdi-delete</v-icon>
              Clear Chat
            </v-btn>
          </v-card-actions>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import moment from 'moment';
import chatService from '../services/chatService';

export default {
  name: 'ChatBot',
  data() {
    return {
      inputMessage: '',
      isMinimized: false,
      isLoading: false,
      messages: [
        {
          text: "Hi there! I'm your CruiseControl! How can I help you with your course planning?",
          sender: 'bot',
          timestamp: new Date()
        }
      ],
      apiKey: '',
      apiKeySet: false,
      showSettings: false,
      showSuggestions: true,
      error: null,
      suggestedQuestions: [
        'What classes should I take for 6-3?',
        'How many units do I need to graduate?',
        'What are HASS requirements?',
        'Tell me about my current courses',
        'What prerequisites do I need for 6.1220?'
      ]
    };
  },
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) return;
      
      // Clear any previous errors
      this.error = null;
      
      // Add user message
      this.messages.push({
        text: this.inputMessage,
        sender: 'user',
        timestamp: new Date()
      });
      
      const userQuery = this.inputMessage;
      this.inputMessage = '';
      this.isLoading = true;
      this.showSuggestions = false;
      
      // Get the current course selection for context
      const roadContents = this.$store.state.roads[this.$store.state.activeRoad].contents;
      const selectedSubjects = roadContents.selectedSubjects.flat().map(subject => subject.subject_id);
      const coursesOfStudy = roadContents.coursesOfStudy;
      
      try {
        // Use the chat service to get a response
        const response = await chatService.sendMessage(userQuery, {
          selectedSubjects,
          coursesOfStudy
        });
        
        // Add bot response
        this.messages.push({
          text: response,
          sender: 'bot',
          timestamp: new Date()
        });
      } catch (err) {
        console.error('Error sending message:', err);
        this.error = err.message;
      } finally {
        this.isLoading = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    askSuggestedQuestion(question) {
      this.inputMessage = question;
      this.sendMessage();
    },
    
    saveApiKey() {
      if (!this.apiKey.trim()) return;
      
      // Save the API key to the service
      chatService.setApiKey(this.apiKey);
      
      // Save the API key to localStorage for persistence
      localStorage.setItem('openai_api_key', this.apiKey);
      
      // Update UI state
      this.apiKeySet = true;
      this.showSettings = false;
      
      // Clear any previous errors
      this.error = null;
    },
    
    clearChat() {
      this.messages = [
        {
          text: "Chat cleared. How can I help you with your course planning?",
          sender: 'bot',
          timestamp: new Date()
        }
      ];
      this.showSuggestions = true;
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesEnd;
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    },
    
    minimizeChatbot() {
      this.isMinimized = !this.isMinimized;
    },
    
    formatTime(timestamp) {
      return moment(timestamp).format('h:mm A');
    },
    
    formatMessage(text) {
      if (!text) return '';
      
      // Handle section headers (all caps words followed by a line break)
      let formattedText = text.replace(/^([A-Z][A-Z\s]+)$/gm, '<strong>$1</strong>');
      
      // Handle numbered lists with proper indentation
      formattedText = formattedText.replace(/^(\d+\.)\s+(.+)$/gm, '<div class="list-item"><span class="list-number">$1</span> $2</div>');
      
      // Handle bullet points with proper indentation
      formattedText = formattedText.replace(/^-\s+(.+)$/gm, '<div class="list-item"><span class="list-bullet">•</span> $1</div>');
      
      // Convert line breaks to <br> tags
      formattedText = formattedText.replace(/\n/g, '<br>');
      
      // Preserve multiple spaces 
      formattedText = formattedText.replace(/ {2,}/g, function(match) {
        return '&nbsp;'.repeat(match.length);
      });
      
      return formattedText;
    }
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    // Check if we have a saved API key
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      this.apiKey = savedApiKey;
      chatService.setApiKey(savedApiKey);
      this.apiKeySet = true;
    }
    
    this.scrollToBottom();
  }
};
</script>

<style scoped>
/* Add class to detect dark mode from Vuetify theme system */
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  z-index: 1000;
}

.chat-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.chat-header {
  padding: 10px 16px;
  background-color: var(--v-primary-base) !important;
  color: white !important;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-message {
  align-self: flex-start;
  background-color: var(--v-grey-lighten3) !important;
  margin-left: auto;
}

.bot-message {
  max-width: 90%; /* Bot messages can be wider to accommodate formatted text */
  align-self: flex-start;
  background-color: var(--v-grey-lighten3) !important;
  margin-right: auto;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.user-message .message-content {
  flex-direction: row-reverse;
}

.bot-avatar,
.user-avatar {
  margin: 0 8px;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--v-primary-base) !important;
  color: white !important;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-text {
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
  padding: 8px;
  white-space: pre-wrap;
}

/* Additional styling for formatted messages */
.message-text strong {
  font-weight: 600;
}

.message-text h3, 
.message-text h4 {
  margin: 10px 0 5px 0;
  font-weight: 600;
}

.message-text ul, 
.message-text ol {
  padding-left: 20px;
  margin: 5px 0;
}

.message-text p {
  margin: 8px 0;
}

.message-text .list-item {
  margin: 4px 0;
  display: flex;
  align-items: flex-start;
}

.message-text .list-number, 
.message-text .list-bullet {
  margin-right: 6px;
  font-weight: 600;
  color: var(--v-primary-base);
}

.message-text strong {
  display: block;
  margin: 12px 0 6px 0;
  color: var(--v-primary-darken1);
  font-size: 16px;
}

.user-message .message-text {
  color: rgba(0, 0, 0, 0.87) !important;
  text-align: right;
}

.bot-message .message-text {
  color: rgba(0, 0, 0, 0.87) !important;
  text-align: left;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 4px;
  opacity: 0.7;
  position: absolute;
  bottom: -16px;
  font-style: italic;
}

.user-message .message-time {
  right: 4px;
}

.bot-message .message-time {
  left: 4px;
}

/* Dark mode specific styles */
.v-application.theme--dark .bot-message {
  background-color: #424242 !important;
}

.v-application.theme--dark .bot-message .message-text {
  color: rgba(255, 255, 255, 0.87) !important;
}

.v-application.theme--dark .user-message {
  background-color: var(--v-primary-darken1) !important;
}

.v-application.theme--dark .message-time {
  color: rgba(255, 255, 255, 0.6) !important;
}

.v-application.theme--dark .suggested-questions {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.v-application.theme--dark .suggested-questions .text-subtitle-2 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.v-application.theme--dark .api-key-container p {
  color: rgba(255, 255, 255, 0.87) !important;
}

.v-application.theme--dark .api-key-container .text-caption {
  color: rgba(255, 255, 255, 0.7) !important;
}

.v-application.theme--dark .chat-settings {
  background-color: #424242 !important;
}

.chat-input {
  padding: 8px 16px;
  display: flex;
  gap: 8px;
}

.chat-footer {
  padding: 0 16px 8px;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.api-key-container {
  padding: 16px;
}

.api-key-container p {
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.87);
}

.api-key-container .text-caption {
  color: rgba(0, 0, 0, 0.6);
}

.api-key-container a {
  color: var(--v-primary-base);
  text-decoration: none;
}

.api-key-container a:hover {
  text-decoration: underline;
}

.error-message {
  margin: 10px 0;
}

.chat-settings {
  padding-bottom: 10px;
}

.suggested-questions {
  margin: 10px 0;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.suggested-questions .v-chip {
  margin: 4px;
  cursor: pointer;
  background-color: var(--v-primary-lighten4) !important;
  color: var(--v-primary-darken2) !important;
  font-weight: 500;
  transition: all 0.2s ease;
}

.suggested-questions .v-chip:hover {
  background-color: var(--v-primary-lighten3) !important;
  transform: translateY(-1px);
}

.suggested-questions .text-subtitle-2 {
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.6);
}
</style> 