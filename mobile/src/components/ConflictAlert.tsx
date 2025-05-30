import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
import { ConstraintConflict } from '@/types';
import { format } from 'date-fns';

interface ConflictAlertProps {
  conflict: ConstraintConflict;
  onResolve?: (conflictId: string) => void;
  onViewDetails?: (conflict: ConstraintConflict) => void;
  compact?: boolean;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({
  conflict,
  onResolve,
  onViewDetails,
  compact = false,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#ffc107';
      default:
        return '#757575';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'alert-octagon';
      case 'high':
        return 'alert';
      case 'medium':
        return 'alert-circle';
      case 'low':
        return 'information';
      default:
        return 'help';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={() => onViewDetails?.(conflict)}>
        <View style={[styles.compactCard, { borderLeftColor: getSeverityColor(conflict.severity) }]}>
          <IconButton
            icon={getSeverityIcon(conflict.severity)}
            size={20}
            iconColor={getSeverityColor(conflict.severity)}
          />
          <View style={styles.compactContent}>
            <Paragraph style={styles.compactDescription} numberOfLines={1}>
              {conflict.description}
            </Paragraph>
            <Paragraph style={styles.compactTime}>
              {format(new Date(conflict.createdAt), 'MMM d, h:mm a')}
            </Paragraph>
          </View>
          {!conflict.resolvedAt && (
            <Chip
              style={styles.unresolvedChip}
              textStyle={styles.unresolvedChipText}
            >
              Unresolved
            </Chip>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Card style={[styles.card, { borderLeftColor: getSeverityColor(conflict.severity) }]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <IconButton
              icon={getSeverityIcon(conflict.severity)}
              size={24}
              iconColor={getSeverityColor(conflict.severity)}
            />
            <Title style={styles.title}>Constraint Conflict</Title>
          </View>
          <Chip
            style={[styles.severityChip, { backgroundColor: getSeverityColor(conflict.severity) }]}
            textStyle={styles.severityChipText}
          >
            {conflict.severity.toUpperCase()}
          </Chip>
        </View>

        <Paragraph style={styles.description}>{conflict.description}</Paragraph>

        {conflict.resolution && (
          <View style={styles.resolutionContainer}>
            <Paragraph style={styles.resolutionLabel}>Resolution:</Paragraph>
            <Paragraph style={styles.resolution}>{conflict.resolution}</Paragraph>
          </View>
        )}

        <View style={styles.metadata}>
          <Paragraph style={styles.metadataText}>
            Created: {format(new Date(conflict.createdAt), 'MMM d, yyyy h:mm a')}
          </Paragraph>
          {conflict.resolvedAt && (
            <Paragraph style={styles.metadataText}>
              Resolved: {format(new Date(conflict.resolvedAt), 'MMM d, yyyy h:mm a')}
            </Paragraph>
          )}
        </View>

        <View style={styles.actions}>
          {!conflict.resolvedAt && onResolve && (
            <Button
              mode="contained"
              onPress={() => onResolve(conflict.id)}
              style={styles.resolveButton}
            >
              Resolve
            </Button>
          )}
          {onViewDetails && (
            <Button
              mode="outlined"
              onPress={() => onViewDetails(conflict)}
              style={styles.detailsButton}
            >
              View Details
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingRight: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    elevation: 1,
  },
  compactContent: {
    flex: 1,
    marginLeft: 8,
  },
  compactDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  unresolvedChip: {
    height: 24,
    backgroundColor: '#ffebee',
  },
  unresolvedChipText: {
    fontSize: 11,
    color: '#d32f2f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  severityChip: {
    height: 28,
  },
  severityChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  resolutionContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  resolution: {
    fontSize: 14,
  },
  metadata: {
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  resolveButton: {
    backgroundColor: '#4caf50',
  },
  detailsButton: {
    borderColor: '#2196f3',
  },
});