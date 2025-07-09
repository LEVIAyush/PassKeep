import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles';
import { getPasswordsByCategory } from '../utils/Database';

const HomeScreen = ({ navigation }) => {
  const [browserCount, setBrowserCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  const fetchCounts = () => {
    getPasswordsByCategory('browser', (records) => {
      setBrowserCount(records.length);
    });
    getPasswordsByCategory('app', (records) => {
      setAppCount(records.length);
    });
  };

  useEffect(() => {
    fetchCounts();
    // Refresh counts when returning to this screen
    const unsubscribe = navigation.addListener('focus', fetchCounts);
    return unsubscribe;
  }, [navigation]);

  const categories = [
    { id: '1', name: 'Browser', files: browserCount, icon: 'web', route: 'BrowserTab' },
    { id: '2', name: 'Application', files: appCount, icon: 'apps', route: 'AppTab' },
  ];

  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate(item.route)}>
      <View style={styles.cardContent}>
        <Icon name={item.icon} size={30} color="rgb(0, 255, 0)" style={styles.cardIcon} />
        <View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.files} Files</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MANAGE YOUR PRIVACY</Text>
      <View style={styles.cardList}>
        {categories.map((category) => (
          <View key={category.id} style={styles.cardWrapper}>
            {renderCategory({ item: category })}
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPassword')}
      >
        <Icon name="add" size={30} color="rgb(255, 255, 255)" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;