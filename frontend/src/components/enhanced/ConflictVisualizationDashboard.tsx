import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdDateRange, MdLocationOn, MdGroup } from 'react-icons/md';
import { format } from 'date-fns';
import axios from 'axios';

// Types for conflicts and visualizations
interface Event {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  venue: string;
  teams: string[];
}

interface Conflict {
  id: string;
  type: 'venue' | 'team' | 'travel' | 'resource' | 'rest';
  subType?: string;
  severity: 'high' | 'medium' | 'low';
  events: Event[];
  venue?: string;
  team?: string;
  description: string;
  recommendedActions: string[];
  visualizationData?: any;
}

interface Resolution {
  conflictId: string;
  conflictType: string;
  resolutionType: string;
  event: {
    id: string;
    date: string;
    startTime: string;
  };
  change: {
    from: any;
    to: any;
  };
  description: string;
}

interface ConflictExplanation {
  success: boolean;
  conflictId: string;
  conflictType: string;
  explanation: string;
  businessImpact?: string;
  playerImpact?: string;
  competitiveImpact?: string;
  logisticalImpact?: string;
  performanceImpact?: string;
  operationalImpact?: string;
  recommendedActions: string[];
  priority: string;
  visualizationData?: any;
}

interface ConflictVisualizationDashboardProps {
  conflicts?: Conflict[];
  sportType?: string;
  scheduleId?: string;
  onResolveConflicts?: (resolutions: Resolution[]) => void;
  onApplyResolution?: (resolution: Resolution) => void;
}

/**
 * ConflictVisualizationDashboard displays detected scheduling conflicts with detailed explanations
 * and recommended resolutions, using visualizations to highlight issues.
 */
