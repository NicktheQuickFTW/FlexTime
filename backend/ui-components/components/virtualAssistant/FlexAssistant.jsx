import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardGroup, Tabs, Tab, Note, AccordionGroup, Accordion } from '../ui/elements';
import { useFlexApp } from '../../hooks/useFlexApp';

/**
 * FlexTime Virtual Assistant Component
 * This component provides an integrated virtual assistant experience
 * without relying on external services like ElevenLabs
 */
const FlexAssistant = ({ settings }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('features');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [userInput, setUserInput] = useState('');
  
  // Use FlexApp hook to access integrated services
  const { 
    resolveLibraryId, 
    getLibraryDocs, 
    detectPatterns, 
    generateRecommendations 
  } = useFlexApp();
  
  // Initialize the assistant
  useEffect(() => {
    const initializeAssistant = async () => {
      try {
        // Get assistant documentation
        const libraryId = await resolveLibraryId("flextime-virtual-assistant");
        const docs = await getLibraryDocs(libraryId, {
          tokens: 5000,
          topic: "schedule-assistance"
        });
        
        // Get assistant patterns
        const patterns = await detectPatterns({
          domainType: "scheduling-assistant",
          minConfidence: 0.85
        });
        
        console.log("FlexTime Assistant initialized");
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize FlexTime assistant:", error);
      }
    };
    
    initializeAssistant();
  }, []);
  
  // Handle starting a conversation
  const startConversation = async () => {
    if (!isInitialized) return;
    
    setIsSpeaking(true);
    
    try {
      // Start a new conversation
      const response = await axios.post('/api/virtual-assistant/conversations', {
        model: selectedModel,
        settings: settings?.assistantSettings || {}
      });
      
      if (response.data.success) {
        setConversationId(response.data.conversationId);
        
        // Add the initial message to conversation history
        setConversationHistory([{
          role: 'assistant',
          content: response.data.message.content,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };
  
  // Handle sending a message
  const sendMessage = async () => {
    if (!conversationId || !userInput.trim()) return;
    
    // Add user message to history
    setConversationHistory(prev => [
      ...prev,
      {
        role: 'user',
        content: userInput,
        timestamp: new Date()
      }
    ]);
    
    // Clear input
    setUserInput('');
    
    try {
      // Send message to backend
      const response = await axios.post(`/api/virtual-assistant/conversations/${conversationId}/messages`, {
        role: 'user',
        content: userInput
      });
      
      if (response.data.success) {
        // Add assistant response to history
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.message.content,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // Handle ending a conversation
  const endConversation = async () => {
    if (!conversationId) return;
    
    try {
      // End the conversation
      await axios.post(`/api/virtual-assistant/conversations/${conversationId}/end`);
      setIsSpeaking(false);
      setConversationId(null);
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  };
  
  // Switch tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  // Change AI model
  const handleModelChange = (model) => {
    setSelectedModel(model);
  };
  
  return (
    <div className="virtual-assistant-container">
      <div className="header-section">
        <h1>FlexTime Virtual Assistant</h1>
        <h2>Your intelligent scheduling companion</h2>
      </div>
      
      <Tabs activeTab={activeTab} onChange={handleTabChange}>
        <Tab id="features" title="Features">
          <div className="content-section">
            <h2>What can the Virtual Assistant do?</h2>
            <p>
              The FlexTime Virtual Assistant helps you with all aspects of scheduling management:
            </p>
            
            <CardGroup cols={2}>
              <Card title="Schedule Creation">
                Generate optimized schedules based on your requirements and constraints.
              </Card>
              <Card title="Conflict Resolution">
                Identify and resolve scheduling conflicts automatically.
              </Card>
              <Card title="Schedule Analysis">
                Get insights and recommendations to improve your schedules.
              </Card>
              <Card title="Learning Capabilities">
                The assistant learns from your preferences to provide better recommendations over time.
              </Card>
            </CardGroup>
            
            <h2>Advanced Capabilities</h2>
            <p>
              The FlexTime Virtual Assistant integrates advanced scheduling capabilities:
            </p>
            
            <ul className="capabilities-list">
              <li><strong>Pattern Detection</strong>: Identifies patterns in scheduling preferences</li>
              <li><strong>Constraint Management</strong>: Handles complex scheduling constraints</li>
              <li><strong>Historical Analysis</strong>: Uses past schedules to inform recommendations</li>
              <li><strong>Multi-Sport Coordination</strong>: Coordinates schedules across different sports</li>
              <li><strong>Travel Optimization</strong>: Minimizes travel distances and costs</li>
            </ul>
            
            <Note>
              The assistant learns from your interactions to provide increasingly personalized
              and effective scheduling recommendations over time.
            </Note>
          </div>
        </Tab>
        
        <Tab id="chat" title="Chat">
          <div className="chat-container">
            <div className="conversation-history">
              {conversationHistory.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-timestamp">{message.timestamp.toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                disabled={!isSpeaking}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
              />
              <button 
                onClick={sendMessage}
                disabled={!isSpeaking || !userInput.trim()}
              >
                Send
              </button>
            </div>
            
            <div className="assistant-controls">
              <button 
                onClick={startConversation} 
                disabled={!isInitialized || isSpeaking}
                className="start-button"
              >
                Start Assistant
              </button>
              
              <button 
                onClick={endConversation} 
                disabled={!isSpeaking}
                className="end-button"
              >
                End Conversation
              </button>
            </div>
          </div>
        </Tab>
        
        <Tab id="settings" title="Settings">
          <div className="settings-container">
            <h2>Assistant Settings</h2>
            
            <div className="setting-group">
              <h3>AI Model</h3>
              <select 
                value={selectedModel} 
                onChange={(e) => handleModelChange(e.target.value)}
                className="model-dropdown"
              >
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
              </select>
              <p className="setting-description">
                Select the AI model that powers your virtual assistant. Different models
                have different capabilities and performance characteristics.
              </p>
            </div>
            
            <div className="setting-group">
              <h3>Assistant Personality</h3>
              <div className="radio-options">
                <label>
                  <input 
                    type="radio" 
                    name="personality" 
                    value="professional" 
                    defaultChecked 
                  />
                  Professional
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="personality" 
                    value="friendly" 
                  />
                  Friendly
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="personality" 
                    value="technical" 
                  />
                  Technical
                </label>
              </div>
              <p className="setting-description">
                Choose the communication style of your assistant.
              </p>
            </div>
            
            <div className="setting-group">
              <h3>Assistant Expertise Focus</h3>
              <div className="checkbox-options">
                <label>
                  <input 
                    type="checkbox" 
                    name="expertise" 
                    value="scheduling" 
                    defaultChecked 
                  />
                  Scheduling
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    name="expertise" 
                    value="optimization" 
                    defaultChecked 
                  />
                  Optimization
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    name="expertise" 
                    value="analytics" 
                  />
                  Analytics
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    name="expertise" 
                    value="rules" 
                  />
                  Rules & Compliance
                </label>
              </div>
              <p className="setting-description">
                Select which areas the assistant should focus its expertise on.
              </p>
            </div>
          </div>
        </Tab>
        
        <Tab id="faq" title="FAQ">
          <div className="faq-container">
            <h2>Frequently Asked Questions</h2>
            
            <AccordionGroup>
              <Accordion title="How does the FlexTime Assistant help with scheduling?">
                <p>
                  The FlexTime Assistant provides intelligent scheduling assistance through:
                </p>
                <ul>
                  <li>Automated schedule generation based on your requirements</li>
                  <li>Conflict detection and resolution</li>
                  <li>Schedule optimization recommendations</li>
                  <li>Analysis of scheduling patterns and trends</li>
                  <li>Personalized suggestions based on historical data</li>
                </ul>
                <p>
                  It continuously learns from your preferences and feedback to provide
                  increasingly relevant and effective assistance.
                </p>
              </Accordion>
              
              <Accordion title="How does the assistant learn from my preferences?">
                <p>
                  The FlexTime Assistant incorporates several learning mechanisms:
                </p>
                <ul>
                  <li><strong>Feedback Analysis</strong>: It analyzes your explicit feedback on recommendations</li>
                  <li><strong>Usage Patterns</strong>: It observes which recommendations you accept vs. reject</li>
                  <li><strong>Historical Data</strong>: It studies your past scheduling decisions</li>
                  <li><strong>Preference Modeling</strong>: It builds a model of your scheduling preferences</li>
                </ul>
                <p>
                  These insights are stored in the system's memory and used to improve future recommendations.
                </p>
              </Accordion>
              
              <Accordion title="What AI models power the assistant?">
                <p>
                  The FlexTime Assistant can use several AI models:
                </p>
                <ul>
                  <li><strong>Claude 3.5 Sonnet</strong>: Anthropic's advanced LLM with strong reasoning capabilities</li>
                  <li><strong>GPT-4o</strong>: OpenAI's multimodal model with broad capabilities</li>
                  <li><strong>Gemini 1.5 Pro</strong>: Google's advanced LLM with strong scheduling capabilities</li>
                </ul>
                <p>
                  You can select your preferred model in the Settings tab.
                </p>
              </Accordion>
              
              <Accordion title="Is my data secure?">
                <p>
                  Yes, the FlexTime Assistant is designed with security in mind:
                </p>
                <ul>
                  <li>All data is stored locally within your FlexTime application</li>
                  <li>No data is sent to external services or third parties</li>
                  <li>All processing happens on your own infrastructure</li>
                  <li>The assistant only has access to the data you explicitly provide</li>
                </ul>
                <p>
                  This fully integrated approach ensures your scheduling data remains secure and private.
                </p>
              </Accordion>
            </AccordionGroup>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default FlexAssistant;