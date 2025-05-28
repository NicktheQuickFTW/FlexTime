"""
Agent Memory Adapter for the HELiiX Intelligence Engine

This module provides a persistent memory adapter for agents using Neon DB.
"""

import logging
import json
from typing import Dict, Any, List, Optional, Set
from datetime import datetime

from intelligence_engine.db.neon_db_adapter import NeonDBAdapter

# Configure logging
logger = logging.getLogger('intelligence_engine.db.agent_memory_adapter')

class AgentMemoryAdapter:
    """Adapter for persisting agent memory in Neon DB."""
    
    def __init__(self, db_adapter: NeonDBAdapter):
        """Initialize the agent memory adapter.
        
        Args:
            db_adapter: Neon DB adapter instance
        """
        self.db_adapter = db_adapter
        self.table_name = "agent_memory"
        
        # Define the table schema
        self.schema = {
            'id': 'VARCHAR(255) NOT NULL',
            'agent_id': 'VARCHAR(255) NOT NULL',
            'memory_type': 'VARCHAR(255) NOT NULL',
            'memory_key': 'VARCHAR(255) NOT NULL',
            'data': 'JSONB NOT NULL',
            'created_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'expires_at': 'TIMESTAMP NULL'
        }
        
        # Ensure the table exists
        self._ensure_table()
    
    def _ensure_table(self) -> bool:
        """Ensure the agent memory table exists.
        
        Returns:
            True if successful, False otherwise
        """
        return self.db_adapter.ensure_table(self.table_name, self.schema)
    
    def store_memory(self, agent_id: str, memory_type: str, memory_key: str, 
                   data: Any, expires_at: Optional[datetime] = None) -> Optional[str]:
        """Store an agent memory.
        
        Args:
            agent_id: The ID of the agent
            memory_type: Type of memory (e.g., 'experience', 'knowledge')
            memory_key: Key to identify the memory
            data: Memory data to store
            expires_at: Optional expiration time for the memory
            
        Returns:
            The ID of the stored memory, or None if storage failed
        """
        try:
            # Generate a unique memory ID
            memory_id = f"{agent_id}_{memory_type}_{memory_key}"
            
            # Prepare the memory record
            memory_record = {
                'id': memory_id,
                'agent_id': agent_id,
                'memory_type': memory_type,
                'memory_key': memory_key,
                'data': json.dumps(data),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            if expires_at:
                memory_record['expires_at'] = expires_at.isoformat()
            
            # Check if memory already exists
            existing_memory = self.db_adapter.get(self.table_name, memory_id)
            
            if existing_memory:
                # Update existing memory
                update_data = {
                    'data': json.dumps(data),
                    'updated_at': datetime.now().isoformat()
                }
                
                if expires_at:
                    update_data['expires_at'] = expires_at.isoformat()
                
                success = self.db_adapter.update(self.table_name, memory_id, update_data)
                
                if success:
                    logger.info(f"Updated memory {memory_id} for agent {agent_id}")
                    return memory_id
                else:
                    logger.error(f"Failed to update memory {memory_id} for agent {agent_id}")
                    return None
            else:
                # Insert new memory
                result = self.db_adapter.insert(self.table_name, memory_record)
                
                if result:
                    logger.info(f"Stored memory {memory_id} for agent {agent_id}")
                    return memory_id
                else:
                    logger.error(f"Failed to store memory {memory_id} for agent {agent_id}")
                    return None
        
        except Exception as e:
            logger.exception(f"Error storing memory for agent {agent_id}: {str(e)}")
            return None
    
    def retrieve_memory(self, agent_id: str, memory_type: str, memory_key: str) -> Optional[Any]:
        """Retrieve an agent memory.
        
        Args:
            agent_id: The ID of the agent
            memory_type: Type of memory
            memory_key: Key to identify the memory
            
        Returns:
            The memory data, or None if not found or expired
        """
        try:
            # Generate the memory ID
            memory_id = f"{agent_id}_{memory_type}_{memory_key}"
            
            # Retrieve the memory record
            memory_record = self.db_adapter.get(self.table_name, memory_id)
            
            if not memory_record:
                logger.info(f"Memory {memory_id} not found for agent {agent_id}")
                return None
            
            # Check if memory has expired
            expires_at = memory_record.get('expires_at')
            if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
                logger.info(f"Memory {memory_id} has expired for agent {agent_id}")
                # Delete expired memory
                self.db_adapter.delete(self.table_name, memory_id)
                return None
            
            # Parse and return memory data
            data = memory_record.get('data')
            if data:
                return json.loads(data)
            
            return None
            
        except Exception as e:
            logger.exception(f"Error retrieving memory for agent {agent_id}: {str(e)}")
            return None
    
    def delete_memory(self, agent_id: str, memory_type: str, memory_key: str) -> bool:
        """Delete an agent memory.
        
        Args:
            agent_id: The ID of the agent
            memory_type: Type of memory
            memory_key: Key to identify the memory
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Generate the memory ID
            memory_id = f"{agent_id}_{memory_type}_{memory_key}"
            
            # Delete the memory record
            success = self.db_adapter.delete(self.table_name, memory_id)
            
            if success:
                logger.info(f"Deleted memory {memory_id} for agent {agent_id}")
            else:
                logger.warn(f"Failed to delete memory {memory_id} for agent {agent_id}")
            
            return success
            
        except Exception as e:
            logger.exception(f"Error deleting memory for agent {agent_id}: {str(e)}")
            return False
    
    def list_memories(self, agent_id: str, memory_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """List memories for an agent.
        
        Args:
            agent_id: The ID of the agent
            memory_type: Optional type of memory to filter by
            
        Returns:
            List of memory records
        """
        try:
            # Prepare query conditions
            conditions = {
                'agent_id': agent_id
            }
            
            if memory_type:
                conditions['memory_type'] = memory_type
            
            # Query the database
            memories = self.db_adapter.query(self.table_name, conditions)
            
            # Process and return memories
            result = []
            now = datetime.now()
            
            for memory in memories:
                # Check if memory has expired
                expires_at = memory.get('expires_at')
                if expires_at and datetime.fromisoformat(expires_at) < now:
                    # Skip expired memories
                    continue
                
                # Parse memory data
                data = memory.get('data')
                if data:
                    memory['data'] = json.loads(data)
                
                result.append(memory)
            
            return result
            
        except Exception as e:
            logger.exception(f"Error listing memories for agent {agent_id}: {str(e)}")
            return []
    
    def clear_agent_memories(self, agent_id: str) -> bool:
        """Clear all memories for an agent.
        
        Args:
            agent_id: The ID of the agent
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Execute a delete query
            query = f"DELETE FROM {self.table_name} WHERE agent_id = %s"
            
            result = self.db_adapter.execute_query(query, [agent_id])
            
            if result and result[0].get('rowcount', 0) >= 0:
                logger.info(f"Cleared {result[0].get('rowcount', 0)} memories for agent {agent_id}")
                return True
            else:
                logger.warn(f"Failed to clear memories for agent {agent_id}")
                return False
            
        except Exception as e:
            logger.exception(f"Error clearing memories for agent {agent_id}: {str(e)}")
            return False
    
    def clear_expired_memories(self) -> int:
        """Clear all expired memories.
        
        Returns:
            Number of memories cleared
        """
        try:
            # Execute a delete query
            query = f"DELETE FROM {self.table_name} WHERE expires_at IS NOT NULL AND expires_at < NOW()"
            
            result = self.db_adapter.execute_query(query)
            
            if result:
                count = result[0].get('rowcount', 0)
                logger.info(f"Cleared {count} expired memories")
                return count
            else:
                logger.warn("Failed to clear expired memories")
                return 0
            
        except Exception as e:
            logger.exception(f"Error clearing expired memories: {str(e)}")
            return 0