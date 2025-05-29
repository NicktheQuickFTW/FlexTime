/**
 * Knowledge Graph Visualizer
 * 
 * This component provides visualization tools for rendering Knowledge Graph insights,
 * allowing users to explore the structured knowledge representation and relationships
 * powered by Context7.
 */

const d3 = require('d3');
const logger = require('../../utils/logger');

/**
 * Knowledge Graph Visualizer Component
 */
class KnowledgeGraphVisualizer {
  /**
   * Create a new Knowledge Graph Visualizer
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      containerSelector: '#knowledge-graph-container',
      width: 800,
      height: 600,
      nodeRadius: 8,
      highlightRadius: 12,
      linkDistance: 150,
      chargeStrength: -300,
      transitionDuration: 500,
      colorScheme: d3.schemeCategory10,
      entityTypeColors: {
        team: '#1f77b4',
        venue: '#ff7f0e',
        game: '#2ca02c',
        constraint: '#d62728',
        schedule: '#9467bd',
        conference: '#8c564b',
        season: '#e377c2'
      },
      ...config
    };
    
    this.container = null;
    this.svg = null;
    this.simulation = null;
    this.graphData = { nodes: [], links: [] };
    this.nodeElements = null;
    this.linkElements = null;
    this.tooltipDiv = null;
    
    this.selectedNode = null;
    this.filterOptions = {
      entityTypes: null,
      relationshipTypes: null,
      searchText: null
    };
    
    this.initialized = false;
    
    logger.info('Knowledge Graph Visualizer created');
  }
  
  /**
   * Initialize the visualizer
   * 
   * @returns {boolean} Whether initialization was successful
   */
  initialize() {
    try {
      logger.info('Initializing Knowledge Graph Visualizer');
      
      // Check if d3 is available
      if (!d3) {
        logger.error('D3.js library is required for Knowledge Graph Visualizer');
        return false;
      }
      
      // Set initialized flag
      this.initialized = true;
      
      logger.info('Knowledge Graph Visualizer initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Knowledge Graph Visualizer: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Set up the visualization container
   * 
   * @param {string|Element} container - Container element or selector
   * @returns {boolean} Whether setup was successful
   */
  setup(container) {
    try {
      // Get container element
      if (typeof container === 'string') {
        this.container = document.querySelector(container);
      } else {
        this.container = container;
      }
      
      if (!this.container) {
        logger.error('Container element not found');
        return false;
      }
      
      // Clear container
      this.container.innerHTML = '';
      
      // Set dimensions
      const width = this.config.width || this.container.clientWidth;
      const height = this.config.height || this.container.clientHeight;
      
      // Create SVG element
      this.svg = d3.select(this.container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'knowledge-graph-svg');
      
      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          this.svg.select('g').attr('transform', event.transform);
        });
      
      this.svg.call(zoom);
      
      // Create group for graph elements
      this.svgGroup = this.svg.append('g');
      
      // Create tooltip
      this.tooltipDiv = d3.select(this.container)
        .append('div')
        .attr('class', 'knowledge-graph-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '5px')
        .style('padding', '10px')
        .style('pointer-events', 'none')
        .style('z-index', 1000);
      
      // Initialize force simulation
      this.simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(this.config.linkDistance))
        .force('charge', d3.forceManyBody().strength(this.config.chargeStrength))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide(this.config.nodeRadius * 1.5));
      
      logger.info('Knowledge Graph Visualizer setup complete');
      return true;
    } catch (error) {
      logger.error(`Failed to set up Knowledge Graph Visualizer: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Render the knowledge graph
   * 
   * @param {Object} data - Graph data with nodes and links
   * @returns {boolean} Whether rendering was successful
   */
  render(data) {
    try {
      if (!this.initialized || !this.svg) {
        logger.error('Knowledge Graph Visualizer not initialized or set up');
        return false;
      }
      
      if (!data || !data.nodes || !data.links) {
        logger.error('Invalid graph data');
        return false;
      }
      
      // Store graph data
      this.graphData = data;
      
      // Apply filters
      const filteredData = this._applyFilters(data);
      
      // Clear previous graph
      this.svgGroup.selectAll('*').remove();
      
      // Create arrow marker for directed links
      this.svgGroup.append('defs').selectAll('marker')
        .data(['end'])
        .enter().append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', this.config.nodeRadius + 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');
      
      // Create links
      this.linkElements = this.svgGroup.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(filteredData.links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrow)');
      
      // Create link labels
      this.linkLabelElements = this.svgGroup.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(filteredData.links)
        .enter().append('text')
        .attr('class', 'link-label')
        .attr('text-anchor', 'middle')
        .attr('dy', -5)
        .text(d => d.type)
        .style('font-size', '8px')
        .style('pointer-events', 'none')
        .style('fill', '#555');
      
      // Create nodes
      this.nodeElements = this.svgGroup.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(filteredData.nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', this.config.nodeRadius)
        .attr('fill', d => this._getNodeColor(d))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .call(this._setupDragBehavior())
        .on('mouseover', this._handleNodeMouseOver.bind(this))
        .on('mouseout', this._handleNodeMouseOut.bind(this))
        .on('click', this._handleNodeClick.bind(this));
      
      // Create node labels
      this.labelElements = this.svgGroup.append('g')
        .attr('class', 'node-labels')
        .selectAll('text')
        .data(filteredData.nodes)
        .enter().append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', -15)
        .text(d => d.name || d.id)
        .style('font-size', '10px')
        .style('pointer-events', 'none');
      
      // Update simulation
      this.simulation
        .nodes(filteredData.nodes)
        .on('tick', this._handleSimulationTick.bind(this));
      
      this.simulation.force('link')
        .links(filteredData.links);
      
      // Restart simulation
      this.simulation.alpha(1).restart();
      
      logger.info(`Rendered Knowledge Graph with ${filteredData.nodes.length} nodes and ${filteredData.links.length} links`);
      return true;
    } catch (error) {
      logger.error(`Failed to render Knowledge Graph: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Update visualization filters
   * 
   * @param {Object} filterOptions - Filter options
   * @returns {boolean} Whether filter update was successful
   */
  updateFilters(filterOptions) {
    try {
      if (filterOptions) {
        this.filterOptions = {
          ...this.filterOptions,
          ...filterOptions
        };
      }
      
      // Apply filters and re-render
      if (this.graphData.nodes.length > 0) {
        this.render(this.graphData);
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to update filters: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Highlight selected nodes and their connections
   * 
   * @param {string|Object} node - Node ID or node object to highlight
   * @returns {boolean} Whether highlighting was successful
   */
  highlightNode(node) {
    try {
      if (!this.nodeElements) {
        return false;
      }
      
      const nodeId = typeof node === 'string' ? node : node?.id;
      
      if (!nodeId) {
        return false;
      }
      
      // Find the node
      const targetNode = this.graphData.nodes.find(n => n.id === nodeId);
      
      if (!targetNode) {
        return false;
      }
      
      // Set as selected node
      this.selectedNode = targetNode;
      
      // Find connected links and nodes
      const connectedLinks = this.graphData.links.filter(
        link => link.source.id === nodeId || link.target.id === nodeId
      );
      
      const connectedNodeIds = new Set();
      connectedLinks.forEach(link => {
        connectedNodeIds.add(link.source.id);
        connectedNodeIds.add(link.target.id);
      });
      
      // Update visual elements
      this.nodeElements
        .attr('r', d => (d.id === nodeId ? this.config.highlightRadius : this.config.nodeRadius))
        .attr('opacity', d => (d.id === nodeId || connectedNodeIds.has(d.id) ? 1 : 0.3));
      
      this.linkElements
        .attr('opacity', d => (
          d.source.id === nodeId || d.target.id === nodeId ? 0.9 : 0.1
        ))
        .attr('stroke-width', d => (
          d.source.id === nodeId || d.target.id === nodeId ? 2 : 1
        ));
      
      this.labelElements
        .attr('opacity', d => (d.id === nodeId || connectedNodeIds.has(d.id) ? 1 : 0.3));
      
      this.linkLabelElements
        .attr('opacity', d => (
          d.source.id === nodeId || d.target.id === nodeId ? 1 : 0.1
        ));
      
      logger.info(`Highlighted node: ${nodeId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to highlight node: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Clear node highlighting
   * 
   * @returns {boolean} Whether clearing was successful
   */
  clearHighlight() {
    try {
      if (!this.nodeElements) {
        return false;
      }
      
      // Reset visual elements
      this.nodeElements
        .attr('r', this.config.nodeRadius)
        .attr('opacity', 1);
      
      this.linkElements
        .attr('opacity', 0.6)
        .attr('stroke-width', 1.5);
      
      this.labelElements
        .attr('opacity', 1);
      
      this.linkLabelElements
        .attr('opacity', 1);
      
      // Clear selected node
      this.selectedNode = null;
      
      logger.info('Cleared node highlights');
      return true;
    } catch (error) {
      logger.error(`Failed to clear highlight: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Export graph data as JSON
   * 
   * @returns {Object} Graph data
   */
  exportGraphData() {
    return JSON.parse(JSON.stringify(this.graphData));
  }
  
  /**
   * Apply filters to graph data
   * 
   * @private
   * @param {Object} data - Graph data
   * @returns {Object} Filtered graph data
   */
  _applyFilters(data) {
    let filteredNodes = [...data.nodes];
    let filteredLinks = [...data.links];
    
    // Filter by entity type
    if (this.filterOptions.entityTypes && this.filterOptions.entityTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        this.filterOptions.entityTypes.includes(node.type)
      );
      
      // Keep only links where both source and target are in filtered nodes
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredLinks = filteredLinks.filter(link => 
        nodeIds.has(link.source.id || link.source) && 
        nodeIds.has(link.target.id || link.target)
      );
    }
    
    // Filter by relationship type
    if (this.filterOptions.relationshipTypes && this.filterOptions.relationshipTypes.length > 0) {
      filteredLinks = filteredLinks.filter(link => 
        this.filterOptions.relationshipTypes.includes(link.type)
      );
      
      // Keep only nodes that are connected by the filtered links
      const nodeIdsInLinks = new Set();
      filteredLinks.forEach(link => {
        nodeIdsInLinks.add(link.source.id || link.source);
        nodeIdsInLinks.add(link.target.id || link.target);
      });
      
      filteredNodes = filteredNodes.filter(node => nodeIdsInLinks.has(node.id));
    }
    
    // Filter by search text
    if (this.filterOptions.searchText) {
      const searchRegex = new RegExp(this.filterOptions.searchText, 'i');
      
      filteredNodes = filteredNodes.filter(node => 
        searchRegex.test(node.id) || 
        searchRegex.test(node.name) || 
        searchRegex.test(node.type)
      );
      
      // Keep only links where both source and target are in filtered nodes
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredLinks = filteredLinks.filter(link => 
        nodeIds.has(link.source.id || link.source) && 
        nodeIds.has(link.target.id || link.target)
      );
    }
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }
  
  /**
   * Get color for a node based on its type
   * 
   * @private
   * @param {Object} node - Node object
   * @returns {string} Color in hex format
   */
  _getNodeColor(node) {
    if (node.color) {
      return node.color;
    }
    
    if (node.type && this.config.entityTypeColors[node.type]) {
      return this.config.entityTypeColors[node.type];
    }
    
    // Fallback to d3 color scheme
    const typeIndex = node.type ? 
      Object.keys(this.config.entityTypeColors).indexOf(node.type) % this.config.colorScheme.length :
      0;
    
    return this.config.colorScheme[typeIndex];
  }
  
  /**
   * Set up drag behavior for nodes
   * 
   * @private
   * @returns {d3.drag} D3 drag behavior
   */
  _setupDragBehavior() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }
  
  /**
   * Handle node mouseover event
   * 
   * @private
   * @param {Event} event - Mouse event
   * @param {Object} d - Node data
   */
  _handleNodeMouseOver(event, d) {
    // Show tooltip
    this.tooltipDiv.transition()
      .duration(200)
      .style('opacity', 0.9);
    
    const tooltipContent = this._generateNodeTooltip(d);
    
    this.tooltipDiv.html(tooltipContent)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
    
    // Highlight node
    d3.select(event.currentTarget)
      .attr('r', this.config.highlightRadius)
      .attr('stroke', '#000')
      .attr('stroke-width', 2);
  }
  
  /**
   * Handle node mouseout event
   * 
   * @private
   * @param {Event} event - Mouse event
   * @param {Object} d - Node data
   */
  _handleNodeMouseOut(event, d) {
    // Hide tooltip
    this.tooltipDiv.transition()
      .duration(500)
      .style('opacity', 0);
    
    // Reset node appearance if not selected
    if (!this.selectedNode || this.selectedNode.id !== d.id) {
      d3.select(event.currentTarget)
        .attr('r', this.config.nodeRadius)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
    }
  }
  
  /**
   * Handle node click event
   * 
   * @private
   * @param {Event} event - Mouse event
   * @param {Object} d - Node data
   */
  _handleNodeClick(event, d) {
    // Toggle node selection
    if (this.selectedNode && this.selectedNode.id === d.id) {
      this.clearHighlight();
    } else {
      this.highlightNode(d);
    }
    
    // Trigger custom event
    const clickEvent = new CustomEvent('nodeclicked', {
      detail: { node: d }
    });
    this.container.dispatchEvent(clickEvent);
  }
  
  /**
   * Generate tooltip content for a node
   * 
   * @private
   * @param {Object} node - Node data
   * @returns {string} HTML tooltip content
   */
  _generateNodeTooltip(node) {
    let content = `<div style="font-weight: bold">${node.name || node.id}</div>`;
    content += `<div>Type: ${node.type || 'Unknown'}</div>`;
    
    // Add properties if available
    if (node.properties) {
      content += '<hr style="margin: 5px 0;" />';
      content += '<div style="font-size: 12px;">';
      
      Object.entries(node.properties).forEach(([key, value]) => {
        // Skip complex objects or arrays
        if (typeof value !== 'object' && value !== null) {
          content += `<div><strong>${key}:</strong> ${value}</div>`;
        }
      });
      
      content += '</div>';
    }
    
    return content;
  }
  
  /**
   * Handle simulation tick event
   * 
   * @private
   */
  _handleSimulationTick() {
    // Update link positions
    this.linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    // Update link label positions
    this.linkLabelElements
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2);
    
    // Update node positions
    this.nodeElements
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
    
    // Update node label positions
    this.labelElements
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  }
  
  /**
   * Shutdown the visualizer
   * 
   * @returns {boolean} Whether shutdown was successful
   */
  shutdown() {
    try {
      // Stop simulation
      if (this.simulation) {
        this.simulation.stop();
      }
      
      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
      }
      
      // Reset properties
      this.svg = null;
      this.simulation = null;
      this.graphData = { nodes: [], links: [] };
      this.nodeElements = null;
      this.linkElements = null;
      this.tooltipDiv = null;
      
      this.initialized = false;
      
      logger.info('Knowledge Graph Visualizer shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Knowledge Graph Visualizer: ${error.message}`);
      return false;
    }
  }
}

module.exports = KnowledgeGraphVisualizer;
