import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, Switch, IconButton } from 'react-native-paper';
import { Constraint } from '@/types';

interface ConstraintCardProps {
  constraint: Constraint;
  onPress?: () => void;
  onToggle?: (id: string) => void;
  onEdit?: (constraint: Constraint) => void;
  onDelete?: (id: string) => void;
}

export const ConstraintCard: React.FC<ConstraintCardProps> = ({
  constraint,
  onPress,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const getTypeColor = (type: string) => {
    return type === 'hard' ? '#d32f2f' : '#ff9800';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'scheduling':
        return 'calendar';
      case 'resource':
        return 'account-group';
      case 'preference':
        return 'heart';
      case 'regulatory':
        return 'shield-check';
      default:
        return 'help';
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{constraint.name}</Title>
            <View style={styles.chips}>
              <Chip
                icon={getCategoryIcon(constraint.category)}
                style={[styles.chip, { backgroundColor: getTypeColor(constraint.type) }]}
                textStyle={styles.chipText}
              >
                {constraint.type.toUpperCase()}
              </Chip>
              <Chip style={styles.chip} textStyle={styles.chipText}>
                {constraint.category}
              </Chip>
            </View>
          </View>
          <Switch
            value={constraint.active}
            onValueChange={() => onToggle?.(constraint.id)}
            color="#4caf50"
          />
        </View>
        
        <Paragraph style={styles.description} numberOfLines={2}>
          {constraint.description}
        </Paragraph>

        <View style={styles.footer}>
          <View style={styles.priority}>
            <Paragraph style={styles.priorityLabel}>Priority:</Paragraph>
            <Paragraph style={styles.priorityValue}>{constraint.priority}</Paragraph>
          </View>
          
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => onEdit(constraint)}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={20}
                onPress={() => onDelete(constraint.id)}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    height: 24,
  },
  chipText: {
    fontSize: 12,
    color: 'white',
  },
  description: {
    marginVertical: 8,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  priorityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
});