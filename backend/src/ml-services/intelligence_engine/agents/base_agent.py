"""
Base Agent for HELiiX Intelligence Engine

This module provides the base agent classes for the Intelligence Engine.
"""

import uuid
import logging
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Set, Callable

# Configure logging
logger = logging.getLogger('intelligence_engine.agents.base')

class Agent:
    """Base class for all agents in the Intelligence Engine."""
    
    def __init__(self, agent_id: Optional[str] = None, agent_type: str = 'base', 
                config: Optional[Dict[str, Any]] = None):
        """Initialize a new agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            agent_type: Type of the agent
            config: Configuration options
        """
        self.agent_id = agent_id or f"{agent_type}_{uuid.uuid4().hex[:8]}"
        self.agent_type = agent_type
        self.config = config or {}
        self.created_at = datetime.now()
        self.last_active = self.created_at
        self.status = 'initialized'
        self.memory = {}
        self.capabilities = set()
        self.message_handlers = {}
        self._registry = AgentRegistry()
    
    def initialize(self) -> bool:
        """Initialize the agent.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        try:
            logger.info(f"Initializing agent {self.agent_id} of type {self.agent_type}")
            self.status = 'active'
            self.last_active = datetime.now()
            return True
        except Exception as e:
            logger.exception(f"Error initializing agent {self.agent_id}: {str(e)}")
            self.status = 'error'
            return False
    
    def shutdown(self) -> bool:
        """Shutdown the agent.
        
        Returns:
            True if shutdown was successful, False otherwise
        """
        try:
            logger.info(f"Shutting down agent {self.agent_id}")
            self.status = 'inactive'
            self.last_active = datetime.now()
            return True
        except Exception as e:
            logger.exception(f"Error shutting down agent {self.agent_id}: {str(e)}")
            self.status = 'error'
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get the agent's status.
        
        Returns:
            Dictionary containing the agent's status
        """
        return {
            'agent_id': self.agent_id,
            'agent_type': self.agent_type,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'last_active': self.last_active.isoformat(),
            'capabilities': list(self.capabilities)
        }
    
    def handle_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a message sent to this agent.
        
        Args:
            message: The message to handle
            
        Returns:
            The response message
        """
        self.last_active = datetime.now()
        
        # Validate message
        if 'type' not in message:
            return {
                'success': False,
                'error': 'Invalid message: missing type'
            }
        
        message_type = message['type']
        
        # Check if there's a handler for this message type
        if message_type in self.message_handlers:
            try:
                return self.message_handlers[message_type](message)
            except Exception as e:
                logger.exception(f"Error handling message of type {message_type}: {str(e)}")
                return {
                    'success': False,
                    'error': f"Error handling message: {str(e)}"
                }
        else:
            return {
                'success': False,
                'error': f"Unsupported message type: {message_type}"
            }
    
    def register_capability(self, capability: str):
        """Register a capability with this agent.
        
        Args:
            capability: The capability to register
        """
        self.capabilities.add(capability)
    
    def register_message_handler(self, message_type: str, handler: Callable[[Dict[str, Any]], Dict[str, Any]]):
        """Register a message handler.
        
        Args:
            message_type: The type of message to handle
            handler: The handler function
        """
        self.message_handlers[message_type] = handler
    
    def send_message(self, recipient_id: str, message_type: str, content: Dict[str, Any]) -> Dict[str, Any]:
        """Send a message to another agent.
        
        Args:
            recipient_id: ID of the recipient agent
            message_type: Type of the message
            content: Message content
            
        Returns:
            The response message
        """
        # Get the recipient agent
        recipient = self._registry.get_agent(recipient_id)
        
        if not recipient:
            return {
                'success': False,
                'error': f"Recipient agent not found: {recipient_id}"
            }
        
        # Construct the message
        message = {
            'type': message_type,
            'sender_id': self.agent_id,
            'recipient_id': recipient_id,
            'timestamp': datetime.now().isoformat(),
            'content': content
        }
        
        # Send the message
        return recipient.handle_message(message)
    
    def store_memory(self, key: str, value: Any):
        """Store a value in the agent's memory.
        
        Args:
            key: Memory key
            value: Memory value
        """
        self.memory[key] = value
    
    def retrieve_memory(self, key: str) -> Any:
        """Retrieve a value from the agent's memory.
        
        Args:
            key: Memory key
            
        Returns:
            Memory value or None if not found
        """
        return self.memory.get(key)
    
    def clear_memory(self, key: Optional[str] = None):
        """Clear the agent's memory.
        
        Args:
            key: Memory key to clear (if None, clears all memory)
        """
        if key:
            if key in self.memory:
                del self.memory[key]
        else:
            self.memory.clear()


class AgentRegistry:
    """Registry for managing agents."""
    
    _instance = None
    
    def __new__(cls):
        """Create a singleton instance."""
        if cls._instance is None:
            cls._instance = super(AgentRegistry, cls).__new__(cls)
            cls._instance.agents = {}
        return cls._instance
    
    def register_agent(self, agent: Agent):
        """Register an agent.
        
        Args:
            agent: The agent to register
        """
        self.agents[agent.agent_id] = agent
        logger.info(f"Registered agent {agent.agent_id} of type {agent.agent_type}")
    
    def unregister_agent(self, agent_id: str):
        """Unregister an agent.
        
        Args:
            agent_id: ID of the agent to unregister
        """
        if agent_id in self.agents:
            del self.agents[agent_id]
            logger.info(f"Unregistered agent {agent_id}")
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get an agent by ID.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            The agent or None if not found
        """
        return self.agents.get(agent_id)
    
    def get_agents_by_type(self, agent_type: str) -> List[Agent]:
        """Get agents by type.
        
        Args:
            agent_type: Type of agents to get
            
        Returns:
            List of agents of the specified type
        """
        return [agent for agent in self.agents.values() if agent.agent_type == agent_type]
    
    def get_agents_by_capability(self, capability: str) -> List[Agent]:
        """Get agents by capability.
        
        Args:
            capability: Capability to search for
            
        Returns:
            List of agents with the specified capability
        """
        return [agent for agent in self.agents.values() if capability in agent.capabilities]


# Create a global registry instance
agent_registry = AgentRegistry()