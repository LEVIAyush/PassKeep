import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles';
import { getPasswordsByCategory, deletePassword } from '../utils/Database';

const BrowserPasswordScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchPasswords = () => {
    getPasswordsByCategory('browser', (records) => {
      setFilteredRecords(records);
    });
  };

  useEffect(() => {
    fetchPasswords();
    // Add a listener to refresh passwords when returning to this screen
    const unsubscribe = navigation.addListener('focus', fetchPasswords);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    getPasswordsByCategory('browser', (records) => {
      setFilteredRecords(
        records.filter(
          (record) =>
            record.website.toLowerCase().includes(searchText.toLowerCase()) ||
            record.username.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    });
  }, [searchText]);

  const confirmDelete = (id) => {
    setRecordToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDelete = () => {
    if (recordToDelete) {
      deletePassword(recordToDelete, () => {
        fetchPasswords();
        setDeleteModalVisible(false);
        setRecordToDelete(null);
      });
    }
  };

  const openDetails = (record) => {
    setSelectedRecord(record);
    setShowPassword(false);
    setDetailsModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.vaultItem} onPress={() => openDetails(item)}>
      <View style={styles.vaultIcon}>
        <Text style={styles.vaultIconText}>{item.website.charAt(0)}</Text>
      </View>
      <View style={styles.vaultContent}>
        <Text style={styles.vaultTitle}>{item.website}</Text>
        <Text style={styles.vaultSubtitle}>Added: {item.timestamp}</Text>
      </View>
      <View style={styles.vaultActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('AddPassword', { record: item, type: 'browser', isUpdate: true })
          }
        >
          <Icon name="edit" size={20} color="rgb(0, 255, 0)" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(item.id)}>
          <Icon name="delete" size={20} color="rgb(255, 77, 77)" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BROWSER VAULT</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by Web/App or Username"
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
        placeholderTextColor="rgb(102, 102, 102)"
      />
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No browser passwords found.</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPassword', { type: 'browser' })}
      >
        <Icon name="add" size={30} color="rgb(255, 255, 255)" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalMessage}>Are you sure you want to delete this password?</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Password Details</Text>
            {selectedRecord && (
              <View style={styles.detailsContent}>
                <Text style={styles.detailLabel}>Web/App Name:</Text>
                <Text style={styles.detailValue}>{selectedRecord.website}</Text>
                <Text style={styles.detailLabel}>Username/Email:</Text>
                <Text style={styles.detailValue}>{selectedRecord.username}</Text>
                <Text style={styles.detailLabel}>Password:</Text>
                <View style={styles.passwordRow}>
                  <Text style={styles.detailValue}>
                    {showPassword ? selectedRecord.password : '••••••••'}
                  </Text>
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="rgb(0, 255, 0)"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailLabel}>Added:</Text>
                <Text style={styles.detailValue}>{selectedRecord.timestamp}</Text>
              </View>
            )}
            <Pressable
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BrowserPasswordScreen;