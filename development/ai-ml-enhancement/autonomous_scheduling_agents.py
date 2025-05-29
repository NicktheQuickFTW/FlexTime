"""
Autonomous Multi-Agent Scheduling System for FlexTime
Advanced AI agents for autonomous schedule refinement and conflict resolution.

This module provides:
- Multi-agent negotiation algorithms
- Distributed constraint satisfaction
- Autonomous schedule refinement
- Intelligent conflict resolution
- Self-healing schedule optimization
- Collaborative decision making
"""

import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import json
import numpy as np
from abc import ABC, abstractmethod
import heapq

# Configure logging
logger = logging.getLogger('autonomous_scheduling')

class AgentType(Enum):
    """Types of scheduling agents."""
    DIRECTOR = "director"
    CONSTRAINT_MANAGER = "constraint_manager"
    SCHEDULE_OPTIMIZER = "schedule_optimizer"
    CONFLICT_RESOLVER = "conflict_resolver"
    VENUE_MANAGER = "venue_manager"
    TRAVEL_OPTIMIZER = "travel_optimizer"
    QUALITY_ASSESSOR = "quality_assessor"
    NEGOTIATOR = "negotiator"

class MessageType(Enum):
    """Types of inter-agent messages."""
    PROPOSAL = "proposal"
    ACCEPTANCE = "acceptance"
    REJECTION = "rejection"
    COUNTER_PROPOSAL = "counter_proposal"
    CONSTRAINT_VIOLATION = "constraint_violation"
    OPTIMIZATION_REQUEST = "optimization_request"
    STATUS_UPDATE = "status_update"
    NEGOTIATION_START = "negotiation_start"
    NEGOTIATION_END = "negotiation_end"
    CONFLICT_ALERT = "conflict_alert"

