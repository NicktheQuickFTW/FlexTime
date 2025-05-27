// AG-UI Protocol Routes for FlexTime
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// AG-UI Event Types
const EventType = {
  RUN_STARTED: 'run_started',
  RUN_FINISHED: 'run_finished',
  TEXT_MESSAGE_START: 'text_message_start',
  TEXT_MESSAGE_CONTENT: 'text_message_content',
  TEXT_MESSAGE_END: 'text_message_end'
};

// Event encoder for SSE
class EventEncoder {
  encode(event) {
    return `data: ${JSON.stringify(event)}\n\n`;
  }
}

// AG-UI Agent Working Protocol endpoint
router.post('/awp', async (req, res) => {
  try {
    console.log('AG-UI AWP endpoint called:', req.body);
    
    // Parse AG-UI input
    const { threadId, runId, messages = [] } = req.body;
    
    if (!threadId) {
      return res.status(422).json({ error: 'threadId is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    const encoder = new EventEncoder();
    const currentRunId = runId || uuidv4();

    // Send run started event
    res.write(encoder.encode({
      type: EventType.RUN_STARTED,
      threadId,
      runId: currentRunId
    }));

    // Generate a message ID for the assistant's response
    const messageId = uuidv4();

    // Send text message start event
    res.write(encoder.encode({
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: 'assistant'
    }));

    // Get the last user message
    const userMessages = messages.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    const userText = lastUserMessage?.content || 'Hello';

    // FlexTime assistant response based on user input
    let response = '';
    if (userText.toLowerCase().includes('schedule')) {
      response = "I can help you with scheduling! FlexTime uses AI-powered optimization to create the best schedules for Big 12 Conference athletics. What specific scheduling task would you like assistance with?";
    } else if (userText.toLowerCase().includes('team')) {
      response = "FlexTime manages scheduling for all 16 Big 12 Conference teams across multiple sports. Which teams or sports are you interested in?";
    } else if (userText.toLowerCase().includes('optimization')) {
      response = "FlexTime's optimization engine considers travel costs, competitive balance, venue availability, and championship date constraints to create optimal schedules. How can I help optimize your scheduling needs?";
    } else if (userText.toLowerCase().includes('constraint')) {
      response = "FlexTime handles complex constraints including championship dates, venue availability, travel optimization, and sport-specific requirements. What constraints are you working with?";
    } else {
      response = `Hello! I'm the FlexTime AI assistant. I can help you with intelligent sports scheduling for the Big 12 Conference. I understand you said: "${userText}". How can I assist you with scheduling today?`;
    }

    // Stream the response character by character for a typing effect
    for (let i = 0; i < response.length; i++) {
      res.write(encoder.encode({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: response[i]
      }));
      
      // Small delay for typing effect
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Send text message end event
    res.write(encoder.encode({
      type: EventType.TEXT_MESSAGE_END,
      messageId
    }));

    // Send run finished event
    res.write(encoder.encode({
      type: EventType.RUN_FINISHED,
      threadId,
      runId: currentRunId
    }));

    // End the response
    res.end();

  } catch (error) {
    console.error('AG-UI AWP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for AG-UI
router.get('/health', (req, res) => {
  res.json({ 
    message: 'FlexTime AG-UI endpoint healthy',
    protocol: 'AG-UI',
    version: '1.0.0'
  });
});

module.exports = router;