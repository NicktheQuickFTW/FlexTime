import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  useColorModeValue,
  Stack,
  RadioGroup,
  Radio,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Collapse,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { MdExpandMore, MdExpandLess, MdDone, MdTimeline } from 'react-icons/md';
import axios from 'axios';

// Types
interface Event {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
}

interface Conflict {
  id: string;
  type: 'venue' | 'team' | 'travel' | 'resource' | 'rest';
  subType?: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface Resolution {
  id: string;
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
  confidence: number; // 0-1 confidence score
  impact: {
    description: string;
    severity: 'high' | 'medium' | 'low';
  };
}

interface ResolutionRecommendationWidgetProps {
  conflicts: Conflict[];
  schedule: Event[];
  sportType: string;
  scheduleId: string;
  onApplyResolutions: (resolutions: Resolution[], newSchedule: Event[]) => void;
  onPreviewSchedule?: (resolutions: Resolution[], newSchedule: Event[]) => void;
}

/**
 * ResolutionRecommendationWidget presents AI-recommended solutions for scheduling conflicts
 * and allows users to select and apply these recommendations to resolve conflicts.
 */
const ResolutionRecommendationWidget: React.FC<ResolutionRecommendationWidgetProps> = ({
  conflicts,
  schedule,
  sportType,
  scheduleId,
  onApplyResolutions,
  onPreviewSchedule
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [selectedResolutions, setSelectedResolutions] = useState<Record<string, string>>({});
  const [modifiedSchedule, setModifiedSchedule] = useState<Event[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const { isOpen: isDetailsOpen, onToggle: onToggleDetails } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onOpenPreview, onClose: onClosePreview } = useDisclosure();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Group resolutions by conflict
  const resolutionsByConflict: Record<string, Resolution[]> = {};
  
  resolutions.forEach(resolution => {
    if (!resolutionsByConflict[resolution.conflictId]) {
      resolutionsByConflict[resolution.conflictId] = [];
    }
    resolutionsByConflict[resolution.conflictId].push(resolution);
  });
  
  // Fetch resolutions when conflicts change
  useEffect(() => {
    if (conflicts.length === 0) return;
    
    const fetchResolutions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post('/api/conflicts/resolve', {
          conflicts,
          schedule,
          sportType,
          scheduleId
        });
        
        if (response.data && response.data.success) {
          setResolutions(response.data.resolutions || []);
          setModifiedSchedule(response.data.modifiedSchedule || null);
          
          // Initialize selected resolutions
          const initialSelections: Record<string, string> = {};
          
          // For each conflict, select the highest confidence resolution
          Object.entries(groupResolutionsByConflict(response.data.resolutions)).forEach(
            ([conflictId, conflictResolutions]) => {
              if (conflictResolutions.length > 0) {
                // Sort by confidence and select highest
                const sortedResolutions = [...conflictResolutions].sort(
                  (a, b) => b.confidence - a.confidence
                );
                initialSelections[conflictId] = sortedResolutions[0].id;
              }
            }
          );
          
          setSelectedResolutions(initialSelections);
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
    
    fetchResolutions();
  }, [conflicts, schedule, sportType, scheduleId]);
  
  // Group resolutions by conflict for UI organization
  const groupResolutionsByConflict = (resolutionsList: Resolution[]) => {
    const grouped: Record<string, Resolution[]> = {};
    
    resolutionsList.forEach(resolution => {
      if (!grouped[resolution.conflictId]) {
        grouped[resolution.conflictId] = [];
      }
      grouped[resolution.conflictId].push(resolution);
    });
    
    return grouped;
  };
  
  // Get conflict by ID
  const getConflictById = (conflictId: string) => {
    return conflicts.find(c => c.id === conflictId);
  };
  
  // Handle resolution selection
  const handleResolutionSelect = (conflictId: string, resolutionId: string) => {
    setSelectedResolutions(prev => ({
      ...prev,
      [conflictId]: resolutionId
    }));
  };
  
  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Get color based on confidence
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'teal';
    if (confidence >= 0.4) return 'orange';
    return 'red';
  };
  
  // Get color for severity
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
  
  // Generate the preview of the modified schedule
  const handleGeneratePreview = async () => {
    if (modifiedSchedule) {
      setPreviewMode(true);
      onOpenPreview();
      
      if (onPreviewSchedule) {
        // Get selected resolution objects
        const selectedResolutionObjects = Object.entries(selectedResolutions).map(
          ([conflictId, resolutionId]) => {
            return resolutions.find(r => r.id === resolutionId);
          }
        ).filter(Boolean) as Resolution[];
        
        onPreviewSchedule(selectedResolutionObjects, modifiedSchedule);
      }
    }
  };
  
  // Apply selected resolutions
  const handleApplyResolutions = () => {
    if (modifiedSchedule) {
      // Get selected resolution objects
      const selectedResolutionObjects = Object.entries(selectedResolutions).map(
        ([conflictId, resolutionId]) => {
          return resolutions.find(r => r.id === resolutionId);
        }
      ).filter(Boolean) as Resolution[];
      
      onApplyResolutions(selectedResolutionObjects, modifiedSchedule);
      onClosePreview();
    }
  };
  
  // Count selected resolutions
  const selectedCount = Object.keys(selectedResolutions).length;
  
  // If no conflicts, show a simple message
  if (conflicts.length === 0) {
    return (
      <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <AlertDescription>No conflicts to resolve in the current schedule.</AlertDescription>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box p={0} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
      <Box px={4} py={3} bg={headerBg} borderTopRadius="md">
        <Flex justify="space-between" align="center">
          <Heading size="md">Resolution Recommendations</Heading>
          
          <Flex align="center">
            {loading ? (
              <Spinner size="sm" mr={2} />
            ) : (
              <Badge colorScheme="blue" mr={2}>
                {selectedCount}/{conflicts.length} Conflicts
              </Badge>
            )}
            
            <Button 
              size="sm" 
              colorScheme="blue"
              isDisabled={loading || selectedCount === 0 || !modifiedSchedule}
              onClick={handleGeneratePreview}
              leftIcon={<MdTimeline />}
            >
              Preview
            </Button>
          </Flex>
        </Flex>
      </Box>
      
      {error && (
        <Alert status="error" my={2} mx={4}>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <Flex justify="center" align="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Box>
          {Object.entries(resolutionsByConflict).map(([conflictId, conflictResolutions]) => {
            const conflict = getConflictById(conflictId);
            if (!conflict) return null;
            
            return (
              <Box key={conflictId} p={4} borderTopWidth="1px" borderColor={borderColor}>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Box>
                    <Flex align="center">
                      <Heading size="sm">
                        {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Conflict
                      </Heading>
                      <Badge ml={2} colorScheme={getSeverityColor(conflict.severity)}>
                        {conflict.severity}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color="gray.500" mt={1}>{conflict.description}</Text>
                  </Box>
                </Flex>
                
                <RadioGroup 
                  onChange={(value) => handleResolutionSelect(conflictId, value)}
                  value={selectedResolutions[conflictId] || ''}
                >
                  <Stack>
                    {conflictResolutions.map((resolution, index) => (
                      <Flex 
                        key={resolution.id}
                        p={3}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        _hover={{ bg: 'gray.50' }}
                        transition="background 0.2s"
                        align="center"
                      >
                        <Radio value={resolution.id}>
                          <Box ml={2}>
                            <Text fontWeight="medium">{resolution.description}</Text>
                            <Flex align="center" mt={1}>
                              <Badge 
                                colorScheme={getConfidenceColor(resolution.confidence)}
                                mr={2}
                              >
                                {formatConfidence(resolution.confidence)}
                              </Badge>
                              
                              <Text fontSize="xs" color="gray.500">
                                Impact: {resolution.impact.description}
                              </Text>
                            </Flex>
                          </Box>
                        </Radio>
                      </Flex>
                    ))}
                  </Stack>
                </RadioGroup>
              </Box>
            );
          })}
          
          <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
            <Button 
              colorScheme="blue" 
              isFullWidth
              onClick={onToggleDetails}
              rightIcon={isDetailsOpen ? <MdExpandLess /> : <MdExpandMore />}
              variant="outline"
              mb={3}
            >
              {isDetailsOpen ? "Hide Resolution Details" : "Show Resolution Details"}
            </Button>
            
            <Collapse in={isDetailsOpen} animateOpacity>
              <Box mt={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
                <Table variant="simple" size="sm">
                  <Thead bg={headerBg}>
                    <Tr>
                      <Th>Conflict</Th>
                      <Th>Resolution</Th>
                      <Th>Changes</Th>
                      <Th isNumeric>Confidence</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(selectedResolutions).map(([conflictId, resolutionId]) => {
                      const resolution = resolutions.find(r => r.id === resolutionId);
                      const conflict = getConflictById(conflictId);
                      
                      if (!resolution || !conflict) return null;
                      
                      return (
                        <Tr key={conflictId}>
                          <Td>
                            <Badge colorScheme={getSeverityColor(conflict.severity)}>
                              {conflict.type}
                            </Badge>
                          </Td>
                          <Td>{resolution.resolutionType.replace(/_/g, ' ')}</Td>
                          <Td>
                            <Text fontSize="xs">
                              {Object.entries(resolution.change.from).map(([key, value]) => 
                                `${key}: ${value} → ${resolution.change.to[key]}`
                              ).join(', ')}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Badge colorScheme={getConfidenceColor(resolution.confidence)}>
                              {formatConfidence(resolution.confidence)}
                            </Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </Collapse>
            
            <Button 
              mt={4}
              colorScheme="blue" 
              size="lg"
              isFullWidth
              onClick={handleGeneratePreview}
              isDisabled={loading || selectedCount === 0 || !modifiedSchedule}
              leftIcon={<MdDone />}
            >
              Apply {selectedCount} Resolution{selectedCount !== 1 ? 's' : ''}
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onClosePreview} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Preview with Resolutions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {modifiedSchedule ? (
              <Box>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <Text>
                    Preview of schedule with {selectedCount} applied resolution{selectedCount !== 1 ? 's' : ''}.
                    {conflicts.length - selectedCount > 0 && 
                      ` ${conflicts.length - selectedCount} conflict${
                        conflicts.length - selectedCount !== 1 ? 's' : ''
                      } remain unresolved.`
                    }
                  </Text>
                </Alert>
                
                <Box mb={4} maxH="400px" overflowY="auto">
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg={headerBg} zIndex={1}>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Time</Th>
                        <Th>Teams</Th>
                        <Th>Venue</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {modifiedSchedule.map((event, index) => (
                        <Tr key={event.id || index}>
                          <Td>{event.date}</Td>
                          <Td>{event.startTime}</Td>
                          <Td>{event.homeTeam} vs {event.awayTeam}</Td>
                          <Td>{event.venue}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            ) : (
              <Alert status="error">
                <AlertIcon />
                <Text>Failed to generate schedule preview.</Text>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClosePreview}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleApplyResolutions}
              isDisabled={!modifiedSchedule}
            >
              Apply Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResolutionRecommendationWidget;
