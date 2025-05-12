"""
Knowledge Graph components for the HELiiX Intelligence Engine.

This package provides knowledge graph functionality for representing and
querying domain knowledge in the scheduling context.
"""

from intelligence_engine.knowledge_graph.graph_model import (
    Entity,
    KnowledgeGraph,
    SchedulingKnowledgeGraph
)
from intelligence_engine.knowledge_graph.schedule_knowledge_enhancer import (
    ScheduleKnowledgeEnhancer
)

# Import the database adapter for Knowledge Graph persistence
try:
    from intelligence_engine.db.knowledge_graph_adapter import KnowledgeGraphAdapter
except ImportError:
    # Handle case where database module is not available
    import logging
    logging.getLogger('intelligence_engine.knowledge_graph').warning(
        "KnowledgeGraphAdapter could not be imported. Database persistence will not be available."
    )
