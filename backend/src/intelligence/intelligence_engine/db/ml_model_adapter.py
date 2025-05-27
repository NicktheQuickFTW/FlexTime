"""
ML Model Adapter for the HELiiX Intelligence Engine

This module provides persistent storage for machine learning models using Neon DB.
"""

import logging
import json
import pickle
import base64
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from intelligence_engine.db.neon_db_adapter import NeonDBAdapter

# Configure logging
logger = logging.getLogger('intelligence_engine.db.ml_model_adapter')

class MLModelAdapter:
    """Adapter for persisting ML models in Neon DB."""
    
    def __init__(self, db_adapter: NeonDBAdapter):
        """Initialize the ML model adapter.
        
        Args:
            db_adapter: Neon DB adapter instance
        """
        self.db_adapter = db_adapter
        self.table_name = "ml_models"
        
        # Define the table schema
        self.schema = {
            'id': 'VARCHAR(255) NOT NULL',
            'model_name': 'VARCHAR(255) NOT NULL',
            'model_type': 'VARCHAR(255) NOT NULL',
            'version': 'VARCHAR(50) NOT NULL',
            'model_data': 'BYTEA',  # Binary data for the serialized model
            'model_info': 'JSONB NOT NULL',
            'created_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'active': 'BOOLEAN NOT NULL DEFAULT TRUE'
        }
        
        # Ensure the table exists
        self._ensure_table()
    
    def _ensure_table(self) -> bool:
        """Ensure the ML model table exists.
        
        Returns:
            True if successful, False otherwise
        """
        return self.db_adapter.ensure_table(self.table_name, self.schema)
    
    def save_model(self, model_obj: Any, model_info: Dict[str, Any]) -> Optional[str]:
        """Save a model to the database.
        
        Args:
            model_obj: The model object to save
            model_info: Metadata about the model
            
        Returns:
            The ID of the saved model, or None if save failed
        """
        try:
            # Extract key information
            model_name = model_info.get('name', 'unknown')
            model_type = model_info.get('type', 'unknown')
            version = model_info.get('version', '1.0.0')
            
            # Generate a model ID
            model_id = f"{model_name}_{version}"
            
            # Serialize the model
            serialized_model = pickle.dumps(model_obj)
            encoded_model = base64.b64encode(serialized_model).decode('utf-8')
            
            # Prepare the model record
            model_record = {
                'id': model_id,
                'model_name': model_name,
                'model_type': model_type,
                'version': version,
                'model_data': encoded_model,
                'model_info': json.dumps(model_info),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'active': True
            }
            
            # Check if model already exists
            existing_model = self.db_adapter.get(self.table_name, model_id)
            
            if existing_model:
                # Update existing model
                update_data = {
                    'model_data': encoded_model,
                    'model_info': json.dumps(model_info),
                    'updated_at': datetime.now().isoformat(),
                    'active': True
                }
                
                success = self.db_adapter.update(self.table_name, model_id, update_data)
                
                if success:
                    logger.info(f"Updated model {model_id}")
                    return model_id
                else:
                    logger.error(f"Failed to update model {model_id}")
                    return None
            else:
                # Insert new model
                result = self.db_adapter.insert(self.table_name, model_record)
                
                if result:
                    logger.info(f"Saved model {model_id}")
                    return model_id
                else:
                    logger.error(f"Failed to save model {model_id}")
                    return None
        
        except Exception as e:
            logger.exception(f"Error saving model: {str(e)}")
            return None
    
    def load_model(self, model_name: str, version: Optional[str] = None) -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
        """Load a model from the database.
        
        Args:
            model_name: The name of the model
            version: Optional version to load (defaults to latest active version)
            
        Returns:
            Tuple of (model_object, model_info), or (None, None) if load failed
        """
        try:
            if version:
                # Load specific version
                model_id = f"{model_name}_{version}"
                model_record = self.db_adapter.get(self.table_name, model_id)
                
                if not model_record:
                    logger.warn(f"Model {model_id} not found")
                    return None, None
                
                if not model_record.get('active', False):
                    logger.warn(f"Model {model_id} is not active")
                    return None, None
            else:
                # Load latest active version
                query = f"""
                SELECT * FROM {self.table_name}
                WHERE model_name = %s AND active = TRUE
                ORDER BY created_at DESC
                LIMIT 1
                """
                
                result = self.db_adapter.execute_query(query, [model_name])
                
                if not result:
                    logger.warn(f"No active versions of model {model_name} found")
                    return None, None
                
                model_record = result[0]
            
            # Deserialize the model
            encoded_model = model_record.get('model_data')
            if not encoded_model:
                logger.error(f"Model data not found for {model_record.get('id')}")
                return None, None
            
            serialized_model = base64.b64decode(encoded_model)
            model_obj = pickle.loads(serialized_model)
            
            # Parse model info
            model_info = json.loads(model_record.get('model_info', '{}'))
            
            logger.info(f"Loaded model {model_record.get('id')}")
            return model_obj, model_info
            
        except Exception as e:
            logger.exception(f"Error loading model {model_name}: {str(e)}")
            return None, None
    
    def deactivate_model(self, model_name: str, version: str) -> bool:
        """Deactivate a model.
        
        Args:
            model_name: The name of the model
            version: The version to deactivate
            
        Returns:
            True if successful, False otherwise
        """
        try:
            model_id = f"{model_name}_{version}"
            
            # Update the model record
            update_data = {
                'active': False,
                'updated_at': datetime.now().isoformat()
            }
            
            success = self.db_adapter.update(self.table_name, model_id, update_data)
            
            if success:
                logger.info(f"Deactivated model {model_id}")
            else:
                logger.warn(f"Failed to deactivate model {model_id}")
            
            return success
            
        except Exception as e:
            logger.exception(f"Error deactivating model {model_name}_{version}: {str(e)}")
            return False
    
    def delete_model(self, model_name: str, version: str) -> bool:
        """Delete a model.
        
        Args:
            model_name: The name of the model
            version: The version to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            model_id = f"{model_name}_{version}"
            
            # Delete the model record
            success = self.db_adapter.delete(self.table_name, model_id)
            
            if success:
                logger.info(f"Deleted model {model_id}")
            else:
                logger.warn(f"Failed to delete model {model_id}")
            
            return success
            
        except Exception as e:
            logger.exception(f"Error deleting model {model_name}_{version}: {str(e)}")
            return False
    
    def list_models(self, model_name: Optional[str] = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """List available models.
        
        Args:
            model_name: Optional name to filter by
            active_only: Whether to return only active models
            
        Returns:
            List of model records (without the binary data)
        """
        try:
            # Prepare query conditions
            conditions = {}
            
            if model_name:
                conditions['model_name'] = model_name
            
            if active_only:
                conditions['active'] = True
            
            # Query the database
            models = self.db_adapter.query(self.table_name, conditions, order_by='created_at DESC')
            
            # Process and return models (exclude binary data)
            result = []
            
            for model in models:
                # Remove binary data to reduce payload size
                if 'model_data' in model:
                    del model['model_data']
                
                # Parse model info
                model_info = model.get('model_info')
                if model_info:
                    model['model_info'] = json.loads(model_info)
                
                result.append(model)
            
            return result
            
        except Exception as e:
            logger.exception(f"Error listing models: {str(e)}")
            return []
    
    def get_model_info(self, model_name: str, version: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get information about a model.
        
        Args:
            model_name: The name of the model
            version: Optional version to get info for (defaults to latest active version)
            
        Returns:
            Dictionary with model information, or None if not found
        """
        try:
            if version:
                # Get specific version
                model_id = f"{model_name}_{version}"
                model_record = self.db_adapter.get(self.table_name, model_id)
                
                if not model_record:
                    logger.warn(f"Model {model_id} not found")
                    return None
            else:
                # Get latest active version
                query = f"""
                SELECT * FROM {self.table_name}
                WHERE model_name = %s AND active = TRUE
                ORDER BY created_at DESC
                LIMIT 1
                """
                
                result = self.db_adapter.execute_query(query, [model_name])
                
                if not result:
                    logger.warn(f"No active versions of model {model_name} found")
                    return None
                
                model_record = result[0]
            
            # Remove binary data
            if 'model_data' in model_record:
                del model_record['model_data']
            
            # Parse model info
            model_info = model_record.get('model_info')
            if model_info:
                model_record['model_info'] = json.loads(model_info)
            
            return model_record
            
        except Exception as e:
            logger.exception(f"Error getting model info for {model_name}: {str(e)}")
            return None