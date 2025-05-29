"""
Database Configuration for the HELiiX Intelligence Engine

This module provides configuration settings for database connections across
the application, including environment variable management and connection pooling.
"""

import os
import logging
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger('intelligence_engine.db.config')

class DBConfig:
    """Database configuration manager."""
    
    # Default configuration values
    DEFAULT_CONFIG = {
        'neon_db': {
            'connection_string': None,
            'pool_size': 10,
            'max_overflow': 20,
            'pool_timeout': 30,
            'pool_recycle': 1800  # 30 minutes
        },
        'notion': {
            'api_key': None,
            'version': '2022-06-28'
        }
    }
    
    # Environment variable mappings
    ENV_MAPPINGS = {
        'neon_db': {
            'connection_string': 'NEON_DB_CONNECTION_STRING',
            'pool_size': 'NEON_DB_POOL_SIZE',
            'max_overflow': 'NEON_DB_MAX_OVERFLOW',
            'pool_timeout': 'NEON_DB_POOL_TIMEOUT',
            'pool_recycle': 'NEON_DB_POOL_RECYCLE'
        },
        'notion': {
            'api_key': 'NOTION_API_KEY',
            'version': 'NOTION_API_VERSION'
        }
    }
    
    def __init__(self, config_overrides: Dict[str, Any] = None):
        """Initialize the database configuration.
        
        Args:
            config_overrides: Dictionary of configuration values to override defaults
        """
        self.config = self._load_config(config_overrides or {})
    
    def _load_config(self, overrides: Dict[str, Any]) -> Dict[str, Any]:
        """Load configuration from environment variables and overrides.
        
        Args:
            overrides: Dictionary of configuration values to override defaults
            
        Returns:
            Complete configuration dictionary
        """
        config = {}
        
        # Start with default config
        for section, section_config in self.DEFAULT_CONFIG.items():
            config[section] = section_config.copy()
        
        # Override with environment variables
        for section, env_mappings in self.ENV_MAPPINGS.items():
            for config_key, env_var in env_mappings.items():
                env_value = os.environ.get(env_var)
                if env_value is not None:
                    # Convert numeric values
                    if config_key in ['pool_size', 'max_overflow', 'pool_timeout', 'pool_recycle']:
                        try:
                            env_value = int(env_value)
                        except ValueError:
                            logger.warning(f"Invalid numeric value for {env_var}: {env_value}")
                            continue
                    
                    config[section][config_key] = env_value
        
        # Override with provided configuration
        for section, section_overrides in overrides.items():
            if section in config:
                config[section].update(section_overrides)
        
        # Validate required configuration
        self._validate_config(config)
        
        return config
    
    def _validate_config(self, config: Dict[str, Any]):
        """Validate that required configuration is present.
        
        Args:
            config: Configuration dictionary to validate
        """
        # Check Neon DB connection string
        if config['neon_db']['connection_string'] is None:
            logger.warning("Neon DB connection string is not configured. Set NEON_DB_CONNECTION_STRING environment variable.")
        
        # Check Notion API key
        if config['notion']['api_key'] is None:
            logger.warning("Notion API key is not configured. Set NOTION_API_KEY environment variable.")
    
    def get_neon_db_config(self) -> Dict[str, Any]:
        """Get Neon DB configuration.
        
        Returns:
            Dictionary with Neon DB configuration
        """
        return self.config['neon_db']
    
    def get_notion_config(self) -> Dict[str, Any]:
        """Get Notion API configuration.
        
        Returns:
            Dictionary with Notion API configuration
        """
        return self.config['notion']
    
    def get_neon_db_connection_string(self) -> Optional[str]:
        """Get Neon DB connection string.
        
        Returns:
            Neon DB connection string or None if not configured
        """
        return self.config['neon_db']['connection_string']
    
    def get_notion_api_key(self) -> Optional[str]:
        """Get Notion API key.
        
        Returns:
            Notion API key or None if not configured
        """
        return self.config['notion']['api_key']


# Create a global instance for use across the application
db_config = DBConfig()