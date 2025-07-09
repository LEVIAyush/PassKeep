import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import styles from '../styles';

const ManageScreen = ({ navigation, records, deleteRecord }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredRecords, setFilteredRecords] = useState(records);

  useEffect(() => {
    setFilteredRecords(
      records.filter(
        (record) =>
          record.webAppName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.usernameEmail.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [searchText, records]);

  const confirmDelete = (id) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(id) },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.vaultItem} onPress={() => {}}>
      <View style={styles.vaultIcon}>
        <Text style={styles.vaultIconText}>{item.webAppName.charAt(0)}</Text>
      </View>
      <View style={styles.vaultContent}>
        <Text style={styles.vaultTitle}>{item.webAppName}</Text>
        <Text style={styles.vaultSubtitle}>{item.timestamp}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MY VAULT</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by Web/App or Username"
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
        placeholderTextColor="#666"
      />
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No records found.</Text>
        }
      />
    </View>
  );
};

export default ManageScreen;