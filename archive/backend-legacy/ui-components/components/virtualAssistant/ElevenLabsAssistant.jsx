import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardGroup, Tabs, Tab, Note, AccordionGroup, Accordion } from '../ui/elements';
import { useContext7 } from '../../hooks/useContext7';

/**
 * ElevenLabs Conversational AI Virtual Assistant Component
 * Integrates with Context7 to provide voice-based virtual assistance
 */
const ElevenLabsAssistant = ({ settings }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('minutes');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const videoRef = useRef(null);
  
  // Use Context7 hook to access MCP capabilities
  const { 
    resolveLibraryId, 
    getLibraryDocs, 
    detectPatterns, 
    generateRecommendations 
  } = useContext7();
  
  // Initialize the assistant with Context7
  useEffect(() => {
    const initializeAssistant = async () => {
      try {
        // Use Context7 to get the latest ElevenLabs documentation
        const libraryId = await resolveLibraryId("elevenlabs-conversational-ai");
        const docs = await getLibraryDocs(libraryId, {
          tokens: 5000,
          topic: "voice-agents"
        });
        
        // Get voice capability patterns
        const patterns = await detectPatterns({
          domainType: "voice-assistant",
          minConfidence: 0.85
        });
        
        console.log("ElevenLabs Assistant initialized with Context7");
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize ElevenLabs assistant:", error);
      }
    };
    
    initializeAssistant();
  }, []);
  
  // Handle starting a conversation
  const startConversation = async () => {
    if (!isInitialized) return;
    
    setIsSpeaking(true);
    
    try {
      // Use Context7 to generate personalized recommendations
      const recommendations = await generateRecommendations({
        userContext: settings?.userPreferences || {},
        assistantType: "conversational",
        modelPreference: selectedModel
      });
      
      // Add to conversation history
      setConversationHistory(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'How can I help you today?',
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };
  
  // Handle ending a conversation
  const endConversation = () => {
    setIsSpeaking(false);
  };
  
  // Switch pricing tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  // Change AI model
  const handleModelChange = (model) => {
    setSelectedModel(model);
  };
  
  return (
    <div className="conversational-ai-container">
      <div className="header-section">
        <h1>Conversational AI assistant</h1>
        <h2>Deploy customized, conversational voice agents in minutes</h2>
      </div>
      
      <div className="video-container" style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
        <iframe
          src="https://player.vimeo.com/video/1029660636"
          frameBorder="0"
          style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' }}
          className="aspect-video w-full rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          ref={videoRef}
        />
      </div>
      
      <div className="content-section">
        <h2>What is Conversational AI?</h2>
        <p>
          ElevenLabs Conversational AI is a platform for deploying customized, conversational voice agents. 
          Built in response to our customers' needs, our platform eliminates months of development time 
          typically spent building conversation stacks from scratch. It combines these building blocks:
        </p>
        
        <CardGroup cols={2}>
          <Card title="Speech to text">
            Our fine tuned ASR model that transcribes the caller's dialogue.
          </Card>
          <Card title="Language model">
            Choose from Gemini, Claude, OpenAI and more, or bring your own.
          </Card>
          <Card title="Text to speech">
            Our low latency, human-like TTS across 5k+ voices and 31 languages.
          </Card>
          <Card title="Turn taking">
            Our custom turn taking and interruption detection service that feels human.
          </Card>
        </CardGroup>
        
        <p className="description">
          Altogether it is a highly composable AI Voice agent solution that can scale to thousands of calls per day. 
          With server & client side tools, knowledge bases, dynamic agent instantiation and overrides, plus built-in 
          monitoring, it's the complete developer toolkit.
        </p>
        
        <Card title="Pricing" horizontal>
          15 minutes to get started on the free plan. Get 13,750 minutes included on the Business plan at
          $0.08 per minute on the Business plan, with extra minutes billed at $0.08, as well as
          significantly discounted pricing at higher volumes.
          <br />
          <strong>Setup & Prompt Testing</strong>: billed at half the cost.
        </Card>
        
        <Note>
          Usage is billed to the account that created the agent. If authentication is not enabled, anybody
          with your agent's id can connect to it and consume your credits. To protect against this, either
          enable authentication for your agent or handle the agent id as a secret.
        </Note>
        
        <h2>Pricing tiers</h2>
        
        <Tabs activeTab={activeTab} onChange={handleTabChange}>
          <Tab id="minutes" title="In Minutes">
            <table>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Price</th>
                  <th>Minutes included</th>
                  <th>Cost per extra minute</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Free</td>
                  <td>$0</td>
                  <td>15</td>
                  <td>Unavailable</td>
                </tr>
                <tr>
                  <td>Starter</td>
                  <td>$5</td>
                  <td>50</td>
                  <td>Unavailable</td>
                </tr>
                <tr>
                  <td>Creator</td>
                  <td>$22</td>
                  <td>250</td>
                  <td>~$0.12</td>
                </tr>
                <tr>
                  <td>Pro</td>
                  <td>$99</td>
                  <td>1100</td>
                  <td>~$0.11</td>
                </tr>
                <tr>
                  <td>Scale</td>
                  <td>$330</td>
                  <td>3,600</td>
                  <td>~$0.10</td>
                </tr>
                <tr>
                  <td>Business</td>
                  <td>$1,320</td>
                  <td>13,750</td>
                  <td>$0.08 (annual), $0.096 (monthly)</td>
                </tr>
              </tbody>
            </table>
          </Tab>
          <Tab id="credits" title="In Credits">
            <table>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Price</th>
                  <th>Credits included</th>
                  <th>Cost in credits per extra minute</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Free</td>
                  <td>$0</td>
                  <td>10,000</td>
                  <td>Unavailable</td>
                </tr>
                <tr>
                  <td>Starter</td>
                  <td>$5</td>
                  <td>30,000</td>
                  <td>Unavailable</td>
                </tr>
                <tr>
                  <td>Creator</td>
                  <td>$22</td>
                  <td>100,000</td>
                  <td>400</td>
                </tr>
                <tr>
                  <td>Pro</td>
                  <td>$99</td>
                  <td>500,000</td>
                  <td>454</td>
                </tr>
                <tr>
                  <td>Scale</td>
                  <td>$330</td>
                  <td>2,000,000</td>
                  <td>555</td>
                </tr>
                <tr>
                  <td>Business</td>
                  <td>$1,320</td>
                  <td>11,000,000</td>
                  <td>800</td>
                </tr>
              </tbody>
            </table>
          </Tab>
        </Tabs>
        
        <Note>
          Today we're covering the LLM costs, though these will be passed through to customers in the
          future.
        </Note>
        
        <h2>Models</h2>
        <p>
          Currently, the following models are natively supported and can be configured via the agent settings:
        </p>
        
        <ul className="models-list">
          <li>Gemini 2.0 Flash</li>
          <li>Gemini 1.5 Flash</li>
          <li>Gemini 1.5 Pro</li>
          <li>Gemini 1.0 Pro</li>
          <li>GPT-4o Mini</li>
          <li>GPT-4o</li>
          <li>GPT-4 Turbo</li>
          <li>GPT-3.5 Turbo</li>
          <li>Claude 3.5 Sonnet</li>
          <li>Claude 3 Haiku</li>
        </ul>
        
        <div className="model-selection">
          <h3>Select a model for your virtual assistant</h3>
          <select 
            value={selectedModel} 
            onChange={(e) => handleModelChange(e.target.value)}
            className="model-dropdown"
          >
            <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
            <option value="GPT-4o">GPT-4o</option>
            <option value="Gemini 2.0 Flash">Gemini 2.0 Flash</option>
            <option value="GPT-4 Turbo">GPT-4 Turbo</option>
          </select>
        </div>
        
        <p>
          You can start with our <a href="https://elevenlabs.io/app/sign-up">free tier</a>, which includes 15 minutes of conversation per month.
        </p>
        
        <p>
          Need more? Upgrade to a <a href="https://elevenlabs.io/pricing/api">paid plan</a> instantly - no sales calls required. 
          For enterprise usage (6+ hours of daily conversation), <a href="https://elevenlabs.io/contact-sales">contact our sales team</a> for custom pricing tailored to your needs.
        </p>
        
        <h2>Popular applications</h2>
        <p>Companies and creators use our Conversational AI orchestration platform to create:</p>
        
        <ul>
          <li><strong>Customer service</strong>: Assistants trained on company documentation that can handle customer queries, troubleshoot issues, and provide 24/7 support in multiple languages.</li>
          <li><strong>Virtual assistants</strong>: Assistants trained to manage scheduling, set reminders, look up information, and help users stay organized throughout their day.</li>
          <li><strong>Retail support</strong>: Assistants that help customers find products, provide personalized recommendations, track orders, and answer product-specific questions.</li>
          <li><strong>Personalized learning</strong>: Assistants that help students learn new topics & enhance reading comprehension by speaking with books and articles.</li>
        </ul>
        
        <Note>
          Ready to get started? Check out our quickstart guide to create your first AI agent in minutes.
        </Note>
        
        <h2>FAQ</h2>
        
        <AccordionGroup>
          <Accordion title="Concurrency limits">
            <h3>Plan limits</h3>
            <p>Your subscription plan determines how many calls can be made simultaneously.</p>
            
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Concurrency limit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Free</td>
                  <td>4</td>
                </tr>
                <tr>
                  <td>Starter</td>
                  <td>6</td>
                </tr>
                <tr>
                  <td>Creator</td>
                  <td>10</td>
                </tr>
                <tr>
                  <td>Pro</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>Scale</td>
                  <td>30</td>
                </tr>
                <tr>
                  <td>Business</td>
                  <td>30</td>
                </tr>
                <tr>
                  <td>Enterprise</td>
                  <td>Elevated</td>
                </tr>
              </tbody>
            </table>
            
            <Note>
              To increase your concurrency limit <a href="https://elevenlabs.io/pricing/api">upgrade your subscription plan</a>
              or <a href="https://elevenlabs.io/contact-sales">contact sales</a> to discuss enterprise plans.
            </Note>
          </Accordion>
          
          <Accordion title="Supported audio formats">
            <p>The following audio output formats are supported in the Conversational AI platform:</p>
            
            <ul>
              <li>PCM (8 kHz / 16 kHz / 22.05 kHz / 24 kHz / 44.1 kHz)</li>
              <li>μ-law 8000Hz</li>
            </ul>
          </Accordion>
        </AccordionGroup>
        
        <div className="assistant-controls">
          <button 
            onClick={startConversation} 
            disabled={!isInitialized || isSpeaking}
            className="start-button"
          >
            Start Virtual Assistant
          </button>
          
          <button 
            onClick={endConversation} 
            disabled={!isSpeaking}
            className="end-button"
          >
            End Conversation
          </button>
        </div>
        
        <div className="conversation-history">
          {conversationHistory.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">{message.content}</div>
              <div className="message-timestamp">{message.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElevenLabsAssistant;
