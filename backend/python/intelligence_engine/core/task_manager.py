"""
Task Manager for the HELiiX Intelligence Engine

This module provides task management functionality for the Intelligence Engine,
including task creation, scheduling, execution, and monitoring.
"""

import os
import uuid
import time
import logging
import threading
import queue
from datetime import datetime
from typing import Dict, Any, Callable, List, Optional

# Configure logging
logger = logging.getLogger('intelligence_engine.task_manager')

class Task:
    """Represents a task in the Intelligence Engine."""
    
    def __init__(self, agent_id: str, task_type: str, parameters: Dict[str, Any]):
        """Initialize a new task.
        
        Args:
            agent_id: ID of the agent that submitted the task
            task_type: Type of the task
            parameters: Parameters for the task
        """
        self.task_id = str(uuid.uuid4())
        self.agent_id = agent_id
        self.task_type = task_type
        self.parameters = parameters
        self.status = 'pending'
        self.created = datetime.now()
        self.updated = self.created
        self.started = None
        self.completed = None
        self.result = None
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the task to a dictionary.
        
        Returns:
            Dictionary representation of the task
        """
        return {
            'taskId': self.task_id,
            'agentId': self.agent_id,
            'taskType': self.task_type,
            'parameters': self.parameters,
            'status': self.status,
            'created': self.created.isoformat(),
            'updated': self.updated.isoformat(),
            'started': self.started.isoformat() if self.started else None,
            'completed': self.completed.isoformat() if self.completed else None,
            'result': self.result,
            'error': self.error
        }
    
    def update_status(self, status: str):
        """Update the status of the task.
        
        Args:
            status: New status of the task
        """
        self.status = status
        self.updated = datetime.now()
        
        if status == 'processing' and not self.started:
            self.started = self.updated
        elif status in ['completed', 'failed']:
            self.completed = self.updated
    
    def set_result(self, result: Dict[str, Any]):
        """Set the result of the task.
        
        Args:
            result: Result of the task
        """
        self.result = result
        self.update_status('completed')
    
    def set_error(self, error: str):
        """Set an error for the task.
        
        Args:
            error: Error message
        """
        self.error = error
        self.update_status('failed')


class TaskRegistry:
    """Registry of task handlers."""
    
    def __init__(self):
        """Initialize the task registry."""
        self.handlers = {}
    
    def register(self, task_type: str, handler: Callable[[Task], Dict[str, Any]]):
        """Register a handler for a task type.
        
        Args:
            task_type: Type of the task
            handler: Function that handles the task
        """
        self.handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
    
    def get_handler(self, task_type: str) -> Optional[Callable[[Task], Dict[str, Any]]]:
        """Get the handler for a task type.
        
        Args:
            task_type: Type of the task
            
        Returns:
            Handler function or None if no handler is registered
        """
        return self.handlers.get(task_type)
    
    def unregister(self, task_type: str):
        """Unregister a handler for a task type.
        
        Args:
            task_type: Type of the task
        """
        if task_type in self.handlers:
            del self.handlers[task_type]
            logger.info(f"Unregistered handler for task type: {task_type}")


class TaskManager:
    """Manages tasks in the Intelligence Engine."""
    
    def __init__(self, num_workers: int = 4):
        """Initialize the task manager.
        
        Args:
            num_workers: Number of worker threads
        """
        self.tasks = {}
        self.registry = TaskRegistry()
        self.task_queue = queue.Queue()
        self.num_workers = num_workers
        self.workers = []
        self.running = False
        
        # Initialize locks
        self.tasks_lock = threading.Lock()
    
    def start(self):
        """Start the task manager."""
        if self.running:
            return
        
        self.running = True
        
        # Start worker threads
        for i in range(self.num_workers):
            worker = threading.Thread(target=self._worker_loop, name=f"TaskWorker-{i}")
            worker.daemon = True
            worker.start()
            self.workers.append(worker)
        
        logger.info(f"Started TaskManager with {self.num_workers} workers")
    
    def stop(self):
        """Stop the task manager."""
        if not self.running:
            return
        
        self.running = False
        
        # Clear the queue
        with self.task_queue.mutex:
            self.task_queue.queue.clear()
        
        # Add a None task for each worker to signal them to stop
        for _ in range(self.num_workers):
            self.task_queue.put(None)
        
        # Wait for workers to finish
        for worker in self.workers:
            worker.join(timeout=5.0)
        
        # Clear workers
        self.workers = []
        
        logger.info("Stopped TaskManager")
    
    def create_task(self, agent_id: str, task_type: str, parameters: Dict[str, Any]) -> Task:
        """Create a new task.
        
        Args:
            agent_id: ID of the agent that submitted the task
            task_type: Type of the task
            parameters: Parameters for the task
            
        Returns:
            The created task
        """
        task = Task(agent_id, task_type, parameters)
        
        with self.tasks_lock:
            self.tasks[task.task_id] = task
        
        logger.info(f"Created task {task.task_id} of type {task_type} for agent {agent_id}")
        
        return task
    
    def submit_task(self, task: Task) -> str:
        """Submit a task for execution.
        
        Args:
            task: The task to submit
            
        Returns:
            The task ID
        """
        # Check if there's a handler for this task type
        if not self.registry.get_handler(task.task_type):
            task.set_error(f"No handler registered for task type: {task.task_type}")
            return task.task_id
        
        # Add task to queue
        self.task_queue.put(task)
        
        logger.info(f"Submitted task {task.task_id} to queue")
        
        return task.task_id
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID.
        
        Args:
            task_id: ID of the task
            
        Returns:
            The task or None if not found
        """
        with self.tasks_lock:
            return self.tasks.get(task_id)
    
    def _worker_loop(self):
        """Worker thread loop."""
        thread_name = threading.current_thread().name
        logger.info(f"Starting worker thread: {thread_name}")
        
        while self.running:
            try:
                # Get a task from the queue
                task = self.task_queue.get(timeout=1.0)
                
                # Check if we should stop
                if task is None:
                    logger.info(f"Worker thread {thread_name} received stop signal")
                    break
                
                # Process the task
                self._process_task(task)
                
                # Mark the task as done
                self.task_queue.task_done()
            except queue.Empty:
                # No tasks in the queue, just continue
                continue
            except Exception as e:
                logger.exception(f"Error in worker thread {thread_name}: {str(e)}")
        
        logger.info(f"Worker thread {thread_name} stopped")
    
    def _process_task(self, task: Task):
        """Process a task.
        
        Args:
            task: The task to process
        """
        logger.info(f"Processing task {task.task_id} of type {task.task_type}")
        
        try:
            # Update task status
            task.update_status('processing')
            
            # Get handler for task type
            handler = self.registry.get_handler(task.task_type)
            
            if not handler:
                task.set_error(f"No handler registered for task type: {task.task_type}")
                return
            
            # Execute handler
            result = handler(task)
            
            # Set task result
            task.set_result(result)
            
            logger.info(f"Completed task {task.task_id}")
        except Exception as e:
            logger.exception(f"Error processing task {task.task_id}: {str(e)}")
            task.set_error(f"Error processing task: {str(e)}")


# Singleton instance
_task_manager = None

def get_task_manager() -> TaskManager:
    """Get the singleton TaskManager instance.
    
    Returns:
        The TaskManager instance
    """
    global _task_manager
    
    if _task_manager is None:
        # Determine the number of workers from environment or default to 4
        num_workers = int(os.environ.get('TASK_WORKERS', 4))
        
        # Create and start the task manager
        _task_manager = TaskManager(num_workers=num_workers)
        _task_manager.start()
    
    return _task_manager