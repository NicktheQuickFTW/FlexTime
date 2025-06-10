import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton
} from '@chakra-ui/react';
import { MdRefresh, MdFeedback } from 'react-icons/md';
import axios from 'axios';

// Import our enhanced components
import ConflictVisualizationDashboard from './ConflictVisualizationDashboard';
import ScheduleConfidenceIndicator from './ScheduleConfidenceIndicator';
import ResolutionRecommendationWidget from './ResolutionRecommendationWidget';
import FeedbackCollectionInterface from './FeedbackCollectionInterface';

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
  events: any[];
  recommendedActions: string[];
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
  confidence: number;
  impact: {
    description: string;
    severity: 'high' | 'medium' | 'low';
  };
}

interface ConfidenceData {
  score: number;
  sportType: string;
  dataPoints?: number;
  patternMatchRate?: number;
  factors?: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }[];
  modelUsed?: string;
  warnings?: string[];
}

interface FeedbackTarget {
  type: 'prediction' | 'resolution' | 'explanation';
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface EnhancedSchedulingInterfaceProps {
  sportType: string;
  scheduleId: string;
  initialSchedule?: Event[];
  onScheduleUpdate?: (newSchedule: Event[]) => void;
}

/**
 * EnhancedSchedulingInterface combines all the AI-enhanced scheduling components
 * into a unified interface for schedule creation, conflict resolution, and feedback.
 */
const EnhancedSchedulingInterface: React.FC<EnhancedSchedulingInterfaceProps> = ({
  sportType,
  scheduleId,
  initialSchedule = [],
  onScheduleUpdate
}) => {
  const [schedule, setSchedule] = useState<Event[]>(initialSchedule);
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [confidenceData, setConfidenceData] = useState<ConfidenceData | null>(null);
  const [feedbackTargets, setFeedbackTargets] = useState<FeedbackTarget[]>([]);

  // Drawer for feedback
  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const oddRowBg = useColorModeValue('gray.50', 'gray.700');
  
  // Load initial data
  // Load schedule data
  const loadScheduleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load schedule if not provided
      if (schedule.length === 0) {
        const scheduleResponse = await axios.get(`/api/schedules/${scheduleId}`);
        if (scheduleResponse.data && scheduleResponse.data.success) {
          setSchedule(scheduleResponse.data.schedule || []);
        }
      }
      
      // Load confidence data
      const confidenceResponse = await axios.get(`/api/schedules/${scheduleId}/confidence?sportType=${sportType}`);
      if (confidenceResponse.data && confidenceResponse.data.success) {
        setConfidenceData(confidenceResponse.data.confidenceData || null);
      }
      
      // Load feedback targets
      const feedbackResponse = await axios.get(`/api/schedules/${scheduleId}/feedback-targets`);
      if (feedbackResponse.data && feedbackResponse.data.success) {
        setFeedbackTargets(feedbackResponse.data.targets || []);
      }
    } catch (err) {
      console.error('Failed to load schedule data:', err);
      setError('Failed to load schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, sportType, schedule.length]);

  useEffect(() => {
    if (scheduleId) {
      loadScheduleData();
    }
  }, [scheduleId, loadScheduleData]);
  
  // Set initial schedule when prop changes
  useEffect(() => {
    if (initialSchedule && initialSchedule.length > 0) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);
  
  // Analyze schedule for conflicts
  const analyzeSchedule = async () => {
    if (schedule.length === 0) {
      setError('No schedule to analyze');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/conflicts/detect', {
        schedule,
        sportType,
        scheduleId
      });
      
      if (response.data && response.data.success) {
        setConflicts(response.data.conflicts || []);
        
        // Add conflict detection to feedback targets
        if (response.data.conflicts && response.data.conflicts.length > 0) {
          const newTarget: FeedbackTarget = {
            type: 'explanation',
            id: `conflict_detection_${Date.now()}`,
            name: 'Conflict Detection Results',
            description: `Detected ${response.data.conflicts.length} conflicts in the schedule`,
            createdAt: new Date().toISOString()
          };
          
          setFeedbackTargets(prev => [...prev, newTarget]);
        }
      } else {
        setError(response.data.error || 'Failed to analyze schedule');
      }
    } catch (err) {
      console.error('Failed to analyze schedule:', err);
      setError('Failed to analyze schedule. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Handle applying resolutions
  const handleApplyResolutions = (selectedResolutions: Resolution[], modifiedSchedule: Event[]) => {
    // Update schedule
    setSchedule(modifiedSchedule);
    
    // Add to resolutions
    setResolutions(selectedResolutions);
    
    // Add to feedback targets
    if (selectedResolutions.length > 0) {
      const newTarget: FeedbackTarget = {
        type: 'resolution',
        id: `resolutions_${Date.now()}`,
        name: 'Applied Schedule Resolutions',
        description: `Applied ${selectedResolutions.length} resolution(s) to the schedule`,
        createdAt: new Date().toISOString()
      };
      
      setFeedbackTargets(prev => [...prev, newTarget]);
    }
    
    // Callback to parent
    if (onScheduleUpdate) {
      onScheduleUpdate(modifiedSchedule);
    }
    
    // Clear conflicts that were resolved
    const resolvedConflictIds = new Set(selectedResolutions.map(r => r.conflictId));
    setConflicts(prev => prev.filter(c => !resolvedConflictIds.has(c.id)));
  };
  
  // Handle feedback submission
  const handleFeedbackSubmitted = () => {
    onFeedbackClose();
  };
  
  return (
    <Box>
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        {/* Header with confidence indicator */}
        <GridItem colSpan={12}>
          <Flex 
            p={4} 
            bg={cardBg} 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor={borderColor}
            justify="space-between"
            align="center"
          >
            <Box>
              <Heading size="lg">
                Enhanced Scheduling Interface
              </Heading>
              <Text color="gray.500" mt={1}>
                Sport: {sportType} | Schedule ID: {scheduleId}
              </Text>
            </Box>
            
            <Flex align="center">
              {confidenceData && (
                <Box mr={4}>
                  <ScheduleConfidenceIndicator 
                    confidenceData={confidenceData}
                    size="md"
                  />
                </Box>
              )}
              
              <Button
                leftIcon={<MdRefresh />}
                colorScheme="blue"
                variant="outline"
                onClick={analyzeSchedule}
                isLoading={analyzing}
                loadingText="Analyzing"
                mr={2}
              >
                Analyze Schedule
              </Button>
              
              <IconButton
                icon={<MdFeedback />}
                aria-label="Provide feedback"
                colorScheme="purple"
                variant="outline"
                onClick={onFeedbackOpen}
              />
            </Flex>
          </Flex>
        </GridItem>
        
        {/* Main content */}
        <GridItem colSpan={{ base: 12, lg: 12 }} rowSpan={1}>
          {loading ? (
            <Flex 
              justify="center" 
              align="center" 
              p={8} 
              bg={cardBg} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
            >
              <Spinner size="xl" />
            </Flex>
          ) : error ? (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          ) : (
            <Tabs colorScheme="blue" variant="enclosed">
              <TabList>
                <Tab>Conflicts ({conflicts.length})</Tab>
                <Tab>Resolutions ({resolutions.length})</Tab>
                <Tab>Schedule ({schedule.length} Games)</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel p={0} pt={4}>
                  <ConflictVisualizationDashboard 
                    conflicts={conflicts}
                    sportType={sportType}
                    scheduleId={scheduleId}
                  />
                </TabPanel>
                
                <TabPanel p={0} pt={4}>
                  <ResolutionRecommendationWidget 
                    conflicts={conflicts}
                    schedule={schedule}
                    sportType={sportType}
                    scheduleId={scheduleId}
                    onApplyResolutions={handleApplyResolutions}
                  />
                </TabPanel>
                
                <TabPanel p={0} pt={4}>
                  <Box 
                    p={4} 
                    bg={cardBg} 
                    borderRadius="md" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    maxH="600px"
                    overflowY="auto"
                  >
                    {schedule.length === 0 ? (
                      <Text textAlign="center" p={4}>
                        No schedule data available
                      </Text>
                    ) : (
                      <Box as="table" width="100%" borderCollapse="collapse">
                        <Box as="thead" bg={headerBg}>
                          <Box as="tr">
                            <Box as="th" p={2} textAlign="left">Date</Box>
                            <Box as="th" p={2} textAlign="left">Time</Box>
                            <Box as="th" p={2} textAlign="left">Home Team</Box>
                            <Box as="th" p={2} textAlign="left">Away Team</Box>
                            <Box as="th" p={2} textAlign="left">Venue</Box>
                          </Box>
                        </Box>
                        <Box as="tbody">
                          {schedule.map((event, index) => (
                            <Box 
                              key={event.id || index} 
                              as="tr"
                              _odd={{ bg: oddRowBg }}
                            >
                              <Box as="td" p={2}>{event.date}</Box>
                              <Box as="td" p={2}>{event.startTime}</Box>
                              <Box as="td" p={2}>{event.homeTeam}</Box>
                              <Box as="td" p={2}>{event.awayTeam}</Box>
                              <Box as="td" p={2}>{event.venue}</Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </GridItem>
      </Grid>
      
      {/* Feedback Drawer */}
      <Drawer
        isOpen={isFeedbackOpen}
        placement="right"
        onClose={onFeedbackClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Flex align="center">
              <MdFeedback />
              <Text ml={2}>Provide Feedback</Text>
            </Flex>
          </DrawerHeader>
          
          <DrawerBody>
            <FeedbackCollectionInterface 
              feedbackTargets={feedbackTargets}
              sportType={sportType}
              scheduleId={scheduleId}
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          </DrawerBody>
          
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onFeedbackClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default EnhancedSchedulingInterface;