class Priority(Enum):
    """Priority levels for agent tasks."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

@dataclass
class Message:
    """Inter-agent communication message."""
    id: str
    sender_id: str
    recipient_id: str
    message_type: MessageType
    content: Dict[str, Any]
    priority: Priority
    timestamp: datetime
    expires_at: Optional[datetime] = None
    reply_to: Optional[str] = None

@dataclass
class ScheduleProposal:
    """Schedule modification proposal."""
    proposal_id: str
    proposer_id: str
    games_affected: List[str]
    changes: Dict[str, Any]
    reasoning: str
    impact_score: float
    confidence: float
    constraints_satisfied: List[str]
    constraints_violated: List[str]

@dataclass
class Constraint:
    """Scheduling constraint."""
    id: str
    name: str
    type: str  # 'hard', 'soft', 'preference'
    priority: Priority
    description: str
    parameters: Dict[str, Any]
    affected_entities: List[str]
    satisfaction_function: Optional[callable] = None

@dataclass
class ConflictReport:
    """Conflict detection report."""
    conflict_id: str
    type: str
    severity: str  # 'critical', 'major', 'minor'
    description: str
    affected_games: List[str]
    affected_constraints: List[str]
    suggested_resolutions: List[Dict[str, Any]]
    detected_at: datetime

class BaseAgent(ABC):
    """Abstract base class for scheduling agents."""
    
    def __init__(self, agent_id: str, agent_type: AgentType, name: str = ""):
        """Initialize the agent.
        
        Args:
            agent_id: Unique agent identifier
            agent_type: Type of agent
            name: Human-readable agent name
        """
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.name = name or f"{agent_type.value}_{agent_id[:8]}"
        self.status = "active"
        self.inbox = asyncio.Queue()
        self.outbox = asyncio.Queue()
        self.knowledge_base = {}
        self.capabilities = set()
        self.performance_metrics = {
            'messages_processed': 0,
            'proposals_made': 0,
            'conflicts_resolved': 0,
            'average_response_time': 0.0
        }
        self.running = False
        
        logger.info(f"Initialized agent {self.name} ({self.agent_id})")
    
    async def start(self):
        """Start the agent's main processing loop."""
        self.running = True
        logger.info(f"Starting agent {self.name}")
        
        # Start message processing loop
        await asyncio.gather(
            self._message_processing_loop(),
            self._periodic_tasks_loop()
        )
    
    async def stop(self):
        """Stop the agent."""
        self.running = False
        self.status = "stopped"
        logger.info(f"Stopped agent {self.name}")
    
    async def send_message(self, recipient_id: str, message_type: MessageType,
                          content: Dict[str, Any], priority: Priority = Priority.MEDIUM,
                          expires_in_minutes: Optional[int] = None) -> str:
        """Send a message to another agent.
        
        Args:
            recipient_id: Target agent ID
            message_type: Type of message
            content: Message content
            priority: Message priority
            expires_in_minutes: Message expiration time
            
        Returns:
            Message ID
        """
        message_id = str(uuid.uuid4())
        expires_at = None
        if expires_in_minutes:
            expires_at = datetime.now() + timedelta(minutes=expires_in_minutes)
        
        message = Message(
            id=message_id,
            sender_id=self.agent_id,
            recipient_id=recipient_id,
            message_type=message_type,
            content=content,
            priority=priority,
            timestamp=datetime.now(),
            expires_at=expires_at
        )
        
        await self.outbox.put(message)
        return message_id
    
    async def receive_message(self, message: Message):
        """Receive a message from another agent.
        
        Args:
            message: Incoming message
        """
        await self.inbox.put(message)
    
    async def _message_processing_loop(self):
        """Main message processing loop."""
        while self.running:
            try:
                # Process messages with timeout
                message = await asyncio.wait_for(self.inbox.get(), timeout=1.0)
                
                # Check if message has expired
                if message.expires_at and datetime.now() > message.expires_at:
                    logger.warning(f"Message {message.id} expired, discarding")
                    continue
                
                # Process the message
                start_time = datetime.now()
                await self.process_message(message)
                
                # Update performance metrics
                response_time = (datetime.now() - start_time).total_seconds()
                self._update_performance_metrics(response_time)
                
            except asyncio.TimeoutError:
                # No messages to process, continue
                continue
            except Exception as e:
                logger.error(f"Error processing message in {self.name}: {e}")
    
    async def _periodic_tasks_loop(self):
        """Periodic tasks loop."""
        while self.running:
            try:
                await self.periodic_tasks()
                await asyncio.sleep(10)  # Run periodic tasks every 10 seconds
            except Exception as e:
                logger.error(f"Error in periodic tasks for {self.name}: {e}")
    
    def _update_performance_metrics(self, response_time: float):
        """Update agent performance metrics."""
        self.performance_metrics['messages_processed'] += 1
        
        # Update average response time using exponential moving average
        current_avg = self.performance_metrics['average_response_time']
        alpha = 0.1  # Smoothing factor
        self.performance_metrics['average_response_time'] = (
            alpha * response_time + (1 - alpha) * current_avg
        )
    
    @abstractmethod
    async def process_message(self, message: Message):
        """Process an incoming message.
        
        Args:
            message: Message to process
        """
        pass
    
    async def periodic_tasks(self):
        """Perform periodic tasks."""
        # Override in subclasses for specific periodic behavior
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status information.
        
        Returns:
            Status dictionary
        """
        return {
            'agent_id': self.agent_id,
            'name': self.name,
            'type': self.agent_type.value,
            'status': self.status,
            'capabilities': list(self.capabilities),
            'performance_metrics': self.performance_metrics,
            'inbox_size': self.inbox.qsize(),
            'outbox_size': self.outbox.qsize()
        }

class DirectorAgent(BaseAgent):
    """Master director agent that coordinates the entire scheduling system."""
    
    def __init__(self, agent_id: str = None):
        """Initialize the director agent."""
        super().__init__(
            agent_id or str(uuid.uuid4()),
            AgentType.DIRECTOR,
            "Schedule Director"
        )
        self.capabilities = {
            'coordination', 'high_level_planning', 'conflict_escalation',
            'resource_allocation', 'strategic_optimization'
        }
        self.managed_agents = {}
        self.active_projects = {}
        self.global_constraints = []
        
    async def register_agent(self, agent: BaseAgent):
        """Register an agent under this director's management.
        
        Args:
            agent: Agent to register
        """
        self.managed_agents[agent.agent_id] = agent
        logger.info(f"Director registered agent {agent.name}")
    
    async def process_message(self, message: Message):
        """Process incoming messages."""
        if message.message_type == MessageType.CONFLICT_ALERT:
            await self._handle_conflict_escalation(message)
        elif message.message_type == MessageType.STATUS_UPDATE:
            await self._handle_status_update(message)
        elif message.message_type == MessageType.OPTIMIZATION_REQUEST:
            await self._handle_optimization_request(message)
        else:
            logger.warning(f"Director received unhandled message type: {message.message_type}")
    
    async def _handle_conflict_escalation(self, message: Message):
        """Handle conflict escalation from other agents."""
        conflict_data = message.content
        logger.info(f"Director handling escalated conflict: {conflict_data.get('conflict_id')}")
        
        # Analyze conflict severity and impact
        severity = conflict_data.get('severity', 'minor')
        affected_games = conflict_data.get('affected_games', [])
        
        if severity == 'critical':
            # Initiate emergency resolution protocol
            await self._initiate_emergency_resolution(conflict_data)
        else:
            # Delegate to conflict resolver agent
            conflict_resolver = self._find_agent_by_type(AgentType.CONFLICT_RESOLVER)
            if conflict_resolver:
                await self.send_message(
                    conflict_resolver.agent_id,
                    MessageType.CONFLICT_ALERT,
                    conflict_data,
                    Priority.HIGH
                )
    
    async def _initiate_emergency_resolution(self, conflict_data: Dict[str, Any]):
        """Initiate emergency conflict resolution protocol."""
        logger.critical(f"Initiating emergency resolution for conflict {conflict_data.get('conflict_id')}")
        
        # Pause all non-critical optimization activities
        for agent in self.managed_agents.values():
            if agent.agent_type != AgentType.CONFLICT_RESOLVER:
                await self.send_message(
                    agent.agent_id,
                    MessageType.STATUS_UPDATE,
                    {'action': 'pause_non_critical'},
                    Priority.CRITICAL
                )
        
        # Focus all resources on conflict resolution
        conflict_resolver = self._find_agent_by_type(AgentType.CONFLICT_RESOLVER)
        if conflict_resolver:
            await self.send_message(
                conflict_resolver.agent_id,
                MessageType.CONFLICT_ALERT,
                {**conflict_data, 'emergency_mode': True},
                Priority.CRITICAL
            )
    
    def _find_agent_by_type(self, agent_type: AgentType) -> Optional[BaseAgent]:
        """Find an agent by type."""
        for agent in self.managed_agents.values():
            if agent.agent_type == agent_type:
                return agent
        return None
    
    async def _handle_status_update(self, message: Message):
        """Handle status updates from managed agents."""
        agent_status = message.content
        sender_id = message.sender_id
        
        # Update agent tracking
        if sender_id in self.managed_agents:
            logger.debug(f"Status update from {self.managed_agents[sender_id].name}: {agent_status}")
    
    async def _handle_optimization_request(self, message: Message):
        """Handle optimization requests."""
        request_data = message.content
        optimization_type = request_data.get('type', 'general')
        
        # Route to appropriate specialist agent
        if optimization_type == 'travel':
            agent = self._find_agent_by_type(AgentType.TRAVEL_OPTIMIZER)
        elif optimization_type == 'venue':
            agent = self._find_agent_by_type(AgentType.VENUE_MANAGER)
        else:
            agent = self._find_agent_by_type(AgentType.SCHEDULE_OPTIMIZER)
        
        if agent:
            await self.send_message(
                agent.agent_id,
                MessageType.OPTIMIZATION_REQUEST,
                request_data,
                Priority.MEDIUM
            )

class ConflictResolverAgent(BaseAgent):
    """Agent specialized in detecting and resolving scheduling conflicts."""
    
    def __init__(self, agent_id: str = None):
        """Initialize the conflict resolver agent."""
        super().__init__(
            agent_id or str(uuid.uuid4()),
            AgentType.CONFLICT_RESOLVER,
            "Conflict Resolver"
        )
        self.capabilities = {
            'conflict_detection', 'constraint_analysis', 'resolution_planning',
            'negotiation_mediation', 'impact_assessment'
        }
        self.active_conflicts = {}
        self.resolution_strategies = []
        self.conflict_history = []
        
    async def process_message(self, message: Message):
        """Process incoming messages."""
        if message.message_type == MessageType.CONFLICT_ALERT:
            await self._handle_conflict_alert(message)
        elif message.message_type == MessageType.PROPOSAL:
            await self._handle_resolution_proposal(message)
        elif message.message_type == MessageType.ACCEPTANCE:
            await self._handle_resolution_acceptance(message)
        elif message.message_type == MessageType.REJECTION:
            await self._handle_resolution_rejection(message)
    
    async def _handle_conflict_alert(self, message: Message):
        """Handle a new conflict alert."""
        conflict_data = message.content
        conflict_id = conflict_data.get('conflict_id', str(uuid.uuid4()))
        
        logger.info(f"Conflict resolver handling conflict {conflict_id}")
        
        # Create conflict report
        conflict_report = ConflictReport(
            conflict_id=conflict_id,
            type=conflict_data.get('type', 'unknown'),
            severity=conflict_data.get('severity', 'minor'),
            description=conflict_data.get('description', ''),
            affected_games=conflict_data.get('affected_games', []),
            affected_constraints=conflict_data.get('affected_constraints', []),
            suggested_resolutions=[],
            detected_at=datetime.now()
        )
        
        # Store active conflict
        self.active_conflicts[conflict_id] = conflict_report
        
        # Analyze and generate resolution strategies
        resolution_strategies = await self._generate_resolution_strategies(conflict_report)
        
        # If emergency mode, implement immediate resolution
        if conflict_data.get('emergency_mode', False):
            await self._implement_emergency_resolution(conflict_report, resolution_strategies)
        else:
            # Start negotiation process
            await self._initiate_negotiation(conflict_report, resolution_strategies)
    
    async def _generate_resolution_strategies(self, conflict: ConflictReport) -> List[Dict[str, Any]]:
        """Generate possible resolution strategies for a conflict.
        
        Args:
            conflict: Conflict report
            
        Returns:
            List of resolution strategies
        """
        strategies = []
        
        if conflict.type == 'venue_double_booking':
            strategies.extend([
                {
                    'strategy': 'time_shift',
                    'description': 'Shift one game to different time slot',
                    'impact_score': 0.3,
                    'feasibility': 0.8
                },
                {
                    'strategy': 'venue_change',
                    'description': 'Move one game to alternative venue',
                    'impact_score': 0.5,
                    'feasibility': 0.6
                },
                {
                    'strategy': 'date_reschedule',
                    'description': 'Reschedule one game to different date',
                    'impact_score': 0.7,
                    'feasibility': 0.4
                }
            ])
        elif conflict.type == 'travel_constraint_violation':
            strategies.extend([
                {
                    'strategy': 'add_rest_day',
                    'description': 'Add additional rest day between games',
                    'impact_score': 0.4,
                    'feasibility': 0.7
                },
                {
                    'strategy': 'travel_optimization',
                    'description': 'Optimize travel route and timing',
                    'impact_score': 0.2,
                    'feasibility': 0.9
                }
            ])
        elif conflict.type == 'capacity_overload':
            strategies.extend([
                {
                    'strategy': 'load_balancing',
                    'description': 'Redistribute games across time periods',
                    'impact_score': 0.3,
                    'feasibility': 0.8
                },
                {
                    'strategy': 'venue_expansion',
                    'description': 'Utilize additional venue resources',
                    'impact_score': 0.1,
                    'feasibility': 0.5
                }
            ])
        
        # Sort strategies by feasibility and impact
        strategies.sort(key=lambda x: x['feasibility'] * (1 - x['impact_score']), reverse=True)
        
        return strategies
    
    async def _implement_emergency_resolution(self, conflict: ConflictReport, 
                                            strategies: List[Dict[str, Any]]):
        """Implement immediate resolution for emergency conflicts."""
        logger.critical(f"Implementing emergency resolution for conflict {conflict.conflict_id}")
        
        # Choose the most feasible strategy with lowest impact
        if strategies:
            chosen_strategy = strategies[0]
            
            # Create emergency proposal
            proposal = ScheduleProposal(
                proposal_id=str(uuid.uuid4()),
                proposer_id=self.agent_id,
                games_affected=conflict.affected_games,
                changes={'strategy': chosen_strategy},
                reasoning=f"Emergency resolution: {chosen_strategy['description']}",
                impact_score=chosen_strategy['impact_score'],
                confidence=0.9,  # High confidence for emergency actions
                constraints_satisfied=[],
                constraints_violated=[]
            )
            
            # Implement the resolution immediately
            await self._implement_resolution(proposal)
            
            # Notify director of emergency action taken
            director_id = await self._find_director_agent()
            if director_id:
                await self.send_message(
                    director_id,
                    MessageType.STATUS_UPDATE,
                    {
                        'action': 'emergency_resolution_completed',
                        'conflict_id': conflict.conflict_id,
                        'strategy_used': chosen_strategy
                    },
                    Priority.CRITICAL
                )
    
    async def _initiate_negotiation(self, conflict: ConflictReport, 
                                   strategies: List[Dict[str, Any]]):
        """Initiate negotiation process for conflict resolution."""
        logger.info(f"Initiating negotiation for conflict {conflict.conflict_id}")
        
        # Find relevant agents for negotiation
        relevant_agents = await self._find_relevant_agents(conflict)
        
        # Send negotiation start message to all relevant agents
        for agent_id in relevant_agents:
            await self.send_message(
                agent_id,
                MessageType.NEGOTIATION_START,
                {
                    'conflict_id': conflict.conflict_id,
                    'conflict_details': conflict.__dict__,
                    'proposed_strategies': strategies
                },
                Priority.HIGH,
                expires_in_minutes=30
            )
    
    async def _find_relevant_agents(self, conflict: ConflictReport) -> List[str]:
        """Find agents relevant to a specific conflict."""
        relevant_agents = []
        
        # Always include venue manager for venue-related conflicts
        if 'venue' in conflict.type:
            # Would find venue manager agent ID
            pass
        
        # Include travel optimizer for travel-related conflicts
        if 'travel' in conflict.type:
            # Would find travel optimizer agent ID
            pass
        
        # Include schedule optimizer for general conflicts
        # Would find schedule optimizer agent ID
        
        return relevant_agents
    
    async def _find_director_agent(self) -> Optional[str]:
        """Find the director agent ID."""
        # In a real implementation, this would query the agent registry
        return None
    
    async def _implement_resolution(self, proposal: ScheduleProposal):
        """Implement a resolution proposal."""
        logger.info(f"Implementing resolution proposal {proposal.proposal_id}")
        
        # Update conflict status
        for conflict_id, conflict in self.active_conflicts.items():
            if any(game in proposal.games_affected for game in conflict.affected_games):
                # Mark conflict as resolved
                self.conflict_history.append({
                    'conflict_id': conflict_id,
                    'resolved_at': datetime.now(),
                    'resolution_strategy': proposal.changes.get('strategy', {}),
                    'impact_score': proposal.impact_score
                })
                del self.active_conflicts[conflict_id]
                break
        
        # Update performance metrics
        self.performance_metrics['conflicts_resolved'] += 1
    
    async def _handle_resolution_proposal(self, message: Message):
        """Handle a resolution proposal from another agent."""
        proposal_data = message.content
        logger.info(f"Received resolution proposal from {message.sender_id}")
        
        # Evaluate the proposal
        evaluation = await self._evaluate_proposal(proposal_data)
        
        if evaluation['acceptable']:
            await self.send_message(
                message.sender_id,
                MessageType.ACCEPTANCE,
                {'proposal_id': proposal_data.get('proposal_id'), 'evaluation': evaluation},
                Priority.HIGH
            )
        else:
            # Send counter-proposal or rejection
            if evaluation.get('counter_proposal'):
                await self.send_message(
                    message.sender_id,
                    MessageType.COUNTER_PROPOSAL,
                    evaluation['counter_proposal'],
                    Priority.HIGH
                )
            else:
                await self.send_message(
                    message.sender_id,
                    MessageType.REJECTION,
                    {'proposal_id': proposal_data.get('proposal_id'), 'reason': evaluation['reason']},
                    Priority.HIGH
                )
    
    async def _evaluate_proposal(self, proposal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a resolution proposal."""
        # Simplified evaluation logic
        impact_score = proposal_data.get('impact_score', 0.5)
        confidence = proposal_data.get('confidence', 0.5)
        
        # Accept if impact is low and confidence is high
        acceptable = impact_score < 0.3 and confidence > 0.7
        
        return {
            'acceptable': acceptable,
            'reason': 'Impact too high' if not acceptable else 'Proposal acceptable',
            'score': confidence * (1 - impact_score)
        }
    
    async def _handle_resolution_acceptance(self, message: Message):
        """Handle acceptance of a resolution proposal."""
        acceptance_data = message.content
        proposal_id = acceptance_data.get('proposal_id')
        
        logger.info(f"Resolution proposal {proposal_id} accepted by {message.sender_id}")
        
        # Implement the accepted proposal
        # Would retrieve proposal and implement it
    
    async def _handle_resolution_rejection(self, message: Message):
        """Handle rejection of a resolution proposal."""
        rejection_data = message.content
        proposal_id = rejection_data.get('proposal_id')
        reason = rejection_data.get('reason', 'No reason provided')
        
        logger.info(f"Resolution proposal {proposal_id} rejected by {message.sender_id}: {reason}")
        
        # Generate alternative proposals or escalate to director

