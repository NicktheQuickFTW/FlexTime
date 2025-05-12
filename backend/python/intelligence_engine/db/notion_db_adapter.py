"""
Notion Database Adapter for the HELiiX Intelligence Engine

This module provides integration with Notion databases through the Notion API,
allowing read and write operations to Notion databases.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

# Configure logging
logger = logging.getLogger('intelligence_engine.db.notion_db_adapter')

class NotionDBAdapter:
    """Adapter for interacting with Notion databases."""
    
    # Notion API base URL
    API_BASE_URL = "https://api.notion.com/v1"
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Notion DB adapter.
        
        Args:
            api_key: Notion API key (integration token)
                If not provided, it will be read from the environment variable NOTION_API_KEY
        """
        self.api_key = api_key or os.environ.get('NOTION_API_KEY')
        
        if not self.api_key:
            raise ValueError("Notion API key is required. Provide it as a parameter or set the NOTION_API_KEY environment variable.")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"  # Use the latest Notion API version
        }
    
    def test_connection(self) -> bool:
        """Test the connection to the Notion API.
        
        Returns:
            True if the connection is successful, False otherwise
        """
        try:
            # Try to list a small number of users to test the connection
            response = requests.get(
                f"{self.API_BASE_URL}/users",
                headers=self.headers,
                params={"page_size": 1}
            )
            
            if response.status_code == 200:
                logger.info("Successfully connected to Notion API")
                return True
            else:
                logger.error(f"Failed to connect to Notion API: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.exception(f"Error connecting to Notion API: {str(e)}")
            return False
    
    def get_database(self, database_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a Notion database.
        
        Args:
            database_id: The ID of the Notion database
            
        Returns:
            Dictionary with database information, or None if retrieval failed
        """
        try:
            response = requests.get(
                f"{self.API_BASE_URL}/databases/{database_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get database {database_id}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.exception(f"Error getting database {database_id}: {str(e)}")
            return None
    
    def query_database(self, database_id: str, filter_obj: Optional[Dict[str, Any]] = None, 
                      sorts: Optional[List[Dict[str, Any]]] = None, 
                      page_size: int = 100) -> List[Dict[str, Any]]:
        """Query a Notion database.
        
        Args:
            database_id: The ID of the Notion database
            filter_obj: Filter object according to Notion API
            sorts: Sort specifications according to Notion API
            page_size: Number of results per page
            
        Returns:
            List of page objects matching the query
        """
        try:
            payload = {
                "page_size": page_size
            }
            
            if filter_obj:
                payload["filter"] = filter_obj
                
            if sorts:
                payload["sorts"] = sorts
            
            all_results = []
            has_more = True
            start_cursor = None
            
            # Handle pagination
            while has_more:
                if start_cursor:
                    payload["start_cursor"] = start_cursor
                
                response = requests.post(
                    f"{self.API_BASE_URL}/databases/{database_id}/query",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to query database {database_id}: {response.status_code} - {response.text}")
                    break
                
                response_data = response.json()
                all_results.extend(response_data.get("results", []))
                
                # Check if there are more results
                has_more = response_data.get("has_more", False)
                start_cursor = response_data.get("next_cursor", None)
            
            return all_results
            
        except Exception as e:
            logger.exception(f"Error querying database {database_id}: {str(e)}")
            return []
    
    def get_page(self, page_id: str) -> Optional[Dict[str, Any]]:
        """Get a Notion page.
        
        Args:
            page_id: The ID of the Notion page
            
        Returns:
            Dictionary with page information, or None if retrieval failed
        """
        try:
            response = requests.get(
                f"{self.API_BASE_URL}/pages/{page_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get page {page_id}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.exception(f"Error getting page {page_id}: {str(e)}")
            return None
    
    def get_block_children(self, block_id: str) -> List[Dict[str, Any]]:
        """Get the children of a block.
        
        Args:
            block_id: The ID of the block
            
        Returns:
            List of child blocks
        """
        try:
            all_blocks = []
            has_more = True
            start_cursor = None
            
            # Handle pagination
            while has_more:
                params = {}
                if start_cursor:
                    params["start_cursor"] = start_cursor
                
                response = requests.get(
                    f"{self.API_BASE_URL}/blocks/{block_id}/children",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to get block children for {block_id}: {response.status_code} - {response.text}")
                    break
                
                response_data = response.json()
                all_blocks.extend(response_data.get("results", []))
                
                # Check if there are more results
                has_more = response_data.get("has_more", False)
                start_cursor = response_data.get("next_cursor", None)
            
            return all_blocks
            
        except Exception as e:
            logger.exception(f"Error getting block children for {block_id}: {str(e)}")
            return []
    
    def create_page(self, parent: Dict[str, Any], properties: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new page in a database.
        
        Args:
            parent: Parent object (database_id or page_id)
            properties: Page properties according to the database schema
            
        Returns:
            Dictionary with the created page information, or None if creation failed
        """
        try:
            payload = {
                "parent": parent,
                "properties": properties
            }
            
            response = requests.post(
                f"{self.API_BASE_URL}/pages",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to create page: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.exception(f"Error creating page: {str(e)}")
            return None
    
    def update_page_properties(self, page_id: str, properties: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update the properties of a page.
        
        Args:
            page_id: The ID of the page to update
            properties: Page properties to update
            
        Returns:
            Dictionary with the updated page information, or None if update failed
        """
        try:
            payload = {
                "properties": properties
            }
            
            response = requests.patch(
                f"{self.API_BASE_URL}/pages/{page_id}",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to update page {page_id}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.exception(f"Error updating page {page_id}: {str(e)}")
            return None
    
    def append_block_children(self, block_id: str, children: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Append child blocks to a block.
        
        Args:
            block_id: The ID of the parent block
            children: List of child blocks to append
            
        Returns:
            Dictionary with response data, or None if append failed
        """
        try:
            payload = {
                "children": children
            }
            
            response = requests.patch(
                f"{self.API_BASE_URL}/blocks/{block_id}/children",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to append block children to {block_id}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.exception(f"Error appending block children to {block_id}: {str(e)}")
            return None
    
    def delete_block(self, block_id: str) -> bool:
        """Delete a block.
        
        Args:
            block_id: The ID of the block to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.delete(
                f"{self.API_BASE_URL}/blocks/{block_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return True
            else:
                logger.error(f"Failed to delete block {block_id}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.exception(f"Error deleting block {block_id}: {str(e)}")
            return False
    
    def search(self, query: str, filter_obj: Optional[Dict[str, Any]] = None, 
               sort: Optional[Dict[str, Any]] = None, page_size: int = 100) -> List[Dict[str, Any]]:
        """Search for Notion objects.
        
        Args:
            query: Search query
            filter_obj: Filter object according to Notion API
            sort: Sort specification according to Notion API
            page_size: Number of results per page
            
        Returns:
            List of objects matching the search
        """
        try:
            payload = {
                "query": query,
                "page_size": page_size
            }
            
            if filter_obj:
                payload["filter"] = filter_obj
                
            if sort:
                payload["sort"] = sort
            
            all_results = []
            has_more = True
            start_cursor = None
            
            # Handle pagination
            while has_more:
                if start_cursor:
                    payload["start_cursor"] = start_cursor
                
                response = requests.post(
                    f"{self.API_BASE_URL}/search",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to search Notion: {response.status_code} - {response.text}")
                    break
                
                response_data = response.json()
                all_results.extend(response_data.get("results", []))
                
                # Check if there are more results
                has_more = response_data.get("has_more", False)
                start_cursor = response_data.get("next_cursor", None)
            
            return all_results
            
        except Exception as e:
            logger.exception(f"Error searching Notion: {str(e)}")
            return []
    
    def extract_database_schema(self, database_id: str) -> Dict[str, Dict[str, Any]]:
        """Extract the schema of a database.
        
        Args:
            database_id: The ID of the database
            
        Returns:
            Dictionary mapping property names to their types and configurations
        """
        database_info = self.get_database(database_id)
        
        if not database_info:
            return {}
        
        properties = database_info.get("properties", {})
        schema = {}
        
        for prop_name, prop_info in properties.items():
            prop_type = prop_info.get("type")
            schema[prop_name] = {
                "type": prop_type,
                "config": prop_info.get(prop_type, {})
            }
        
        return schema
    
    def extract_plain_text(self, rich_text_array: List[Dict[str, Any]]) -> str:
        """Extract plain text from a rich text array.
        
        Args:
            rich_text_array: Array of rich text objects
            
        Returns:
            Plain text string
        """
        return "".join([text.get("plain_text", "") for text in rich_text_array])
    
    def create_rich_text(self, content: str) -> List[Dict[str, Any]]:
        """Create a rich text array from plain text.
        
        Args:
            content: Plain text content
            
        Returns:
            Rich text array for Notion API
        """
        return [
            {
                "type": "text",
                "text": {
                    "content": content,
                    "link": None
                }
            }
        ]
    
    def format_property_value(self, property_type: str, value: Any) -> Dict[str, Any]:
        """Format a property value for the Notion API.
        
        Args:
            property_type: The type of the property
            value: The value to format
            
        Returns:
            Properly formatted property value for Notion API
        """
        if property_type == "title":
            return {
                "title": self.create_rich_text(str(value))
            }
        elif property_type == "rich_text":
            return {
                "rich_text": self.create_rich_text(str(value))
            }
        elif property_type == "number":
            return {
                "number": float(value)
            }
        elif property_type == "select":
            return {
                "select": {
                    "name": str(value)
                }
            }
        elif property_type == "multi_select":
            if not isinstance(value, list):
                value = [value]
            return {
                "multi_select": [{"name": str(item)} for item in value]
            }
        elif property_type == "date":
            if isinstance(value, dict):
                return {"date": value}
            else:
                # Assume ISO format date string
                return {
                    "date": {
                        "start": str(value),
                        "end": None
                    }
                }
        elif property_type == "checkbox":
            return {
                "checkbox": bool(value)
            }
        elif property_type == "url":
            return {
                "url": str(value)
            }
        elif property_type == "email":
            return {
                "email": str(value)
            }
        elif property_type == "phone_number":
            return {
                "phone_number": str(value)
            }
        elif property_type == "relation":
            if not isinstance(value, list):
                value = [value]
            return {
                "relation": [{"id": str(item)} for item in value]
            }
        else:
            # Default to plain text for unsupported types
            return {
                "rich_text": self.create_rich_text(str(value))
            }
    
    def create_database_entry(self, database_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new entry in a database.
        
        Args:
            database_id: The ID of the database
            data: Dictionary mapping property names to values
            
        Returns:
            Dictionary with the created page information, or None if creation failed
        """
        try:
            # Get the database schema
            schema = self.extract_database_schema(database_id)
            
            if not schema:
                logger.error(f"Failed to get schema for database {database_id}")
                return None
            
            # Format properties according to the schema
            properties = {}
            for prop_name, prop_value in data.items():
                if prop_name in schema:
                    prop_type = schema[prop_name]["type"]
                    properties[prop_name] = self.format_property_value(prop_type, prop_value)
            
            # Create the page
            parent = {
                "database_id": database_id
            }
            
            return self.create_page(parent, properties)
            
        except Exception as e:
            logger.exception(f"Error creating database entry: {str(e)}")
            return None
    
    def update_database_entry(self, page_id: str, database_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an entry in a database.
        
        Args:
            page_id: The ID of the page to update
            database_id: The ID of the database
            data: Dictionary mapping property names to values
            
        Returns:
            Dictionary with the updated page information, or None if update failed
        """
        try:
            # Get the database schema
            schema = self.extract_database_schema(database_id)
            
            if not schema:
                logger.error(f"Failed to get schema for database {database_id}")
                return None
            
            # Format properties according to the schema
            properties = {}
            for prop_name, prop_value in data.items():
                if prop_name in schema:
                    prop_type = schema[prop_name]["type"]
                    properties[prop_name] = self.format_property_value(prop_type, prop_value)
            
            # Update the page
            return self.update_page_properties(page_id, properties)
            
        except Exception as e:
            logger.exception(f"Error updating database entry: {str(e)}")
            return None
    
    def extract_database_entries(self, database_id: str, filter_obj: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Extract entries from a database with simplified property values.
        
        Args:
            database_id: The ID of the database
            filter_obj: Filter object according to Notion API
            
        Returns:
            List of dictionaries with simplified property values
        """
        try:
            # Query the database
            results = self.query_database(database_id, filter_obj)
            
            # Extract and simplify property values
            entries = []
            
            for result in results:
                entry = {
                    "id": result.get("id"),
                    "created_time": result.get("created_time"),
                    "last_edited_time": result.get("last_edited_time"),
                    "properties": {}
                }
                
                for prop_name, prop_data in result.get("properties", {}).items():
                    prop_type = prop_data.get("type")
                    
                    if prop_type == "title" or prop_type == "rich_text":
                        entry["properties"][prop_name] = self.extract_plain_text(prop_data.get(prop_type, []))
                    elif prop_type == "number":
                        entry["properties"][prop_name] = prop_data.get("number")
                    elif prop_type == "select":
                        select_data = prop_data.get("select")
                        entry["properties"][prop_name] = select_data.get("name") if select_data else None
                    elif prop_type == "multi_select":
                        entry["properties"][prop_name] = [item.get("name") for item in prop_data.get("multi_select", [])]
                    elif prop_type == "date":
                        date_data = prop_data.get("date")
                        entry["properties"][prop_name] = date_data if date_data else None
                    elif prop_type == "checkbox":
                        entry["properties"][prop_name] = prop_data.get("checkbox")
                    elif prop_type == "url":
                        entry["properties"][prop_name] = prop_data.get("url")
                    elif prop_type == "email":
                        entry["properties"][prop_name] = prop_data.get("email")
                    elif prop_type == "phone_number":
                        entry["properties"][prop_name] = prop_data.get("phone_number")
                    elif prop_type == "relation":
                        entry["properties"][prop_name] = [item.get("id") for item in prop_data.get("relation", [])]
                    else:
                        # Default behavior for unsupported types
                        entry["properties"][prop_name] = prop_data.get(prop_type)
                
                entries.append(entry)
            
            return entries
            
        except Exception as e:
            logger.exception(f"Error extracting database entries: {str(e)}")
            return []