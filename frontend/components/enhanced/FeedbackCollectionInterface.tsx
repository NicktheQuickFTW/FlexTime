import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useColorModeValue,
  FormControl,
  FormLabel,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tooltip,
  Checkbox,
  CheckboxGroup,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  VStack
} from '@chakra-ui/react';
import { MdThumbUp, MdThumbDown, MdStar, MdStarBorder, MdSend, MdLightbulb } from 'react-icons/md';
import axios from 'axios';

// Types
interface FeedbackTarget {
  type: 'prediction' | 'resolution' | 'explanation';
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
}

interface FeedbackCategoryOption {
  id: string;
  label: string;
  description: string;
}

interface FeedbackData {
  targetId: string;
  targetType: 'prediction' | 'resolution' | 'explanation';
  rating: number; // 1-5
  success: boolean;
  categories: string[];
  comments: string;
  improvementSuggestions: string;
  context?: {
    sportType?: string;
    scheduleId?: string;
    conflictId?: string;
  };
}

interface FeedbackCollectionInterfaceProps {
  feedbackTargets: FeedbackTarget[];
  sportType?: string;
  scheduleId?: string;
  conflictId?: string;
  onFeedbackSubmitted?: (feedback: FeedbackData) => void;
}

/**
 * FeedbackCollectionInterface allows users to provide structured feedback on
 * AI predictions, conflict resolutions, and explanations to improve system quality.
 */
