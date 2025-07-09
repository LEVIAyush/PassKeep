import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, Picker } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles';
import { addPassword, updatePassword } from '../utils/Database';

const AddPasswordScreen = ({ navigation, route }) => {
  const { record, type, isUpdate } = route.params || {};
  const [webAppName, setWebAppName] = useState(record?.website || '');
  const [usernameEmail, setUsernameEmail] = useState(record?.username || '');
  const [password, setPassword] = useState(record?.password || '');
  const [category, setCategory] = useState(type || 'browser');
  const [modalVisible, setModalVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const clearFields = () => {
    setWebAppName('');
    setUsernameEmail('');
    setPassword('');
  };

  const onSubmit = () => {
    if (!webAppName.trim() || !usernameEmail.trim() || !password.trim()) {
      setIsSuccess(false);
      setModalVisible(true);
      return;
    }

    if (isUpdate) {
      // Update existing password
      updatePassword(record.id, category, webAppName, usernameEmail, password, () => {
        setIsSuccess(true);
        setModalVisible(true);
      });
    } else {
      // Add new password
      addPassword(category, webAppName, usernameEmail, password, () => {
        clearFields();
        setIsSuccess(true);
        setModalVisible(true);
      });
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (isUpdate || !isSuccess) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isUpdate ? 'UPDATE PASSWORD' : 'ADD NEW PASSWORD'}</Text>
      <View style={styles.inputContainer}>
        {!isUpdate && (
          <Picker
            selectedValue={category}
            style={styles.picker}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="Browser" value="browser" />
            <Picker.Item label="Application" value="app" />
          </Picker>
        )}
        <TextInput
          style={styles.input}
          placeholder="Web/App Name"
          value={webAppName}
          onChangeText={setWebAppName}
          placeholderTextColor="rgb(102, 102, 102)"
        />
        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          value={usernameEmail}
          onChangeText={setUsernameEmail}
          autoCapitalize="none"
          placeholderTextColor="rgb(102, 102, 102)"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholderTextColor="rgb(102, 102, 102)"
        />
        <TouchableOpacity style={styles.addButton} onPress={onSubmit}>
          <Text style={styles.addButtonText}>{isUpdate ? 'Update Password' : 'Add Password'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{isSuccess ? 'Success' : 'Error'}</Text>
            <Text style={styles.modalMessage}>
              {isSuccess
                ? isUpdate
                  ? 'Password updated successfully!'
                  : 'Password added successfully!'
                : 'All fields are required!'}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleModalClose}
              >
                <Text style={styles.modalButtonText}>
                  {isUpdate ? 'Close' : isSuccess ? 'Add Another' : 'Try Again'}
                </Text>
              </Pressable>
              {!isUpdate && isSuccess && (
                <Pressable
                  style={[styles.modalButton, styles.modalDeleteButton]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddPasswordScreen;