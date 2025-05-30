import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, ProgressBar, Chip, IconButton, Divider } from 'react-native-paper';
import { ScheduleEvaluation } from '@/types';
import { format } from 'date-fns';

interface ScheduleEvaluationCardProps {
  evaluation: ScheduleEvaluation;
  onViewDetails?: () => void;
  onViewConflicts?: () => void;
}

export const ScheduleEvaluationCard: React.FC<ScheduleEvaluationCardProps> = ({
  evaluation,
  onViewDetails,
  onViewConflicts,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    if (score >= 50) return '#ff5722';
    return '#d32f2f';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const hardConstraintScore = (evaluation.hardConstraintsPassed / evaluation.hardConstraintsTotal) * 100;
  const softConstraintScore = (evaluation.softConstraintsPassed / evaluation.softConstraintsTotal) * 100;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Title style={styles.title}>Schedule Evaluation</Title>
            <Paragraph style={styles.evaluatedAt}>
              {format(new Date(evaluation.evaluatedAt), 'MMM d, yyyy h:mm a')}
            </Paragraph>
          </View>
          <View style={styles.scoreContainer}>
            <Paragraph style={[styles.score, { color: getScoreColor(evaluation.overallScore) }]}>
              {evaluation.overallScore}%
            </Paragraph>
            <Chip
              style={[styles.scoreChip, { backgroundColor: getScoreColor(evaluation.overallScore) }]}
              textStyle={styles.scoreChipText}
            >
              {getScoreLabel(evaluation.overallScore)}
            </Chip>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.constraintsSection}>
          <View style={styles.constraintRow}>
            <View style={styles.constraintInfo}>
              <Paragraph style={styles.constraintLabel}>Hard Constraints</Paragraph>
              <Paragraph style={styles.constraintStats}>
                {evaluation.hardConstraintsPassed} / {evaluation.hardConstraintsTotal} passed
              </Paragraph>
            </View>
            <Paragraph style={styles.constraintScore}>{hardConstraintScore.toFixed(0)}%</Paragraph>
          </View>
          <ProgressBar
            progress={hardConstraintScore / 100}
            color="#d32f2f"
            style={styles.progressBar}
          />

          <View style={[styles.constraintRow, styles.marginTop]}>
            <View style={styles.constraintInfo}>
              <Paragraph style={styles.constraintLabel}>Soft Constraints</Paragraph>
              <Paragraph style={styles.constraintStats}>
                {evaluation.softConstraintsPassed} / {evaluation.softConstraintsTotal} passed
              </Paragraph>
            </View>
            <Paragraph style={styles.constraintScore}>{softConstraintScore.toFixed(0)}%</Paragraph>
          </View>
          <ProgressBar
            progress={softConstraintScore / 100}
            color="#ff9800"
            style={styles.progressBar}
          />
        </View>

        {evaluation.conflicts.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.conflictsSection}>
              <View style={styles.conflictsHeader}>
                <Paragraph style={styles.conflictsLabel}>
                  {evaluation.conflicts.length} Conflict{evaluation.conflicts.length !== 1 ? 's' : ''} Found
                </Paragraph>
                {onViewConflicts && (
                  <IconButton
                    icon="arrow-right"
                    size={20}
                    onPress={onViewConflicts}
                  />
                )}
              </View>
              <View style={styles.conflictSummary}>
                {['critical', 'high', 'medium', 'low'].map((severity) => {
                  const count = evaluation.conflicts.filter(c => c.severity === severity).length;
                  if (count === 0) return null;
                  
                  return (
                    <Chip
                      key={severity}
                      style={[styles.conflictChip, { backgroundColor: getSeverityColor(severity) }]}
                      textStyle={styles.conflictChipText}
                    >
                      {count} {severity}
                    </Chip>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {evaluation.suggestions.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.suggestionsSection}>
              <Paragraph style={styles.suggestionsLabel}>Suggestions</Paragraph>
              {evaluation.suggestions.slice(0, 3).map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <IconButton icon="lightbulb-outline" size={16} />
                  <Paragraph style={styles.suggestionText}>{suggestion}</Paragraph>
                </View>
              ))}
            </View>
          </>
        )}

        {onViewDetails && (
          <View style={styles.actions}>
            <Button mode="outlined" onPress={onViewDetails}>
              View Full Report
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  function getSeverityColor(severity: string): string {
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
  }
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  evaluatedAt: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreChip: {
    marginTop: 4,
  },
  scoreChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  constraintsSection: {
    marginBottom: 8,
  },
  constraintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  constraintInfo: {
    flex: 1,
  },
  constraintLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  constraintStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  constraintScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  marginTop: {
    marginTop: 16,
  },
  conflictsSection: {
    marginBottom: 8,
  },
  conflictsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conflictsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  conflictSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  conflictChip: {
    height: 24,
  },
  conflictChipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  suggestionsSection: {
    marginBottom: 8,
  },
  suggestionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  actions: {
    marginTop: 16,
  },
});