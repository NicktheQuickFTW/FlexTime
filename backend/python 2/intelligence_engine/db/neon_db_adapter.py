"""
Neon DB Adapter for the HELiiX Intelligence Engine

This module provides database integration with Neon DB (PostgreSQL-compatible)
for persistent storage of various components.
"""

import os
import json
import logging
import psycopg2
import psycopg2.extras
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

# Configure logging
logger = logging.getLogger('intelligence_engine.db.neon_db_adapter')

class NeonDBAdapter:
    """Adapter for interacting with Neon DB."""
    
    def __init__(self, connection_string: Optional[str] = None):
        """Initialize the Neon DB adapter.
        
        Args:
            connection_string: PostgreSQL connection string for Neon DB
                If not provided, it will be read from the environment variable NEON_DB_CONNECTION_STRING
        """
        self.connection_string = connection_string or os.environ.get('NEON_DB_CONNECTION_STRING')
        
        if not self.connection_string:
            raise ValueError("Neon DB connection string is required. Provide it as a parameter or set the NEON_DB_CONNECTION_STRING environment variable.")
        
        self.conn = None
        self.initialized_tables = set()
    
    def connect(self) -> bool:
        """Connect to the Neon DB instance.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.conn = psycopg2.connect(self.connection_string)
            logger.info("Successfully connected to Neon DB")
            return True
        except Exception as e:
            logger.exception(f"Error connecting to Neon DB: {str(e)}")
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from the Neon DB instance.
        
        Returns:
            True if successful, False otherwise
        """
        if self.conn:
            try:
                self.conn.close()
                self.conn = None
                logger.info("Disconnected from Neon DB")
                return True
            except Exception as e:
                logger.exception(f"Error disconnecting from Neon DB: {str(e)}")
                return False
        return True
    
    def ensure_connection(self) -> bool:
        """Ensure there is an active connection to the database.
        
        Returns:
            True if a connection exists or was established, False otherwise
        """
        if self.conn is None:
            return self.connect()
        
        try:
            # Check if connection is still valid
            cur = self.conn.cursor()
            cur.execute("SELECT 1")
            cur.close()
            return True
        except Exception:
            # Connection is not valid, try to reconnect
            self.disconnect()
            return self.connect()
    
    def ensure_table(self, table_name: str, schema: Dict[str, str], primary_key: str = 'id') -> bool:
        """Ensure that a table exists with the specified schema.
        
        Args:
            table_name: Name of the table
            schema: Dictionary mapping column names to their PostgreSQL types
            primary_key: The primary key column name (default: 'id')
            
        Returns:
            True if the table exists or was created, False otherwise
        """
        if not self.ensure_connection():
            return False
        
        if table_name in self.initialized_tables:
            return True
        
        try:
            # Check if table exists
            cur = self.conn.cursor()
            cur.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}')")
            table_exists = cur.fetchone()[0]
            
            if not table_exists:
                # Create the table
                columns = [f"{col_name} {col_type}" for col_name, col_type in schema.items()]
                columns_str = ', '.join(columns)
                
                create_table_sql = f"""
                CREATE TABLE {table_name} (
                    {columns_str},
                    PRIMARY KEY ({primary_key})
                )
                """
                
                cur.execute(create_table_sql)
                self.conn.commit()
                logger.info(f"Created table: {table_name}")
            
            self.initialized_tables.add(table_name)
            cur.close()
            return True
            
        except Exception as e:
            logger.exception(f"Error ensuring table {table_name}: {str(e)}")
            self.conn.rollback()
            return False
    
    def insert(self, table_name: str, data: Dict[str, Any]) -> Optional[str]:
        """Insert data into a table.
        
        Args:
            table_name: Name of the table
            data: Dictionary mapping column names to values
            
        Returns:
            The ID of the inserted row, or None if the insert failed
        """
        if not self.ensure_connection():
            return None
        
        try:
            cur = self.conn.cursor()
            
            columns = list(data.keys())
            values = list(data.values())
            
            placeholders = ', '.join([f'%s' for _ in columns])
            columns_str = ', '.join(columns)
            
            insert_sql = f"""
            INSERT INTO {table_name} ({columns_str})
            VALUES ({placeholders})
            RETURNING id
            """
            
            cur.execute(insert_sql, values)
            result = cur.fetchone()
            self.conn.commit()
            
            if result:
                inserted_id = result[0]
                logger.info(f"Inserted row into {table_name} with id: {inserted_id}")
                return inserted_id
            
            return None
            
        except Exception as e:
            logger.exception(f"Error inserting into {table_name}: {str(e)}")
            self.conn.rollback()
            return None
    
    def update(self, table_name: str, id_value: str, data: Dict[str, Any]) -> bool:
        """Update a row in a table.
        
        Args:
            table_name: Name of the table
            id_value: Value of the primary key
            data: Dictionary mapping column names to values
            
        Returns:
            True if successful, False otherwise
        """
        if not self.ensure_connection():
            return False
        
        try:
            cur = self.conn.cursor()
            
            set_clauses = [f"{column} = %s" for column in data.keys()]
            set_clause = ', '.join(set_clauses)
            
            values = list(data.values())
            values.append(id_value)  # For the WHERE clause
            
            update_sql = f"""
            UPDATE {table_name}
            SET {set_clause}
            WHERE id = %s
            """
            
            cur.execute(update_sql, values)
            self.conn.commit()
            
            if cur.rowcount > 0:
                logger.info(f"Updated row in {table_name} with id: {id_value}")
                return True
            else:
                logger.warn(f"No rows updated in {table_name} with id: {id_value}")
                return False
            
        except Exception as e:
            logger.exception(f"Error updating {table_name}: {str(e)}")
            self.conn.rollback()
            return False
    
    def delete(self, table_name: str, id_value: str) -> bool:
        """Delete a row from a table.
        
        Args:
            table_name: Name of the table
            id_value: Value of the primary key
            
        Returns:
            True if successful, False otherwise
        """
        if not self.ensure_connection():
            return False
        
        try:
            cur = self.conn.cursor()
            
            delete_sql = f"""
            DELETE FROM {table_name}
            WHERE id = %s
            """
            
            cur.execute(delete_sql, (id_value,))
            self.conn.commit()
            
            if cur.rowcount > 0:
                logger.info(f"Deleted row from {table_name} with id: {id_value}")
                return True
            else:
                logger.warn(f"No rows deleted from {table_name} with id: {id_value}")
                return False
            
        except Exception as e:
            logger.exception(f"Error deleting from {table_name}: {str(e)}")
            self.conn.rollback()
            return False
    
    def get(self, table_name: str, id_value: str) -> Optional[Dict[str, Any]]:
        """Get a row from a table by ID.
        
        Args:
            table_name: Name of the table
            id_value: Value of the primary key
            
        Returns:
            Dictionary with the row data, or None if not found
        """
        if not self.ensure_connection():
            return None
        
        try:
            cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            query_sql = f"""
            SELECT * FROM {table_name}
            WHERE id = %s
            """
            
            cur.execute(query_sql, (id_value,))
            result = cur.fetchone()
            
            if result:
                return dict(result)
            
            return None
            
        except Exception as e:
            logger.exception(f"Error getting from {table_name}: {str(e)}")
            return None
    
    def query(self, table_name: str, conditions: Dict[str, Any] = None, 
              order_by: str = None, limit: int = None, offset: int = None) -> List[Dict[str, Any]]:
        """Query rows from a table with optional conditions.
        
        Args:
            table_name: Name of the table
            conditions: Dictionary mapping column names to values for WHERE clause
            order_by: Column to order by (with optional ASC/DESC)
            limit: Maximum number of rows to return
            offset: Number of rows to skip
            
        Returns:
            List of dictionaries with row data
        """
        if not self.ensure_connection():
            return []
        
        try:
            cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            query_sql = f"SELECT * FROM {table_name}"
            params = []
            
            # Add WHERE clause if conditions provided
            if conditions:
                where_clauses = []
                for column, value in conditions.items():
                    where_clauses.append(f"{column} = %s")
                    params.append(value)
                
                where_clause = " AND ".join(where_clauses)
                query_sql += f" WHERE {where_clause}"
            
            # Add ORDER BY if provided
            if order_by:
                query_sql += f" ORDER BY {order_by}"
            
            # Add LIMIT if provided
            if limit is not None:
                query_sql += f" LIMIT %s"
                params.append(limit)
            
            # Add OFFSET if provided
            if offset is not None:
                query_sql += f" OFFSET %s"
                params.append(offset)
            
            cur.execute(query_sql, params)
            results = cur.fetchall()
            
            return [dict(row) for row in results]
            
        except Exception as e:
            logger.exception(f"Error querying {table_name}: {str(e)}")
            return []
    
    def execute_query(self, query: str, params: List[Any] = None) -> List[Dict[str, Any]]:
        """Execute a custom SQL query.
        
        Args:
            query: The SQL query to execute
            params: List of parameter values for the query
            
        Returns:
            List of dictionaries with result rows
        """
        if not self.ensure_connection():
            return []
        
        try:
            cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
            
            if query.strip().upper().startswith(('SELECT', 'WITH')):
                results = cur.fetchall()
                return [dict(row) for row in results]
            else:
                self.conn.commit()
                return [{'rowcount': cur.rowcount}]
            
        except Exception as e:
            logger.exception(f"Error executing custom query: {str(e)}")
            self.conn.rollback()
            return []
    
    def store_json(self, table_name: str, json_data: Any, id_key: str = None) -> Optional[str]:
        """Store JSON data in a table.
        
        Args:
            table_name: Name of the table
            json_data: JSON-serializable data to store
            id_key: Key in the JSON data to use as ID (if not provided, a new ID will be generated)
            
        Returns:
            ID of the stored data, or None if storage failed
        """
        if not self.ensure_connection():
            return None
        
        # Ensure table exists with JSONB column
        schema = {
            'id': 'VARCHAR(255) NOT NULL',
            'data': 'JSONB NOT NULL',
            'created_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at': 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
        }
        
        if not self.ensure_table(table_name, schema):
            return None
        
        # Determine ID
        if id_key and id_key in json_data:
            id_value = str(json_data[id_key])
        else:
            import uuid
            id_value = str(uuid.uuid4())
        
        # Convert to JSON string
        json_string = json.dumps(json_data)
        
        try:
            cur = self.conn.cursor()
            
            # Check if record exists
            cur.execute(f"SELECT id FROM {table_name} WHERE id = %s", (id_value,))
            exists = cur.fetchone() is not None
            
            if exists:
                # Update existing record
                update_sql = f"""
                UPDATE {table_name}
                SET data = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """
                cur.execute(update_sql, (json_string, id_value))
            else:
                # Insert new record
                insert_sql = f"""
                INSERT INTO {table_name} (id, data)
                VALUES (%s, %s)
                """
                cur.execute(insert_sql, (id_value, json_string))
            
            self.conn.commit()
            logger.info(f"Stored JSON data in {table_name} with id: {id_value}")
            
            return id_value
            
        except Exception as e:
            logger.exception(f"Error storing JSON in {table_name}: {str(e)}")
            self.conn.rollback()
            return None
    
    def get_json(self, table_name: str, id_value: str) -> Optional[Any]:
        """Get JSON data from a table.
        
        Args:
            table_name: Name of the table
            id_value: Value of the primary key
            
        Returns:
            The stored JSON data, or None if not found
        """
        if not self.ensure_connection():
            return None
        
        try:
            cur = self.conn.cursor()
            
            query_sql = f"""
            SELECT data FROM {table_name}
            WHERE id = %s
            """
            
            cur.execute(query_sql, (id_value,))
            result = cur.fetchone()
            
            if result:
                return json.loads(result[0])
            
            return None
            
        except Exception as e:
            logger.exception(f"Error getting JSON from {table_name}: {str(e)}")
            return None
    
    def query_json(self, table_name: str, json_path: str, json_value: Any) -> List[Dict[str, Any]]:
        """Query JSON data using a JSON path expression.
        
        Args:
            table_name: Name of the table
            json_path: JSON path expression (e.g., '$.name')
            json_value: Value to match in the JSON path
            
        Returns:
            List of matching JSON objects
        """
        if not self.ensure_connection():
            return []
        
        try:
            cur = self.conn.cursor()
            
            # Convert value to JSON string for the query
            json_value_str = json.dumps(json_value)
            
            query_sql = f"""
            SELECT id, data FROM {table_name}
            WHERE data @> '{{{json_path}: {json_value_str}}}'
            """
            
            cur.execute(query_sql)
            results = cur.fetchall()
            
            return [{'id': row[0], 'data': json.loads(row[1])} for row in results]
            
        except Exception as e:
            logger.exception(f"Error querying JSON in {table_name}: {str(e)}")
            return []