const ConflictVisualizationDashboard: React.FC<ConflictVisualizationDashboardProps> = ({
  conflicts = [],
  sportType = '',
  scheduleId = '',
  onResolveConflicts,
  onApplyResolution
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, ConflictExplanation>>({});
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  
  // Color mode for styling
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Get severity colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'yellow';
      default:
        return 'gray';
    }
  };
  
  // Get icon for conflict type
  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'venue':
        return MdLocationOn;
      case 'team':
        return MdGroup;
      case 'travel':
        return MdDateRange;
      case 'resource':
        return MdInfo;
      case 'rest':
        return MdWarning;
      default:
        return MdInfo;
    }
  };
  
  // Fetch explanations for all conflicts
  useEffect(() => {
    if (conflicts.length === 0) return;
    
    const fetchExplanations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const explanationsMap: Record<string, ConflictExplanation> = {};
        
        // For each conflict, fetch detailed explanation
        for (const conflict of conflicts) {
          try {
            const response = await axios.post('/api/conflicts/explain', {
              conflictId: conflict.id,
              conflictType: conflict.type,
              conflict
            });
            
            if (response.data && response.data.success) {
              explanationsMap[conflict.id] = response.data;
            }
          } catch (err) {
            console.error(`Failed to fetch explanation for conflict ${conflict.id}:`, err);
          }
        }
        
        setExplanations(explanationsMap);
      } catch (err) {
        console.error('Failed to fetch conflict explanations:', err);
        setError('Failed to load conflict explanations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExplanations();
  }, [conflicts]);
  
  // Fetch resolution recommendations
  const fetchResolutions = async () => {
    if (conflicts.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/conflicts/resolve', {
        conflicts,
        sportType,
        scheduleId
      });
      
      if (response.data && response.data.success) {
        setResolutions(response.data.resolutions || []);
        
        // Call parent callback if provided
        if (onResolveConflicts) {
          onResolveConflicts(response.data.resolutions || []);
        }
      } else {
        setError(response.data.error || 'Failed to generate conflict resolutions');
      }
    } catch (err) {
      console.error('Failed to fetch conflict resolutions:', err);
      setError('Failed to load conflict resolutions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply a specific resolution
  const handleApplyResolution = (resolution: Resolution) => {
    if (onApplyResolution) {
      onApplyResolution(resolution);
    }
  };
  
  // Group conflicts by type
  const conflictsByType: Record<string, Conflict[]> = {};
  conflicts.forEach(conflict => {
    if (!conflictsByType[conflict.type]) {
      conflictsByType[conflict.type] = [];
    }
    conflictsByType[conflict.type].push(conflict);
  });
  
  // Calculate counts for summary
  const summary = {
    total: conflicts.length,
    byType: Object.entries(conflictsByType).map(([type, typeConflicts]) => ({
      type,
      count: typeConflicts.length
    })),
    bySeverity: {
      high: conflicts.filter(c => c.severity === 'high').length,
      medium: conflicts.filter(c => c.severity === 'medium').length,
      low: conflicts.filter(c => c.severity === 'low').length
    }
  };
  
  return (
    <Box width="100%" p={4}>
      <Heading as="h1" size="xl" mb={4}>
        Conflict Visualization Dashboard
      </Heading>
      
      {/* Summary section */}
      <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg={cardBg}>
        <Heading as="h2" size="md" mb={3}>
          Conflict Summary
        </Heading>
        
        <Flex wrap="wrap" gap={4}>
          <Box flex="1" minW="200px">
            <Heading as="h3" size="sm" mb={2}>
              Total Conflicts
            </Heading>
            <Flex align="center">
              <Text fontSize="2xl" fontWeight="bold">
                {summary.total}
              </Text>
              {summary.total > 0 && (
                <Button 
                  ml={4} 
                  colorScheme="blue" 
                  size="sm"
                  onClick={fetchResolutions}
                  isLoading={loading}
                >
                  Resolve All
                </Button>
              )}
            </Flex>
          </Box>
          
          <Box flex="1" minW="200px">
            <Heading as="h3" size="sm" mb={2}>
              By Severity
            </Heading>
            <Flex gap={2} wrap="wrap">
              <Badge colorScheme="red" fontSize="sm" p={1}>
                High: {summary.bySeverity.high}
              </Badge>
              <Badge colorScheme="orange" fontSize="sm" p={1}>
                Medium: {summary.bySeverity.medium}
              </Badge>
              <Badge colorScheme="yellow" fontSize="sm" p={1}>
                Low: {summary.bySeverity.low}
              </Badge>
            </Flex>
          </Box>
          
          <Box flex="1" minW="200px">
            <Heading as="h3" size="sm" mb={2}>
              By Type
            </Heading>
            <Flex gap={2} wrap="wrap">
              {summary.byType.map(({ type, count }) => (
                <Badge key={type} fontSize="sm" p={1}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                </Badge>
              ))}
            </Flex>
          </Box>
        </Flex>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Loading state */}
      {loading && (
        <Flex justify="center" my={8}>
          <Spinner size="xl" />
        </Flex>
      )}
      
      {/* No conflicts state */}
      {!loading && conflicts.length === 0 && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          No conflicts detected in the current schedule.
        </Alert>
      )}
      
      {/* Conflicts by type in tabs */}
      {conflicts.length > 0 && (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>All ({conflicts.length})</Tab>
            {Object.entries(conflictsByType).map(([type, typeConflicts]) => (
              <Tab key={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)} ({typeConflicts.length})
              </Tab>
            ))}
            {resolutions.length > 0 && (
              <Tab>Resolutions ({resolutions.length})</Tab>
            )}
          </TabList>
          
          <TabPanels>
            {/* All conflicts tab */}
            <TabPanel>
              <Accordion allowMultiple>
                {conflicts.map(conflict => (
                  <ConflictCard 
                    key={conflict.id} 
                    conflict={conflict} 
                    explanation={explanations[conflict.id]}
                    relatedResolutions={resolutions.filter(r => r.conflictId === conflict.id)}
                    onApplyResolution={handleApplyResolution}
                  />
                ))}
              </Accordion>
            </TabPanel>
            
            {/* Tabs for each conflict type */}
            {Object.entries(conflictsByType).map(([type, typeConflicts]) => (
              <TabPanel key={type}>
                <Accordion allowMultiple>
                  {typeConflicts.map(conflict => (
                    <ConflictCard 
                      key={conflict.id} 
                      conflict={conflict} 
                      explanation={explanations[conflict.id]}
                      relatedResolutions={resolutions.filter(r => r.conflictId === conflict.id)}
                      onApplyResolution={handleApplyResolution}
                    />
                  ))}
                </Accordion>
              </TabPanel>
            ))}
            
            {/* Resolutions tab */}
            {resolutions.length > 0 && (
              <TabPanel>
                <Accordion allowMultiple>
                  {resolutions.map(resolution => (
                    <ResolutionCard 
                      key={`${resolution.conflictId}_${resolution.resolutionType}`}
                      resolution={resolution}
                      onApply={() => handleApplyResolution(resolution)}
                    />
                  ))}
                </Accordion>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

// Individual conflict card component
interface ConflictCardProps {
  conflict: Conflict;
  explanation?: ConflictExplanation;
  relatedResolutions: Resolution[];
  onApplyResolution: (resolution: Resolution) => void;
}

const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  explanation,
  relatedResolutions,
  onApplyResolution
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const severityColor = getSeverityColor(conflict.severity);
  const ConflictIcon = getConflictIcon(conflict.type);
  
  return (
    <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4} overflow="hidden">
      <h2>
        <AccordionButton _expanded={{ bg: `${severityColor}.50` }}>
          <Box flex="1" textAlign="left" py={1}>
            <Flex align="center">
              <Box>
                <ConflictIcon size={20} />
              </Box>
              <Text ml={2} fontWeight="bold">
                {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Conflict
                {conflict.subType && ` (${conflict.subType})`}
              </Text>
              <Badge ml={2} colorScheme={severityColor}>
                {conflict.severity}
              </Badge>
              {conflict.team && (
                <Badge ml={2} colorScheme="purple">
                  {conflict.team}
                </Badge>
              )}
              {conflict.venue && (
                <Badge ml={2} colorScheme="blue">
                  {conflict.venue}
                </Badge>
              )}
            </Flex>
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4} bg={cardBg}>
        <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
          <TabList>
            <Tab>Details</Tab>
            <Tab>Explanation</Tab>
            <Tab>Timeline</Tab>
            {relatedResolutions.length > 0 && (
              <Tab>Resolutions ({relatedResolutions.length})</Tab>
            )}
          </TabList>
          
          <TabPanels>
            {/* Details tab */}
            <TabPanel>
              <Box mb={4}>
                <Heading as="h4" size="sm" mb={2}>
                  Description
                </Heading>
                <Text>{conflict.description}</Text>
              </Box>
              
              <Box mb={4}>
                <Heading as="h4" size="sm" mb={2}>
                  Events Involved
                </Heading>
                <List spacing={2}>
                  {conflict.events.map((event, index) => (
                    <ListItem key={index}>
                      <Flex flexWrap="wrap" gap={1}>
                        <Text fontWeight="bold">
                          {format(new Date(`${event.date}T${event.startTime}`), 'MMM d, yyyy h:mm a')}
                        </Text>
                        <Text> • {event.venue} • </Text>
                        <Text>{event.teams.join(' vs ')}</Text>
                      </Flex>
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              <Box>
                <Heading as="h4" size="sm" mb={2}>
                  Recommended Actions
                </Heading>
                <List spacing={2}>
                  {conflict.recommendedActions.map((action, index) => (
                    <ListItem key={index}>
                      <ListIcon as={MdCheckCircle} color="green.500" />
                      {action}
                    </ListItem>
                  ))}
                </List>
              </Box>
            </TabPanel>
            
            {/* Explanation tab */}
            <TabPanel>
              {explanation ? (
                <>
                  <Box mb={4}>
                    <Heading as="h4" size="sm" mb={2}>
                      Explanation
                    </Heading>
                    <Text>{explanation.explanation}</Text>
                  </Box>
                  
                  {explanation.businessImpact && (
                    <Box mb={4}>
                      <Heading as="h4" size="sm" mb={2}>
                        Business Impact
                      </Heading>
                      <Text>{explanation.businessImpact}</Text>
                    </Box>
                  )}
                  
                  {explanation.playerImpact && (
                    <Box mb={4}>
                      <Heading as="h4" size="sm" mb={2}>
                        Player Impact
                      </Heading>
                      <Text>{explanation.playerImpact}</Text>
                    </Box>
                  )}
                  
                  {explanation.competitiveImpact && (
                    <Box mb={4}>
                      <Heading as="h4" size="sm" mb={2}>
                        Competitive Impact
                      </Heading>
                      <Text>{explanation.competitiveImpact}</Text>
                    </Box>
                  )}
                  
                  {explanation.logisticalImpact && (
                    <Box mb={4}>
                      <Heading as="h4" size="sm" mb={2}>
                        Logistical Impact
                      </Heading>
                      <Text>{explanation.logisticalImpact}</Text>
                    </Box>
                  )}
                  
                  {explanation.recommendedActions && (
                    <Box>
                      <Heading as="h4" size="sm" mb={2}>
                        AI Recommendations
                      </Heading>
                      <List spacing={2}>
                        {explanation.recommendedActions.map((action, index) => (
                          <ListItem key={index}>
                            <ListIcon as={MdCheckCircle} color="green.500" />
                            {action}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </>
              ) : (
                <Text>No detailed explanation available for this conflict.</Text>
              )}
            </TabPanel>
            
            {/* Timeline visualization tab */}
            <TabPanel>
              <Box height="200px" mb={4} position="relative" borderWidth="1px" borderRadius="md" p={2}>
                {conflict.events.map((event, index) => {
                  const startTime = new Date(`${event.date}T${event.startTime}`).getHours();
                  const endTime = event.endTime 
                    ? new Date(`${event.date}T${event.endTime}`).getHours() 
                    : startTime + 3;
                  const duration = endTime - startTime;
                  
                  // Simple timeline visualization - in a real app, use a proper timeline library
                  return (
                    <Box
                      key={index}
                      position="absolute"
                      top={`${(index * 30) + 20}px`}
                      left={`${(startTime / 24) * 100}%`}
                      width={`${(duration / 24) * 100}%`}
                      height="25px"
                      bg={index % 2 === 0 ? "blue.200" : "purple.200"}
                      borderRadius="md"
                      p={1}
                    >
                      <Text fontSize="xs" noOfLines={1}>
                        {event.teams.join(' vs ')} - {event.venue}
                      </Text>
                    </Box>
                  );
                })}
                <Box position="absolute" bottom="5px" left="0" right="0" height="1px" bg="gray.300" />
                {/* Time markers */}
                {[0, 6, 12, 18, 24].map(hour => (
                  <Box
                    key={hour}
                    position="absolute"
                    bottom="-15px"
                    left={`${(hour / 24) * 100}%`}
                    transform="translateX(-50%)"
                  >
                    <Text fontSize="xs">{hour}:00</Text>
                  </Box>
                ))}
              </Box>
              <Text fontSize="sm" textAlign="center" fontStyle="italic">
                Simple visualization. Events may span across days.
              </Text>
            </TabPanel>
            
            {/* Resolutions tab */}
            {relatedResolutions.length > 0 && (
              <TabPanel>
                <List spacing={4}>
                  {relatedResolutions.map((resolution, index) => (
                    <ListItem key={index} p={3} borderWidth="1px" borderRadius="md">
                      <Heading as="h4" size="sm" mb={2}>
                        {resolution.resolutionType
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </Heading>
                      <Text mb={3}>{resolution.description}</Text>
                      
                      <Flex mt={2} wrap="wrap" gap={3}>
                        <Box flex="1" minW="200px">
                          <Heading as="h5" size="xs" mb={1}>
                            From
                          </Heading>
                          <Text fontSize="sm">
                            {Object.entries(resolution.change.from)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </Text>
                        </Box>
                        
                        <Box flex="1" minW="200px">
                          <Heading as="h5" size="xs" mb={1}>
                            To
                          </Heading>
                          <Text fontSize="sm">
                            {Object.entries(resolution.change.to)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </Text>
                        </Box>
                      </Flex>
                      
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        mt={3}
                        onClick={() => onApplyResolution(resolution)}
                      >
                        Apply Resolution
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </AccordionPanel>
    </AccordionItem>
  );
};

// Resolution card component
interface ResolutionCardProps {
  resolution: Resolution;
  onApply: () => void;
}

const ResolutionCard: React.FC<ResolutionCardProps> = ({ resolution, onApply }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4} overflow="hidden">
      <h2>
        <AccordionButton _expanded={{ bg: "blue.50" }}>
          <Box flex="1" textAlign="left" py={1}>
            <Flex align="center">
              <Box>
                <MdCheckCircle size={20} />
              </Box>
              <Text ml={2} fontWeight="bold">
                {resolution.resolutionType
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Text>
              <Badge ml={2} colorScheme="green">
                {resolution.conflictType}
              </Badge>
            </Flex>
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4} bg={cardBg}>
        <Box mb={4}>
          <Heading as="h4" size="sm" mb={2}>
            Description
          </Heading>
          <Text>{resolution.description}</Text>
        </Box>
        
        <Flex mt={4} wrap="wrap" gap={3}>
          <Box flex="1" minW="200px">
            <Heading as="h5" size="xs" mb={1}>
              From
            </Heading>
            <Text fontSize="sm">
              {Object.entries(resolution.change.from)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </Text>
          </Box>
          
          <Box flex="1" minW="200px">
            <Heading as="h5" size="xs" mb={1}>
              To
            </Heading>
            <Text fontSize="sm">
              {Object.entries(resolution.change.to)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </Text>
          </Box>
        </Flex>
        
        <Button 
          size="sm" 
          colorScheme="blue" 
          mt={4}
          onClick={onApply}
        >
          Apply Resolution
        </Button>
      </AccordionPanel>
    </AccordionItem>
  );
};

export default ConflictVisualizationDashboard;