class NegotiatorAgent(BaseAgent):
    """Agent specialized in multi-party negotiations for schedule optimization."""
    
    def __init__(self, agent_id: str = None):
        """Initialize the negotiator agent."""
        super().__init__(
            agent_id or str(uuid.uuid4()),
            AgentType.NEGOTIATOR,
            "Negotiator"
        )
        self.capabilities = {
            'multi_party_negotiation', 'consensus_building', 'compromise_generation',
            'stakeholder_representation', 'deal_optimization'
        }
        self.active_negotiations = {}
        self.negotiation_history = []
        
    async def process_message(self, message: Message):
        """Process incoming messages."""
        if message.message_type == MessageType.NEGOTIATION_START:
            await self._start_negotiation(message)
        elif message.message_type == MessageType.PROPOSAL:
            await self._handle_negotiation_proposal(message)
        elif message.message_type == MessageType.COUNTER_PROPOSAL:
            await self._handle_counter_proposal(message)
        elif message.message_type == MessageType.ACCEPTANCE:
            await self._handle_acceptance(message)
        elif message.message_type == MessageType.REJECTION:
            await self._handle_rejection(message)
    
    async def _start_negotiation(self, message: Message):
        """Start a new negotiation session."""
        negotiation_data = message.content
        negotiation_id = str(uuid.uuid4())
        
        logger.info(f"Starting negotiation session {negotiation_id}")
        
        # Initialize negotiation state
        self.active_negotiations[negotiation_id] = {
            'id': negotiation_id,
            'topic': negotiation_data.get('topic', 'schedule_optimization'),
            'participants': [],
            'proposals': [],
            'current_round': 1,
            'max_rounds': 5,
            'started_at': datetime.now(),
            'status': 'active'
        }
        
        # Invite participants
        participants = negotiation_data.get('participants', [])
        for participant_id in participants:
            await self.send_message(
                participant_id,
                MessageType.NEGOTIATION_START,
                {
                    'negotiation_id': negotiation_id,
                    'topic': negotiation_data.get('topic'),
                    'initial_constraints': negotiation_data.get('constraints', [])
                },
                Priority.HIGH
            )
    
    async def _handle_negotiation_proposal(self, message: Message):
        """Handle a proposal within a negotiation."""
        proposal_data = message.content
        negotiation_id = proposal_data.get('negotiation_id')
        
        if negotiation_id not in self.active_negotiations:
            logger.warning(f"Received proposal for unknown negotiation {negotiation_id}")
            return
        
        negotiation = self.active_negotiations[negotiation_id]
        negotiation['proposals'].append({
            'proposer': message.sender_id,
            'proposal': proposal_data,
            'timestamp': datetime.now()
        })
        
        # Evaluate proposal against other proposals
        evaluation = await self._evaluate_proposal_in_context(proposal_data, negotiation)
        
        # If proposal is promising, circulate to other participants
        if evaluation['score'] > 0.7:
            await self._circulate_proposal(negotiation_id, proposal_data)
    
    async def _evaluate_proposal_in_context(self, proposal: Dict[str, Any],
                                          negotiation: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a proposal within the context of the negotiation."""
        # Simplified evaluation
        impact_score = proposal.get('impact_score', 0.5)
        confidence = proposal.get('confidence', 0.5)
        feasibility = proposal.get('feasibility', 0.5)
        
        # Calculate composite score
        score = (confidence * 0.4 + feasibility * 0.4 + (1 - impact_score) * 0.2)
        
        return {
            'score': score,
            'promising': score > 0.7,
            'concerns': []
        }
    
    async def _circulate_proposal(self, negotiation_id: str, proposal: Dict[str, Any]):
        """Circulate a proposal to all negotiation participants."""
        negotiation = self.active_negotiations[negotiation_id]
        
        for participant_id in negotiation['participants']:
            if participant_id != proposal.get('proposer_id'):
                await self.send_message(
                    participant_id,
                    MessageType.PROPOSAL,
                    {
                        'negotiation_id': negotiation_id,
                        'proposal': proposal,
                        'round': negotiation['current_round']
                    },
                    Priority.MEDIUM
                )
    
    async def _handle_counter_proposal(self, message: Message):
        """Handle a counter-proposal."""
        counter_proposal = message.content
        negotiation_id = counter_proposal.get('negotiation_id')
        
        logger.info(f"Received counter-proposal for negotiation {negotiation_id}")
        
        # Process as a new proposal
        await self._handle_negotiation_proposal(message)
    
    async def _handle_acceptance(self, message: Message):
        """Handle acceptance of a proposal."""
        acceptance_data = message.content
        negotiation_id = acceptance_data.get('negotiation_id')
        
        if negotiation_id in self.active_negotiations:
            negotiation = self.active_negotiations[negotiation_id]
            
            # Check if all participants have accepted
            if await self._check_consensus(negotiation_id):
                await self._finalize_negotiation(negotiation_id, 'consensus_reached')
    
    async def _handle_rejection(self, message: Message):
        """Handle rejection of a proposal."""
        rejection_data = message.content
        negotiation_id = rejection_data.get('negotiation_id')
        
        if negotiation_id in self.active_negotiations:
            negotiation = self.active_negotiations[negotiation_id]
            
            # Move to next round or terminate if max rounds reached
            negotiation['current_round'] += 1
            
            if negotiation['current_round'] > negotiation['max_rounds']:
                await self._finalize_negotiation(negotiation_id, 'max_rounds_exceeded')
    
    async def _check_consensus(self, negotiation_id: str) -> bool:
        """Check if consensus has been reached in a negotiation."""
        # Simplified consensus check
        negotiation = self.active_negotiations[negotiation_id]
        
        # In a real implementation, would check acceptance from all participants
        return len(negotiation['proposals']) > 0
    
    async def _finalize_negotiation(self, negotiation_id: str, outcome: str):
        """Finalize a negotiation session."""
        negotiation = self.active_negotiations[negotiation_id]
        negotiation['status'] = 'completed'
        negotiation['outcome'] = outcome
        negotiation['completed_at'] = datetime.now()
        
        logger.info(f"Negotiation {negotiation_id} finalized with outcome: {outcome}")
        
        # Archive negotiation
        self.negotiation_history.append(negotiation)
        del self.active_negotiations[negotiation_id]
        
        # Notify participants of outcome
        for participant_id in negotiation['participants']:
            await self.send_message(
                participant_id,
                MessageType.NEGOTIATION_END,
                {
                    'negotiation_id': negotiation_id,
                    'outcome': outcome,
                    'final_agreement': negotiation.get('final_agreement')
                },
                Priority.MEDIUM
            )

class AutonomousSchedulingSystem:
    """Main orchestrator for the autonomous scheduling system."""
    
    def __init__(self):
        """Initialize the autonomous scheduling system."""
        self.agents = {}
        self.message_router = asyncio.Queue()
        self.system_status = "initializing"
        self.performance_metrics = {
            'total_messages': 0,
            'conflicts_resolved': 0,
            'optimizations_completed': 0,
            'system_uptime': datetime.now()
        }
        
    async def initialize(self):
        """Initialize the scheduling system with all necessary agents."""
        logger.info("Initializing Autonomous Scheduling System")
        
        # Create director agent
        director = DirectorAgent()
        await self._register_agent(director)
        
        # Create conflict resolver
        conflict_resolver = ConflictResolverAgent()
        await self._register_agent(conflict_resolver)
        await director.register_agent(conflict_resolver)
        
        # Create negotiator
        negotiator = NegotiatorAgent()
        await self._register_agent(negotiator)
        await director.register_agent(negotiator)
        
        # Start message routing
        asyncio.create_task(self._message_routing_loop())
        
        self.system_status = "active"
        logger.info("Autonomous Scheduling System initialized successfully")
    
    async def _register_agent(self, agent: BaseAgent):
        """Register an agent in the system."""
        self.agents[agent.agent_id] = agent
        logger.info(f"Registered agent {agent.name} in system")
    
    async def start_agents(self):
        """Start all registered agents."""
        logger.info("Starting all agents")
        
        tasks = []
        for agent in self.agents.values():
            tasks.append(asyncio.create_task(agent.start()))
        
        # Also start the message routing
        tasks.append(asyncio.create_task(self._message_routing_loop()))
        
        await asyncio.gather(*tasks)
    
    async def _message_routing_loop(self):
        """Route messages between agents."""
        while self.system_status == "active":
            try:
                # Check all agent outboxes for messages
                for agent in self.agents.values():
                    while not agent.outbox.empty():
                        message = await agent.outbox.get()
                        await self._route_message(message)
                        self.performance_metrics['total_messages'] += 1
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
                
            except Exception as e:
                logger.error(f"Error in message routing: {e}")
    
    async def _route_message(self, message: Message):
        """Route a message to its intended recipient."""
        recipient_id = message.recipient_id
        
        if recipient_id in self.agents:
            await self.agents[recipient_id].receive_message(message)
        else:
            logger.warning(f"Message {message.id} has unknown recipient {recipient_id}")
    
    async def detect_and_resolve_conflict(self, conflict_data: Dict[str, Any]):
        """Trigger conflict detection and resolution."""
        # Find conflict resolver agent
        conflict_resolver = None
        for agent in self.agents.values():
            if agent.agent_type == AgentType.CONFLICT_RESOLVER:
                conflict_resolver = agent
                break
        
        if conflict_resolver:
            # Send conflict alert
            await conflict_resolver.receive_message(Message(
                id=str(uuid.uuid4()),
                sender_id="system",
                recipient_id=conflict_resolver.agent_id,
                message_type=MessageType.CONFLICT_ALERT,
                content=conflict_data,
                priority=Priority.HIGH,
                timestamp=datetime.now()
            ))
            
            logger.info(f"Conflict detection triggered for: {conflict_data.get('description')}")
        else:
            logger.error("No conflict resolver agent available")
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status."""
        agent_statuses = {}
        for agent_id, agent in self.agents.items():
            agent_statuses[agent_id] = agent.get_status()
        
        return {
            'system_status': self.system_status,
            'total_agents': len(self.agents),
            'performance_metrics': self.performance_metrics,
            'agents': agent_statuses,
            'uptime': str(datetime.now() - self.performance_metrics['system_uptime'])
        }
    
    async def shutdown(self):
        """Shutdown the autonomous scheduling system."""
        logger.info("Shutting down Autonomous Scheduling System")
        
        self.system_status = "shutting_down"
        
        # Stop all agents
        for agent in self.agents.values():
            await agent.stop()
        
        self.system_status = "stopped"
        logger.info("Autonomous Scheduling System shutdown complete")

# Example usage and testing
async def example_usage():
    """Example of how to use the autonomous scheduling system."""
    # Initialize the system
    system = AutonomousSchedulingSystem()
    await system.initialize()
    
    # Example conflict scenario
    conflict_data = {
        'conflict_id': str(uuid.uuid4()),
        'type': 'venue_double_booking',
        'severity': 'major',
        'description': 'Allen Fieldhouse double-booked for Kansas vs Kansas State',
        'affected_games': ['game_123', 'game_124'],
        'affected_constraints': ['venue_availability'],
        'suggested_resolutions': []
    }
    
    print("Autonomous Scheduling System Example")
    print("===================================")
    
    # Get initial system status
    status = system.get_system_status()
    print(f"System Status: {status['system_status']}")
    print(f"Total Agents: {status['total_agents']}")
    print()
    
    # Simulate conflict detection
    print("Simulating conflict detection...")
    await system.detect_and_resolve_conflict(conflict_data)
    
    # Let the system run for a short time to process the conflict
    await asyncio.sleep(2)
    
    # Get updated system status
    status = system.get_system_status()
    print(f"Messages processed: {status['performance_metrics']['total_messages']}")
    
    # Shutdown
    await system.shutdown()
    print("System shutdown complete")

if __name__ == "__main__":
    asyncio.run(example_usage())