const FeedbackCollectionInterface: React.FC<FeedbackCollectionInterfaceProps> = ({
  feedbackTargets,
  sportType,
  scheduleId,
  conflictId,
  onFeedbackSubmitted
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [rating, setRating] = useState<number>(3);
  const [success, setSuccess] = useState<boolean>(true);
  const [showRatingTooltip, setShowRatingTooltip] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comments, setComments] = useState<string>('');
  const [improvementSuggestions, setImprovementSuggestions] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Feedback categories by target type
  const feedbackCategories: Record<string, FeedbackCategoryOption[]> = {
    prediction: [
      { id: 'accuracy', label: 'Accuracy', description: 'How accurate was the prediction?' },
      { id: 'fairness', label: 'Fairness', description: 'Was the schedule fair to all teams?' },
      { id: 'travel', label: 'Travel Optimization', description: 'How well was travel optimized?' },
      { id: 'rest', label: 'Rest Periods', description: 'Were adequate rest periods provided?' },
      { id: 'venue', label: 'Venue Allocation', description: 'How appropriate were venue assignments?' }
    ],
    resolution: [
      { id: 'effectiveness', label: 'Effectiveness', description: 'How effectively did it resolve the conflict?' },
      { id: 'practicality', label: 'Practicality', description: 'How practical was the resolution to implement?' },
      { id: 'creativity', label: 'Creativity', description: 'How creative was the resolution approach?' },
      { id: 'sideEffects', label: 'Side Effects', description: 'Did it cause new issues?' },
      { id: 'stakeholders', label: 'Stakeholder Impact', description: 'How did it impact various stakeholders?' }
    ],
    explanation: [
      { id: 'clarity', label: 'Clarity', description: 'How clear was the explanation?' },
      { id: 'completeness', label: 'Completeness', description: 'How complete was the explanation?' },
      { id: 'helpfulness', label: 'Helpfulness', description: 'How helpful was the explanation?' },
      { id: 'insight', label: 'Insightfulness', description: 'Did it provide valuable insights?' },
      { id: 'actionability', label: 'Actionability', description: 'Did it help you take action?' }
    ]
  };
  
  // Get current target
  const currentTarget = feedbackTargets.find(target => target.id === selectedTarget);
  const currentCategories = currentTarget ? feedbackCategories[currentTarget.type] : [];
  
  // Get label for rating
  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };
  
  // Handle feedback submission
  const handleSubmit = async () => {
    if (!selectedTarget) {
      setError('Please select what you are providing feedback for');
      return;
    }
    
    const target = feedbackTargets.find(t => t.id === selectedTarget);
    if (!target) {
      setError('Invalid feedback target');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const feedbackData: FeedbackData = {
      targetId: selectedTarget,
      targetType: target.type,
      rating,
      success,
      categories: selectedCategories,
      comments,
      improvementSuggestions,
      context: {
        sportType,
        scheduleId,
        conflictId
      }
    };
    
    try {
      const response = await axios.post('/api/feedback', feedbackData);
      
      if (response.data && response.data.success) {
        toast({
          title: 'Feedback submitted',
          description: 'Thank you for your feedback! It will help improve our AI system.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reset form
        setSelectedTarget('');
        setRating(3);
        setSuccess(true);
        setSelectedCategories([]);
        setComments('');
        setImprovementSuggestions('');
        
        // Call parent callback
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(feedbackData);
        }
      } else {
        setError(response.data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get badge color based on target type
  const getTargetBadgeColor = (type: string) => {
    switch (type) {
      case 'prediction':
        return 'green';
      case 'resolution':
        return 'blue';
      case 'explanation':
        return 'purple';
      default:
        return 'gray';
    }
  };
  
  return (
    <Box p={0} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
      <Box px={4} py={3} bg={headerBg} borderTopRadius="md">
        <Flex justify="space-between" align="center">
          <Heading size="md">Feedback Collection</Heading>
          <Text fontSize="sm" color="gray.500">Help improve our AI system</Text>
        </Flex>
      </Box>
      
      <Box p={4}>
        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Target Selection */}
        <FormControl mb={4} isRequired>
          <FormLabel>What are you providing feedback on?</FormLabel>
          <Select 
            placeholder="Select an item" 
            value={selectedTarget}
            onChange={(e) => {
              setSelectedTarget(e.target.value);
              setSelectedCategories([]);
            }}
          >
            {feedbackTargets.map(target => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </Select>
        </FormControl>
        
        {selectedTarget && (
          <>
            {/* Target Information */}
            {currentTarget && (
              <Box mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Flex align="center" mb={2}>
                  <Badge colorScheme={getTargetBadgeColor(currentTarget.type)} mr={2}>
                    {currentTarget.type.charAt(0).toUpperCase() + currentTarget.type.slice(1)}
                  </Badge>
                  <Text fontWeight="bold">{currentTarget.name}</Text>
                </Flex>
                <Text fontSize="sm">{currentTarget.description}</Text>
              </Box>
            )}
            
            {/* Success/Failure */}
            <FormControl mb={4}>
              <FormLabel>Was this successful?</FormLabel>
              <RadioGroup value={success ? 'yes' : 'no'} onChange={(val) => setSuccess(val === 'yes')}>
                <Stack direction="row">
                  <Radio value="yes">
                    <Flex align="center">
                      <Icon as={MdThumbUp} color="green.500" mr={1} />
                      Yes
                    </Flex>
                  </Radio>
                  <Radio value="no">
                    <Flex align="center">
                      <Icon as={MdThumbDown} color="red.500" mr={1} />
                      No
                    </Flex>
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            
            {/* Rating */}
            <FormControl mb={4}>
              <FormLabel>Rating</FormLabel>
              <Flex direction="column">
                <Slider
                  id="rating-slider"
                  min={1}
                  max={5}
                  step={1}
                  value={rating}
                  onChange={setRating}
                  onMouseEnter={() => setShowRatingTooltip(true)}
                  onMouseLeave={() => setShowRatingTooltip(false)}
                  mb={6}
                >
                  {[1, 2, 3, 4, 5].map((mark) => (
                    <SliderMark key={mark} value={mark} mt={2} fontSize="sm">
                      {mark}
                    </SliderMark>
                  ))}
                  <SliderTrack>
                    <SliderFilledTrack bg="blue.500" />
                  </SliderTrack>
                  <Tooltip
                    hasArrow
                    bg="blue.500"
                    color="white"
                    placement="top"
                    isOpen={showRatingTooltip}
                    label={getRatingLabel(rating)}
                  >
                    <SliderThumb boxSize={6}>
                      <Box color="blue.500">
                        {rating >= 4 ? <MdStar /> : <MdStarBorder />}
                      </Box>
                    </SliderThumb>
                  </Tooltip>
                </Slider>
                
                <Flex justify="space-between">
                  <Text fontSize="sm" color="gray.500">Poor</Text>
                  <Text fontSize="sm" color="gray.500">Excellent</Text>
                </Flex>
              </Flex>
            </FormControl>
            
            {/* Categories */}
            {currentCategories.length > 0 && (
              <FormControl mb={4}>
                <FormLabel>Specific Aspects (Optional)</FormLabel>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Select areas where you have specific feedback
                </Text>
                
                <CheckboxGroup 
                  value={selectedCategories} 
                  onChange={(values) => setSelectedCategories(values as string[])}
                >
                  <VStack align="start" spacing={2}>
                    {currentCategories.map(category => (
                      <Checkbox key={category.id} value={category.id}>
                        <Tooltip label={category.description}>
                          <Text>{category.label}</Text>
                        </Tooltip>
                      </Checkbox>
                    ))}
                  </VStack>
                </CheckboxGroup>
              </FormControl>
            )}
            
            {/* Comments */}
            <FormControl mb={4}>
              <FormLabel>Comments (Optional)</FormLabel>
              <Textarea
                placeholder="Share your thoughts on what worked well or didn't work well..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </FormControl>
            
            {/* Improvement Suggestions */}
            <FormControl mb={4}>
              <FormLabel>
                <Flex align="center">
                  <Icon as={MdLightbulb} color="yellow.500" mr={1} />
                  Suggestions for Improvement (Optional)
                </Flex>
              </FormLabel>
              <Textarea
                placeholder="Do you have specific ideas for how we could improve this?"
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                rows={3}
              />
            </FormControl>
            
            {/* Submit Button */}
            <Button
              colorScheme="blue"
              isFullWidth
              onClick={handleSubmit}
              isLoading={loading}
              leftIcon={<MdSend />}
              mt={2}
            >
              Submit Feedback
            </Button>
          </>
        )}
        
        {/* When no target is selected */}
        {!selectedTarget && feedbackTargets.length > 0 && (
          <Box p={4} textAlign="center">
            <Icon as={MdLightbulb} boxSize={10} color="yellow.400" mb={2} />
            <Heading size="md" mb={2}>Your Feedback Helps Us Improve</Heading>
            <Text color="gray.500">
              Select an item above to provide your feedback on our AI predictions, resolutions, or explanations.
            </Text>
          </Box>
        )}
        
        {/* When no feedback targets are available */}
        {feedbackTargets.length === 0 && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertTitle>No items to review</AlertTitle>
            <AlertDescription>
              There are currently no predictions, resolutions, or explanations to provide feedback on.
            </AlertDescription>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default FeedbackCollectionInterface;
