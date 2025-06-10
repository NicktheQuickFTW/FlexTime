import React from 'react';
import {
  Box,
  Text,
  Tooltip,
  Flex,
  CircularProgress,
  CircularProgressLabel,
  Badge,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  List,
  ListItem,
  ListIcon,
  Heading
} from '@chakra-ui/react';
import { MdInfo, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';

interface ConfidenceData {
  score: number; // 0-1 confidence score
  sportType: string;
  dataPoints?: number; // Number of historical data points used
  patternMatchRate?: number; // How well the schedule matches historical patterns
  factors?: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number; // 0-1 weighting
    description: string;
  }[];
  modelUsed?: string;
  warnings?: string[];
}

interface ScheduleConfidenceIndicatorProps {
  confidenceData: ConfidenceData;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  showFactors?: boolean;
}

/**
 * ScheduleConfidenceIndicator displays a visual representation of the AI's
 * confidence in a proposed schedule, with detailed information about factors
 * that influenced the confidence score.
 */
const ScheduleConfidenceIndicator: React.FC<ScheduleConfidenceIndicatorProps> = ({
  confidenceData,
  size = 'md',
  showDetails = true,
  showFactors = true
}) => {
  // Get appropriate sizes based on the size prop
  const circleSize = size === 'sm' ? 60 : size === 'md' ? 80 : 100;
  const fontSize = size === 'sm' ? 'sm' : size === 'md' ? 'md' : 'lg';
  const labelSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';
  
  // Calculate color based on confidence score
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'teal';
    if (score >= 0.4) return 'orange';
    return 'red';
  };
  
  // Text description of confidence
  const getConfidenceLabel = (score: number) => {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Moderate';
    if (score >= 0.3) return 'Low';
    return 'Very Low';
  };
  
  // Get icon based on confidence
  const getConfidenceIcon = (score: number) => {
    if (score >= 0.7) return MdCheckCircle;
    if (score >= 0.4) return MdWarning;
    return MdError;
  };

  // Get color for factor impact
  const getFactorColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return 'green.500';
      case 'negative':
        return 'red.500';
      case 'neutral':
        return 'gray.500';
    }
  };
  
  // Format score as percentage
  const scorePercent = Math.round(confidenceData.score * 100);
  const confidenceColor = getConfidenceColor(confidenceData.score);
  const ConfidenceIcon = getConfidenceIcon(confidenceData.score);
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  
  return (
    <Popover placement="auto" isLazy>
      <PopoverTrigger>
        <Box cursor="pointer">
          <Flex direction="column" align="center" justify="center">
            <CircularProgress 
              value={scorePercent} 
              color={`${confidenceColor}.500`}
              size={`${circleSize}px`}
              thickness="8px"
            >
              <CircularProgressLabel fontWeight="bold" fontSize={fontSize}>
                {scorePercent}%
              </CircularProgressLabel>
            </CircularProgress>
            
            {showDetails && (
              <Box mt={1} textAlign="center">
                <Text 
                  fontSize={labelSize} 
                  fontWeight="medium" 
                  color={labelColor}
                >
                  {getConfidenceLabel(confidenceData.score)}
                </Text>
                <Flex justify="center" align="center" mt={0.5}>
                  <ConfidenceIcon color={`${confidenceColor}.500`} />
                  <Text 
                    fontSize="xs" 
                    fontWeight="medium" 
                    ml={0.5}
                    color={labelColor}
                  >
                    Confidence
                  </Text>
                </Flex>
              </Box>
            )}
          </Flex>
        </Box>
      </PopoverTrigger>
      
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="bold">
          Schedule Confidence Analysis
        </PopoverHeader>
        <PopoverBody>
          <Box mb={3}>
            <Flex align="center" mb={1}>
              <Text fontWeight="medium">Sport:</Text>
              <Text ml={2}>{confidenceData.sportType}</Text>
            </Flex>
            
            <Flex align="center" mb={1}>
              <Text fontWeight="medium">Confidence:</Text>
              <Badge ml={2} colorScheme={confidenceColor}>
                {getConfidenceLabel(confidenceData.score)} ({scorePercent}%)
              </Badge>
            </Flex>
            
            {confidenceData.dataPoints !== undefined && (
              <Flex align="center" mb={1}>
                <Text fontWeight="medium">Data Points:</Text>
                <Text ml={2}>{confidenceData.dataPoints}</Text>
                <Tooltip label="Number of historical schedules analyzed">
                  <Box ml={1} cursor="help">
                    <MdInfo />
                  </Box>
                </Tooltip>
              </Flex>
            )}
            
            {confidenceData.patternMatchRate !== undefined && (
              <Flex align="center" mb={1}>
                <Text fontWeight="medium">Pattern Match:</Text>
                <Text ml={2}>{Math.round(confidenceData.patternMatchRate * 100)}%</Text>
                <Tooltip label="How well this schedule matches historical patterns">
                  <Box ml={1} cursor="help">
                    <MdInfo />
                  </Box>
                </Tooltip>
              </Flex>
            )}
            
            {confidenceData.modelUsed && (
              <Flex align="center" mb={1}>
                <Text fontWeight="medium">Model:</Text>
                <Text ml={2} fontSize="sm">{confidenceData.modelUsed}</Text>
              </Flex>
            )}
          </Box>
          
          {showFactors && confidenceData.factors && confidenceData.factors.length > 0 && (
            <Box mb={3}>
              <Heading as="h4" size="xs" mb={2}>
                Contributing Factors
              </Heading>
              <List spacing={1}>
                {confidenceData.factors.map((factor, index) => (
                  <ListItem key={index}>
                    <Flex align="center">
                      <ListIcon as={MdCheckCircle} color={getFactorColor(factor.impact)} />
                      <Text fontSize="sm">{factor.name}</Text>
                      <Tooltip label={factor.description}>
                        <Box ml={1} cursor="help">
                          <MdInfo size="14px" />
                        </Box>
                      </Tooltip>
                      <Badge ml="auto" colorScheme={factor.impact === 'positive' ? 'green' : factor.impact === 'negative' ? 'red' : 'gray'}>
                        {Math.round(factor.weight * 100)}%
                      </Badge>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {confidenceData.warnings && confidenceData.warnings.length > 0 && (
            <Box>
              <Heading as="h4" size="xs" mb={2}>
                Warnings
              </Heading>
              <List spacing={1}>
                {confidenceData.warnings.map((warning, index) => (
                  <ListItem key={index}>
                    <Flex align="center">
                      <ListIcon as={MdWarning} color="orange.500" />
                      <Text fontSize="sm">{warning}</Text>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ScheduleConfidenceIndicator;
