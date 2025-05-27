// OpenAI-powered AG-UI Frontend Builder Routes
const express = require('express');
const router = express.Router();

// CORS preflight handler
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// OpenAI Integration
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Frontend modification endpoint with ChatGPT
router.post('/modify-frontend', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    console.log('🎨 AG-UI Frontend modification request:', command);

    // Create a specialized prompt for frontend modifications
    const systemPrompt = `You are an expert frontend developer specializing in real-time UI modifications. Your job is to interpret natural language commands and generate JavaScript code that modifies the FlexTime web interface.

The FlexTime interface has these key elements:
- .title-metallic (main titles with metallic effects)
- .team-card (team cards in a grid)
- .floating-card (stat cards)
- .hero-section (main hero area)
- .btn-primary, .btn-secondary (buttons)
- CSS custom properties: --color-neon-blue, --color-silver-metallic
- Body background can be modified
- Team cards have logos and text

For each command, respond with a JSON object containing:
{
  "explanation": "Brief explanation of what you're doing",
  "code": "ONLY pure JavaScript code that can be executed directly",
  "success": true
}

IMPORTANT: The "code" field must contain ONLY executable JavaScript code without any markdown formatting, explanations, or JSON. Use document.querySelector, document.querySelectorAll, and direct style modifications.

Example response:
{
  "explanation": "Making titles larger and adding glow effect",
  "code": "document.querySelectorAll('.title-metallic').forEach(el => { el.style.fontSize = '4rem'; el.style.textShadow = '0 0 20px #00bfff'; });",
  "success": true
}

Examples:
- "make title bigger" → increase font size and add scaling
- "change background to blue" → modify body background gradient
- "add glow to buttons" → add box-shadow and border effects
- "make it futuristic" → add neon effects, scan lines, cyberpunk styling

Be creative but ensure the code is safe and will execute properly in a browser.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Command: "${command}"` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      // If not valid JSON, wrap the response
      result = {
        explanation: "Generated CSS/JS modifications",
        code: response,
        success: true
      };
    }

    console.log('✅ OpenAI AG-UI response generated');
    res.json(result);

  } catch (error) {
    console.error('❌ OpenAI AG-UI error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to process frontend modification',
      details: error.message,
      errorType: error.type || 'unknown',
      success: false
    });
  }
});

// Chat endpoint for general frontend development questions
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const systemPrompt = `You are a frontend development assistant for the FlexTime application - an AI-powered sports scheduling platform for the Big 12 Conference. 

You help with:
- UI/UX design decisions
- CSS and JavaScript modifications  
- React component development
- Design system improvements
- User experience optimization

The current interface features:
- Monochrome design with metallic accents
- Big 12 Conference branding
- Glassmorphic design elements
- Neon blue accent colors
- Modern typography (Orbitron, Rajdhani, Exo 2)

Provide helpful, specific advice for frontend development.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800
    });

    const response = completion.choices[0].message.content;
    
    res.json({
      response: response,
      success: true
    });

  } catch (error) {
    console.error('❌ OpenAI chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message,
      success: false
    });
  }
});

module.exports = router;