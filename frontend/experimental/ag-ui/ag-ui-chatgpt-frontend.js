// ChatGPT-Powered AG-UI Frontend Builder
class ChatGPTFrontendModifier {
  constructor() {
    this.isActive = false;
    this.chatInterface = null;
    this.isProcessing = false;
    this.setupModifier();
  }

  setupModifier() {
    console.log('🤖 ChatGPT-powered AG-UI Frontend Builder initialized');
    this.createChatInterface();
    this.isActive = true;
  }

  createChatInterface() {
    // Create the ChatGPT-powered AG-UI interface
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatgpt-agui-frontend-modifier';
    chatContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 380px;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(25px);
      border: 2px solid #00ff88;
      border-radius: 1rem;
      z-index: 10000;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 12px 40px rgba(0, 255, 136, 0.4);
      animation: glow 3s ease-in-out infinite alternate;
    `;

    chatContainer.innerHTML = `
      <div class="chatgpt-agui-header" style="
        padding: 1rem;
        border-bottom: 2px solid #00ff88;
        background: linear-gradient(135deg, #001a12, #002a1a);
      ">
        <h3 style="
          color: #00ff88;
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          🤖 ChatGPT AG-UI Builder
          <span style="
            background: #00ff88;
            color: black;
            padding: 0.2rem 0.4rem;
            border-radius: 0.3rem;
            font-size: 0.6rem;
            font-weight: 600;
          ">LIVE</span>
        </h3>
        <p style="
          color: #ffffff;
          margin: 0.5rem 0 0 0;
          font-size: 0.75rem;
          opacity: 0.9;
        ">Powered by GPT-4o • Latest AI model</p>
      </div>
      
      <div class="chatgpt-agui-messages" id="chatgpt-agui-messages" style="
        height: 250px;
        overflow-y: auto;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.9);
      ">
        <div class="chatgpt-agui-message assistant" style="
          background: rgba(0, 255, 136, 0.15);
          border-left: 3px solid #00ff88;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          border-radius: 0.5rem;
          color: white;
          font-size: 0.8rem;
          line-height: 1.4;
        ">
          🎨 <strong>Hello!</strong> I'm your ChatGPT-powered frontend builder. I can understand complex requests and generate intelligent modifications.
          <br><br>
          <strong>Try advanced commands like:</strong><br>
          • "Create a cyberpunk theme with neon animations"<br>
          • "Make the interface more accessible for mobile"<br>
          • "Add particle effects to the background"<br>
          • "Redesign the team cards with hover animations"<br>
          • "Implement a dark mode toggle"
        </div>
      </div>
      
      <div class="chatgpt-agui-input-container" style="
        padding: 1rem;
        border-top: 2px solid #00ff88;
        background: rgba(0, 0, 0, 0.95);
      ">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input 
            type="text" 
            id="chatgpt-agui-command-input"
            placeholder="Describe your frontend modification..."
            style="
              flex: 1;
              background: rgba(0, 255, 136, 0.1);
              border: 2px solid #00ff88;
              border-radius: 0.5rem;
              padding: 0.75rem;
              color: white;
              font-size: 0.85rem;
              outline: none;
              transition: all 0.3s ease;
            "
          />
          <button 
            id="chatgpt-agui-send-btn"
            onclick="window.chatGPTModifier.processCommand()"
            style="
              background: linear-gradient(135deg, #00ff88, #00cc6a);
              border: none;
              border-radius: 0.5rem;
              padding: 0.75rem 1.25rem;
              cursor: pointer;
              font-size: 0.85rem;
              color: black;
              font-weight: 700;
              transition: all 0.3s ease;
              min-width: 80px;
            "
          >
            Send
          </button>
        </div>
        <div style="
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        ">
          <button onclick="window.chatGPTModifier.quickCommand('cyberpunk theme')" class="quick-btn">🌆 Cyberpunk</button>
          <button onclick="window.chatGPTModifier.quickCommand('bigger titles')" class="quick-btn">📏 Bigger</button>
          <button onclick="window.chatGPTModifier.quickCommand('add animations')" class="quick-btn">✨ Animate</button>
          <button onclick="window.chatGPTModifier.quickCommand('reset styles')" class="quick-btn">🔄 Reset</button>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);
    this.chatInterface = chatContainer;

    // Add enter key support
    document.getElementById('chatgpt-agui-command-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.isProcessing) {
        this.processCommand();
      }
    });

    // Add input focus effects
    const input = document.getElementById('chatgpt-agui-command-input');
    input.addEventListener('focus', () => {
      input.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
    });
    input.addEventListener('blur', () => {
      input.style.boxShadow = 'none';
    });

    this.addStyles();
    console.log('✅ ChatGPT AG-UI Frontend Modifier interface created');
  }

  async processCommand() {
    const input = document.getElementById('chatgpt-agui-command-input');
    const sendBtn = document.getElementById('chatgpt-agui-send-btn');
    const command = input.value.trim();
    
    if (!command || this.isProcessing) return;

    this.isProcessing = true;
    sendBtn.textContent = '⏳';
    sendBtn.style.background = '#666';

    this.addMessage('user', command);
    input.value = '';

    try {
      // Send to ChatGPT backend
      const response = await fetch('http://localhost:3001/api/openai-agui/modify-frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command })
      });

      const result = await response.json();

      if (result.success) {
        // Execute the generated code
        try {
          // Clean and validate the code before execution
          let codeToExecute = result.code;
          let explanationShown = false;
          
          // Handle GPT-4o's markdown JSON response format
          if (typeof result.code === 'string' && result.code.includes('```json')) {
            try {
              // Extract JSON from markdown code block
              const jsonMatch = result.code.match(/```json\n([\s\S]*?)\n```/);
              if (jsonMatch) {
                const innerJson = JSON.parse(jsonMatch[1]);
                if (innerJson.code) {
                  codeToExecute = innerJson.code;
                  // Update explanation if available
                  if (innerJson.explanation) {
                    this.addMessage('assistant', `🤖 ${innerJson.explanation}`);
                    explanationShown = true;
                  }
                }
              }
            } catch (parseError) {
              console.error('Failed to parse markdown JSON:', parseError);
            }
          }
          // Handle regular JSON in code field
          else if (typeof result.code === 'string' && result.code.includes('{') && result.code.includes('}')) {
            try {
              const parsed = JSON.parse(result.code);
              if (parsed.code) {
                codeToExecute = parsed.code;
              }
            } catch (jsonError) {
              // Not JSON, use as-is
            }
          }
          
          // Show explanation if not already shown
          if (!explanationShown && result.explanation) {
            this.addMessage('assistant', `🤖 ${result.explanation}`);
          }
          
          // Remove any remaining markdown code blocks
          codeToExecute = codeToExecute.replace(/```javascript\n?/g, '').replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          console.log('Executing code:', codeToExecute);
          
          // Add safety checks to the code
          const safeCode = `
            try {
              ${codeToExecute}
            } catch (error) {
              console.error('Code execution failed:', error);
              throw new Error('Element not found or invalid operation: ' + error.message);
            }
          `;
          
          // Create a function to safely execute the code
          const executeCode = new Function(safeCode);
          executeCode();
          
          this.addMessage('system', '✅ Modification applied successfully!');
        } catch (execError) {
          console.error('Code execution error:', execError);
          console.error('Failed code:', result.code);
          this.addMessage('error', `❌ ChatGPT code failed: ${execError.message}`);
          
          // Try a simple fallback based on common commands
          const fallbackResult = this.tryFallbackCommand(command);
          if (fallbackResult) {
            this.addMessage('system', `🔄 Using fallback: ${fallbackResult}`);
          } else {
            // Show the raw response for debugging
            this.addMessage('system', `🔍 Debug - Raw response: ${JSON.stringify(result, null, 2)}`);
          }
        }
      } else {
        this.addMessage('error', `❌ ${result.error || 'Failed to generate modification'}`);
      }

    } catch (error) {
      console.error('ChatGPT AG-UI error:', error);
      this.addMessage('error', `❌ Connection error: ${error.message}`);
    }

    this.isProcessing = false;
    sendBtn.textContent = 'Send';
    sendBtn.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
  }

  quickCommand(command) {
    if (this.isProcessing) return;
    
    document.getElementById('chatgpt-agui-command-input').value = command;
    this.processCommand();
  }

  tryFallbackCommand(command) {
    const cmd = command.toLowerCase();
    
    try {
      // Title modifications
      if (cmd.includes('title') && (cmd.includes('bigger') || cmd.includes('larger'))) {
        const titles = document.querySelectorAll('.title-metallic, h1, h2');
        if (titles.length > 0) {
          titles.forEach(el => {
            el.style.fontSize = '4rem';
            el.style.textShadow = '0 0 20px #00bfff';
          });
          return 'Made titles bigger with glow effect';
        }
      }
      
      // Background modifications
      else if (cmd.includes('background') && cmd.includes('blue')) {
        document.body.style.background = 'linear-gradient(135deg, #001122, #003366)';
        return 'Changed background to blue gradient';
      }
      
      // Button glow
      else if (cmd.includes('button') && cmd.includes('glow')) {
        const buttons = document.querySelectorAll('button');
        if (buttons.length > 0) {
          buttons.forEach(el => {
            el.style.boxShadow = '0 0 20px rgba(0, 191, 255, 0.6)';
            el.style.border = '1px solid #00bfff';
          });
          return 'Added glow effects to buttons';
        }
      }
      
      // Card modifications
      else if (cmd.includes('card') && (cmd.includes('larger') || cmd.includes('bigger'))) {
        const cards = document.querySelectorAll('.team-card, .stat-card, .floating-card');
        if (cards.length > 0) {
          cards.forEach(el => {
            el.style.transform = 'scale(1.15)';
            el.style.margin = '1rem';
          });
          return 'Made cards larger';
        }
      }
      
      // Cyberpunk theme
      else if (cmd.includes('cyberpunk') || cmd.includes('futuristic')) {
        document.body.style.background = 'linear-gradient(135deg, #000011, #001122)';
        const cards = document.querySelectorAll('.floating-card, .team-card');
        cards.forEach(el => {
          el.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.4)';
          el.style.border = '1px solid #00ffff';
        });
        return 'Applied cyberpunk theme';
      }
      
      return null;
    } catch (error) {
      console.error('Fallback failed:', error);
      return null;
    }
  }

  addMessage(type, content) {
    const messagesContainer = document.getElementById('chatgpt-agui-messages');
    const message = document.createElement('div');
    message.className = `chatgpt-agui-message ${type}`;
    
    let bgColor, borderColor, icon;
    switch(type) {
      case 'user':
        bgColor = 'rgba(0, 191, 255, 0.2)';
        borderColor = '#00bfff';
        icon = '👤';
        break;
      case 'assistant':
        bgColor = 'rgba(0, 255, 136, 0.15)';
        borderColor = '#00ff88';
        icon = '🤖';
        break;
      case 'system':
        bgColor = 'rgba(255, 255, 255, 0.1)';
        borderColor = '#ffffff';
        icon = '⚙️';
        break;
      case 'error':
        bgColor = 'rgba(255, 68, 68, 0.2)';
        borderColor = '#ff4444';
        icon = '❌';
        break;
    }
    
    message.style.cssText = `
      background: ${bgColor};
      border-left: 3px solid ${borderColor};
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      border-radius: 0.5rem;
      color: white;
      font-size: 0.8rem;
      line-height: 1.4;
      ${type === 'user' ? 'margin-left: 2rem;' : ''}
      animation: slideIn 0.3s ease;
    `;
    
    message.innerHTML = `${icon} ${content}`;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes glow {
        0% { box-shadow: 0 12px 40px rgba(0, 255, 136, 0.4); }
        100% { box-shadow: 0 12px 40px rgba(0, 255, 136, 0.6); }
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      .quick-btn {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid #00ff88;
        border-radius: 0.3rem;
        padding: 0.3rem 0.5rem;
        cursor: pointer;
        font-size: 0.7rem;
        color: #00ff88;
        transition: all 0.2s ease;
      }
      
      .quick-btn:hover {
        background: rgba(0, 255, 136, 0.3);
        transform: translateY(-1px);
      }
      
      #chatgpt-agui-command-input:focus {
        border-color: #00ff88;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
      }
      
      #chatgpt-agui-send-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize the ChatGPT modifier when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.chatGPTModifier = new ChatGPTFrontendModifier();
});