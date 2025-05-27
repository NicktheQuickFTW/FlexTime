// AG-UI Frontend Modifier - Real-time UI modifications through natural language
class FlexTimeFrontendModifier {
  constructor() {
    this.isActive = false;
    this.chatInterface = null;
    this.setupModifier();
  }

  setupModifier() {
    console.log('🎨 FlexTime Frontend Modifier initialized');
    this.createChatInterface();
    this.isActive = true;
  }

  createChatInterface() {
    // Create the AG-UI chat interface for frontend modifications
    const chatContainer = document.createElement('div');
    chatContainer.id = 'agui-frontend-modifier';
    chatContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(20px);
      border: 1px solid #00bfff;
      border-radius: 1rem;
      z-index: 10000;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 8px 32px rgba(0, 191, 255, 0.3);
    `;

    chatContainer.innerHTML = `
      <div class="agui-header" style="
        padding: 1rem;
        border-bottom: 1px solid #00bfff;
        background: linear-gradient(135deg, #001122, #002244);
      ">
        <h3 style="
          color: #00bfff;
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
        ">🎨 AG-UI Frontend Builder</h3>
        <p style="
          color: #ffffff;
          margin: 0.5rem 0 0 0;
          font-size: 0.7rem;
          opacity: 0.8;
        ">Tell me how to modify the interface</p>
      </div>
      
      <div class="agui-messages" id="agui-messages" style="
        height: 200px;
        overflow-y: auto;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.8);
      ">
        <div class="agui-message assistant" style="
          background: rgba(0, 191, 255, 0.1);
          border-left: 3px solid #00bfff;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 0.5rem;
          color: white;
          font-size: 0.8rem;
        ">
          Hi! I can help you modify the FlexTime interface in real-time. Try commands like:
          <br><br>
          • "Make the title bigger"<br>
          • "Change the background to blue"<br>
          • "Add a glow effect to buttons"<br>
          • "Make it more futuristic"<br>
          • "Change team cards to red"
        </div>
      </div>
      
      <div class="agui-input-container" style="
        padding: 1rem;
        border-top: 1px solid #00bfff;
        background: rgba(0, 0, 0, 0.9);
      ">
        <div style="display: flex; gap: 0.5rem;">
          <input 
            type="text" 
            id="agui-command-input"
            placeholder="e.g., 'make the cards larger'"
            style="
              flex: 1;
              background: rgba(0, 191, 255, 0.1);
              border: 1px solid #00bfff;
              border-radius: 0.375rem;
              padding: 0.5rem;
              color: white;
              font-size: 0.8rem;
            "
          />
          <button 
            onclick="window.flexTimeModifier.processCommand()"
            style="
              background: linear-gradient(135deg, #00bfff, #0099cc);
              border: none;
              border-radius: 0.375rem;
              padding: 0.5rem 1rem;
              cursor: pointer;
              font-size: 0.8rem;
              color: white;
              font-weight: 600;
            "
          >
            Modify
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);
    this.chatInterface = chatContainer;

    // Add enter key support
    document.getElementById('agui-command-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.processCommand();
      }
    });

    console.log('✅ AG-UI Frontend Modifier interface created');
  }

  processCommand() {
    const input = document.getElementById('agui-command-input');
    const command = input.value.trim();
    
    if (!command) return;

    this.addMessage('user', command);
    input.value = '';

    // Process the command and modify the frontend
    this.executeModification(command);
  }

  executeModification(command) {
    const cmd = command.toLowerCase();
    let response = '';

    try {
      // Title modifications
      if (cmd.includes('title') && (cmd.includes('bigger') || cmd.includes('larger'))) {
        document.querySelectorAll('.title-metallic').forEach(el => {
          el.style.fontSize = '4rem';
          el.style.transform = 'scale(1.2)';
        });
        response = 'Made titles bigger and added scaling effect';
      }
      
      // Background modifications
      else if (cmd.includes('background') && cmd.includes('blue')) {
        document.body.style.background = 'linear-gradient(135deg, #001122, #003366)';
        response = 'Changed background to blue gradient';
      }
      else if (cmd.includes('background') && cmd.includes('dark')) {
        document.body.style.background = 'linear-gradient(135deg, #000000, #111111)';
        response = 'Made background darker';
      }
      
      // Button effects
      else if (cmd.includes('button') && cmd.includes('glow')) {
        document.querySelectorAll('button').forEach(el => {
          el.style.boxShadow = '0 0 20px rgba(0, 191, 255, 0.6)';
          el.style.border = '1px solid #00bfff';
        });
        response = 'Added glow effects to all buttons';
      }
      
      // Team cards modifications
      else if (cmd.includes('card') && (cmd.includes('larger') || cmd.includes('bigger'))) {
        document.querySelectorAll('.team-card').forEach(el => {
          el.style.transform = 'scale(1.15)';
          el.style.margin = '1rem';
        });
        response = 'Made team cards larger with more spacing';
      }
      else if (cmd.includes('card') && cmd.includes('red')) {
        document.querySelectorAll('.team-card').forEach(el => {
          el.style.borderColor = '#ff4444';
          el.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.3)';
        });
        response = 'Changed team cards to red theme';
      }
      
      // Futuristic theme
      else if (cmd.includes('futuristic') || cmd.includes('cyberpunk')) {
        // Add neon effects
        document.querySelectorAll('.floating-card').forEach(el => {
          el.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.4)';
          el.style.border = '1px solid #00ffff';
        });
        // Add scan lines effect
        const scanlines = document.createElement('div');
        scanlines.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 2px,
            rgba(0, 255, 255, 0.03) 4px
          );
          pointer-events: none;
          z-index: 1000;
        `;
        document.body.appendChild(scanlines);
        response = 'Applied futuristic cyberpunk theme with neon effects and scan lines';
      }
      
      // Color changes
      else if (cmd.includes('color') && cmd.includes('green')) {
        document.documentElement.style.setProperty('--color-neon-blue', '#00ff88');
        response = 'Changed accent color to green';
      }
      else if (cmd.includes('color') && cmd.includes('purple')) {
        document.documentElement.style.setProperty('--color-neon-blue', '#bb00ff');
        response = 'Changed accent color to purple';
      }
      
      // Animation effects
      else if (cmd.includes('animate') || cmd.includes('animation')) {
        document.querySelectorAll('.team-card').forEach((el, index) => {
          el.style.animation = `pulse 2s ease-in-out infinite ${index * 0.1}s`;
        });
        response = 'Added pulsing animations to team cards';
      }
      
      // Reset/remove effects
      else if (cmd.includes('reset') || cmd.includes('remove')) {
        location.reload();
        response = 'Resetting interface to original state';
      }
      
      // Default response
      else {
        response = `I understand you want to "${command}". Try being more specific, like:
        • "make cards bigger"
        • "change background to blue" 
        • "add glow to buttons"
        • "make it futuristic"`;
      }

    } catch (error) {
      response = `Error applying modification: ${error.message}`;
    }

    this.addMessage('assistant', response);
  }

  addMessage(type, content) {
    const messagesContainer = document.getElementById('agui-messages');
    const message = document.createElement('div');
    message.className = `agui-message ${type}`;
    
    const bgColor = type === 'user' ? 
      'rgba(0, 191, 255, 0.2)' : 
      'rgba(0, 191, 255, 0.1)';
    const borderColor = type === 'user' ? '#00bfff' : '#00bfff';
    
    message.style.cssText = `
      background: ${bgColor};
      border-left: 3px solid ${borderColor};
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-radius: 0.5rem;
      color: white;
      font-size: 0.8rem;
      ${type === 'user' ? 'text-align: right;' : ''}
    `;
    
    message.innerHTML = content;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Initialize the modifier when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.flexTimeModifier = new FlexTimeFrontendModifier();
});

// Add some CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);