import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, FAB, Chip, ActivityIndicator, Text, Portal, Modal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ConstraintCard } from '@/components';
import { api } from '@/api';
import { Constraint } from '@/types';
import { useNavigation } from '@react-navigation/native';

export const ConstraintListScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hard' | 'soft'>('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedConstraint, setSelectedConstraint] = useState<Constraint | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Fetch constraints
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['constraints', filterType, filterCategory],
    queryFn: async () => {
      const params: any = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterCategory) params.category = filterCategory;
      
      const response = await api.constraints.getConstraints(params);
      return response.data;
    },
  });

  // Toggle constraint mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.constraints.toggleConstraintStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
      Toast.show({
        type: 'success',
        text1: 'Constraint Updated',
        text2: 'Status changed successfully',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update constraint status',
      });
    },
  });

  // Delete constraint mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.constraints.deleteConstraint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
      setDeleteModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Constraint Deleted',
        text2: 'Constraint removed successfully',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete constraint',
      });
    },
  });

  // Filter constraints based on search
  const filteredConstraints = data?.filter((constraint: Constraint) =>
    constraint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    constraint.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleConstraintPress = (constraint: Constraint) => {
    navigation.navigate('ConstraintDetail', { constraintId: constraint.id });
  };

  const handleEdit = (constraint: Constraint) => {
    navigation.navigate('ConstraintEdit', { constraintId: constraint.id });
  };

  const handleDelete = (constraint: Constraint) => {
    setSelectedConstraint(constraint);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (selectedConstraint) {
      deleteMutation.mutate(selectedConstraint.id);
    }
  };

  const categories = ['scheduling', 'resource', 'preference', 'regulatory'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search constraints..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filters}>
          <View style={styles.typeFilters}>
            <Chip
              selected={filterType === 'all'}
              onPress={() => setFilterType('all')}
              style={styles.filterChip}
            >
              All
            </Chip>
            <Chip
              selected={filterType === 'hard'}
              onPress={() => setFilterType('hard')}
              style={styles.filterChip}
            >
              Hard
            </Chip>
            <Chip
              selected={filterType === 'soft'}
              onPress={() => setFilterType('soft')}
              style={styles.filterChip}
            >
              Soft
            </Chip>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Chip
                selected={filterCategory === item}
                onPress={() => setFilterCategory(filterCategory === item ? null : item)}
                style={styles.categoryChip}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Chip>
            )}
            style={styles.categoryFilters}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredConstraints}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConstraintCard
              constraint={item}
              onPress={() => handleConstraintPress(item)}
              onToggle={(id) => toggleMutation.mutate(id)}
              onEdit={handleEdit}
              onDelete={() => handleDelete(item)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No constraints found</Text>
            </View>
          }
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('ConstraintCreate')}
      />

      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Delete Constraint</Text>
          <Text style={styles.modalText}>
            Are you sure you want to delete "{selectedConstraint?.name}"? This action cannot be undone.
          </Text>
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmDelete}
              style={[styles.modalButton, styles.deleteButton]}
              buttonColor="#d32f2f"
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingBottom: 8,
    elevation: 2,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filters: {
    paddingHorizontal: 16,
  },
  typeFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  categoryFilters: {
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196f3',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 80,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
});