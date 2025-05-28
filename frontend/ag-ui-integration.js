// AG-UI Integration for FlexTime Real-Time Frontend Modifications
// Browser-compatible version

class FlexTimeAGUIManager {
  constructor() {
    this.frontendAgent = new FlexTimeFrontendAgent();
    this.isInitialized = false;
    this.eventListeners = new Map();
    this.commandHistory = [];
    this.setupEventListeners();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.frontendAgent.initialize();
      this.setupChatInterface();
      this.setupToolbar();
      this.isInitialized = true;
      
      console.log('✨ AG-UI FlexTime integration ready');
      this.showWelcomeMessage();
      
    } catch (error) {
      console.error('Failed to initialize AG-UI integration:', error);
    }
  }

  setupEventListeners() {
    // Listen for AG-UI events and update UI accordingly
    const eventTypes = [
      'theme_changed',
      'animations_toggled', 
      'layout_modified',
      'colors_updated',
      'glow_effects_adjusted',
      'typography_changed',
      'component_added',
      'components_updated'
    ];

    eventTypes.forEach(eventType => {
      window.addEventListener(`flextime-${eventType}`, (event) => {
        this.handleUIUpdate(eventType, event.detail);
      });
    });
  }

  setupChatInterface() {
    // Create floating chat interface for frontend adjustments
    console.log('🎨 Setting up AG-UI chat interface...');
    
    const chatInterface = document.createElement('div');
    chatInterface.className = 'ag-ui-chat-interface';
    chatInterface.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 9999 !important;
      width: 350px !important;
      background: rgba(255, 255, 255, 0.05) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 1rem !important;
      font-family: 'Inter', sans-serif !important;
    `;
    
    chatInterface.innerHTML = `
      <div class="chat-header" style="
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div class="chat-title" style="
          font-weight: 600;
          color: white;
          font-size: 0.9rem;
        ">FlexTime Frontend Assistant</div>
        <button class="chat-toggle" onclick="window.flexTimeAGUI.toggleChat()" style="
          background: linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8);
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          border-radius: 0.5rem;
          padding: 0.5rem;
          transition: transform 0.2s ease;
        ">💬</button>
      </div>
      <div class="chat-body" style="display: none;">
        <div class="chat-messages" id="ag-ui-messages" style="
          padding: 1rem;
          max-height: 300px;
          overflow-y: auto;
        "></div>
        <div class="chat-input-container" style="
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 0.5rem;
        ">
          <input 
            type="text" 
            id="ag-ui-input" 
            placeholder="Ask me to modify the interface..."
            onkeypress="if(event.key==='Enter') window.flexTimeAGUI.processCommand(this.value)"
            style="
              flex: 1;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 0.375rem;
              padding: 0.5rem;
              color: white;
              font-size: 0.85rem;
            "
          />
          <button onclick="window.flexTimeAGUI.processCommand(document.getElementById('ag-ui-input').value)" style="
            background: linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8);
            border: none;
            border-radius: 0.375rem;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-size: 0.85rem;
            color: black;
            font-weight: 600;
          ">
            Send
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(chatInterface);
    console.log('✅ AG-UI chat interface added to DOM');
    
    // Add a visible indicator that it loaded
    setTimeout(() => {
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #00bfff;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        z-index: 10000;
        animation: fadeOut 3s ease-in-out;
      `;
      indicator.textContent = '💬 AG-UI Chat Ready!';
      document.body.appendChild(indicator);
      
      setTimeout(() => indicator.remove(), 3000);
    }, 500);
    
    this.addChatStyles();
  }

  setupToolbar() {
    // Create quick action toolbar
    console.log('🛠️ Setting up AG-UI toolbar...');
    
    const toolbar = document.createElement('div');
    toolbar.className = 'ag-ui-toolbar';
    toolbar.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      left: 20px !important;
      background: rgba(255, 255, 255, 0.05) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 1rem !important;
      padding: 1rem !important;
      z-index: 9999 !important;
      font-family: 'Inter', sans-serif !important;
    `;
    
    toolbar.innerHTML = `
      <div class="toolbar-title" style="
        font-weight: 600;
        color: white;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      ">Quick Adjustments</div>
      <div class="toolbar-actions" style="
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      ">
        <button onclick="window.flexTimeAGUI.quickCommand('toggle-animations')" style="
          background: linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8);
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          color: black;
          transition: transform 0.2s ease;
        ">🎬 Animations</button>
        <button onclick="window.flexTimeAGUI.quickCommand('change-theme')" style="
          background: linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8);
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          color: black;
          transition: transform 0.2s ease;
        ">🎨 Theme</button>
        <button onclick="window.flexTimeAGUI.quickCommand('adjust-glow')" style="
          background: linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8);
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          color: black;
          transition: transform 0.2s ease;
        ">✨ Glow</button>
        <button onclick="window.flexTimeAGUI.quickCommand('modify-layout')" style="
          background: linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8);
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          color: black;
          transition: transform 0.2s ease;
        ">📱 Layout</button>
      </div>
    `;
    
    document.body.appendChild(toolbar);
    console.log('✅ AG-UI toolbar added to DOM');
    this.addToolbarStyles();
  }

  async processCommand(command) {
    if (!command.trim()) return;
    
    this.addMessage('user', command);
    this.addMessage('system', 'Processing...');
    
    try {
      const result = await this.parseAndExecuteCommand(command);
      this.addMessage('agent', result);
      this.commandHistory.push({ command, result, timestamp: new Date() });
      
    } catch (error) {
      this.addMessage('error', `Error: ${error.message}`);
    }
    
    document.getElementById('ag-ui-input').value = '';
  }

  async parseAndExecuteCommand(command) {
    const cmd = command.toLowerCase();
    
    // Natural language parsing for frontend modifications
    if (cmd.includes('change') && cmd.includes('theme')) {
      const theme = this.extractTheme(cmd);
      return await this.frontendAgent.changeTheme({ theme });
    }
    
    if (cmd.includes('toggle') && cmd.includes('animation')) {
      const enable = !cmd.includes('off') && !cmd.includes('disable');
      return await this.frontendAgent.toggleAnimations({ enable });
    }
    
    if (cmd.includes('adjust') && cmd.includes('glow')) {
      const intensity = this.extractNumber(cmd) || 0.8;
      return await this.frontendAgent.adjustGlowEffects({ intensity });
    }
    
    if (cmd.includes('change') && cmd.includes('color')) {
      const color = this.extractColor(cmd);
      return await this.frontendAgent.updateColors({ accent: color });
    }
    
    if (cmd.includes('add') && cmd.includes('component')) {
      const type = this.extractComponentType(cmd);
      return await this.frontendAgent.addComponent({ type, position: '.main-content' });
    }
    
    if (cmd.includes('layout')) {
      const layout = this.extractLayout(cmd);
      return await this.frontendAgent.modifyLayout({ layout });
    }
    
    if (cmd.includes('font')) {
      const fontFamily = this.extractFont(cmd);
      return await this.frontendAgent.changeTypography({ fontFamily });
    }
    
    // Advanced commands
    if (cmd.includes('make it') || cmd.includes('set')) {
      return await this.handleDescriptiveCommand(cmd);
    }
    
    return "I can help you modify the interface! Try commands like:\n" +
           "• 'Change theme to dark'\n" +
           "• 'Toggle animations'\n" +
           "• 'Adjust glow intensity to 0.8'\n" +
           "• 'Change accent color to blue'\n" +
           "• 'Add a stat card'\n" +
           "• 'Change layout to grid'";
  }

  async handleDescriptiveCommand(cmd) {
    // Handle more complex descriptive commands
    if (cmd.includes('more futuristic')) {
      await this.frontendAgent.changeTheme({ theme: 'dark', accentColor: '#00ffff' });
      await this.frontendAgent.changeTypography({ fontFamily: 'futuristic' });
      await this.frontendAgent.adjustGlowEffects({ intensity: 1.0, color: '#00ffff' });
      return 'Interface made more futuristic with cyan accents and enhanced glow effects';
    }
    
    if (cmd.includes('more elegant')) {
      await this.frontendAgent.changeTheme({ theme: 'light', accentColor: '#gold' });
      await this.frontendAgent.changeTypography({ fontFamily: 'elegant' });
      await this.frontendAgent.adjustGlowEffects({ intensity: 0.3 });
      return 'Interface made more elegant with refined typography and subtle effects';
    }
    
    if (cmd.includes('big 12 branding')) {
      await this.frontendAgent.updateColors({ 
        primary: '#000000', 
        secondary: '#ffffff', 
        accent: '#c0c0c0' 
      });
      return 'Applied Big 12 official branding colors';
    }
    
    return 'Please be more specific about what you\'d like to adjust';
  }

  async quickCommand(type) {
    switch (type) {
      case 'toggle-animations':
        const currentState = this.frontendAgent.uiState.animations;
        await this.frontendAgent.toggleAnimations({ enable: !currentState });
        this.addMessage('system', `Animations ${!currentState ? 'enabled' : 'disabled'}`);
        break;
        
      case 'change-theme':
        const themes = ['dark', 'light', 'metallic'];
        const currentTheme = this.frontendAgent.uiState.theme;
        const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
        await this.frontendAgent.changeTheme({ theme: themes[nextIndex] });
        this.addMessage('system', `Theme changed to ${themes[nextIndex]}`);
        break;
        
      case 'adjust-glow':
        const intensity = Math.random() * 0.5 + 0.5; // Random between 0.5-1.0
        await this.frontendAgent.adjustGlowEffects({ intensity });
        this.addMessage('system', `Glow intensity adjusted to ${intensity.toFixed(2)}`);
        break;
        
      case 'modify-layout':
        const layouts = ['grid', 'flex', 'masonry'];
        const currentLayout = this.frontendAgent.uiState.layout;
        const nextLayoutIndex = (layouts.indexOf(currentLayout) + 1) % layouts.length;
        await this.frontendAgent.modifyLayout({ layout: layouts[nextLayoutIndex] });
        this.addMessage('system', `Layout changed to ${layouts[nextLayoutIndex]}`);
        break;
    }
  }

  // Helper methods for parsing natural language
  extractTheme(cmd) {
    if (cmd.includes('dark')) return 'dark';
    if (cmd.includes('light')) return 'light';
    if (cmd.includes('metallic')) return 'metallic';
    return 'dark';
  }

  extractColor(cmd) {
    const colors = {
      'blue': '#00bfff',
      'red': '#ff0000',
      'green': '#00ff00',
      'purple': '#8a2be2',
      'orange': '#ffa500',
      'cyan': '#00ffff',
      'gold': '#ffd700',
      'silver': '#c0c0c0'
    };
    
    for (const [name, value] of Object.entries(colors)) {
      if (cmd.includes(name)) return value;
    }
    return '#00bfff';
  }

  extractNumber(cmd) {
    const match = cmd.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  }

  extractComponentType(cmd) {
    if (cmd.includes('stat')) return 'stat-card';
    if (cmd.includes('team')) return 'team-card';
    if (cmd.includes('schedule')) return 'schedule-matrix';
    if (cmd.includes('agent')) return 'agent-status';
    return 'stat-card';
  }

  extractLayout(cmd) {
    if (cmd.includes('grid')) return 'grid';
    if (cmd.includes('flex')) return 'flex';
    if (cmd.includes('masonry')) return 'masonry';
    return 'grid';
  }

  extractFont(cmd) {
    if (cmd.includes('futuristic')) return 'futuristic';
    if (cmd.includes('modern')) return 'modern';
    if (cmd.includes('elegant')) return 'elegant';
    if (cmd.includes('clean')) return 'clean';
    return 'modern';
  }

  // UI Helper Methods
  toggleChat() {
    const chatBody = document.querySelector('.chat-body');
    const isVisible = chatBody.style.display !== 'none';
    chatBody.style.display = isVisible ? 'none' : 'block';
  }

  addMessage(type, content) {
    const messagesContainer = document.getElementById('ag-ui-messages');
    const message = document.createElement('div');
    message.className = `chat-message ${type}`;
    message.innerHTML = `
      <div class="message-content">${content}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showWelcomeMessage() {
    this.addMessage('agent', 
      '👋 Hi! I can help you adjust the FlexTime interface in real-time. ' +
      'Try saying things like "change theme to dark" or "make it more futuristic"!'
    );
  }

  handleUIUpdate(eventType, data) {
    // Animate UI changes for visual feedback
    const toast = document.createElement('div');
    toast.className = 'ag-ui-toast';
    toast.textContent = `${eventType.replace(/_/g, ' ')} updated`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  addChatStyles() {
    const styles = `
      <style>
        .ag-ui-chat-interface {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 350px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          z-index: 1000;
          font-family: var(--font-family-body);
        }
        
        .chat-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .chat-title {
          font-weight: var(--font-weight-semibold);
          color: var(--color-white);
          font-size: 0.9rem;
        }
        
        .chat-toggle {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        
        .chat-toggle:hover {
          opacity: 1;
        }
        
        .chat-body {
          max-height: 400px;
          display: flex;
          flex-direction: column;
        }
        
        .chat-messages {
          flex: 1;
          padding: var(--spacing-md);
          max-height: 300px;
          overflow-y: auto;
        }
        
        .chat-message {
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
        }
        
        .chat-message.user {
          background: rgba(0, 191, 255, 0.1);
          text-align: right;
        }
        
        .chat-message.agent {
          background: rgba(192, 192, 192, 0.1);
        }
        
        .chat-message.system {
          background: rgba(255, 165, 0, 0.1);
          font-style: italic;
        }
        
        .chat-message.error {
          background: rgba(255, 0, 0, 0.1);
          color: #ff6b6b;
        }
        
        .message-time {
          font-size: 0.7rem;
          opacity: 0.6;
          margin-top: var(--spacing-xs);
        }
        
        .chat-input-container {
          padding: var(--spacing-md);
          border-top: 1px solid var(--glass-border);
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .chat-input-container input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm);
          color: var(--color-white);
          font-size: 0.85rem;
        }
        
        .chat-input-container button {
          background: var(--color-silver-metallic);
          border: none;
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--color-black);
        }
      </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  addToolbarStyles() {
    const styles = `
      <style>
        .ag-ui-toolbar {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--spacing-md);
          z-index: 1000;
          font-family: var(--font-family-body);
        }
        
        .toolbar-title {
          font-weight: var(--font-weight-semibold);
          color: var(--color-white);
          margin-bottom: var(--spacing-sm);
          font-size: 0.9rem;
        }
        
        .toolbar-actions {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .toolbar-actions button {
          background: var(--color-silver-metallic);
          border: none;
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm);
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--color-black);
          transition: transform 0.2s ease;
        }
        
        .toolbar-actions button:hover {
          transform: translateY(-2px);
        }
        
        .ag-ui-toast {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--color-silver-metallic);
          color: var(--color-black);
          padding: var(--spacing-md) var(--spacing-xl);
          border-radius: var(--radius-lg);
          font-weight: var(--font-weight-semibold);
          z-index: 2000;
          animation: toastFadeIn 0.3s ease;
        }
        
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialize and expose globally
const flexTimeAGUI = new FlexTimeAGUIManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => flexTimeAGUI.initialize());
} else {
  flexTimeAGUI.initialize();
}

// Export for external use
if (typeof window !== 'undefined') {
  window.flexTimeAGUI = flexTimeAGUI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = flexTimeAGUI;
}