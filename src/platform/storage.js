// AsyncStorage maps to localStorage on the web and to native storage on phones.
// Only ever holds the ENCRYPTED vault blob and non-secret settings.
import AsyncStorage from '@react-native-async-storage/async-storage';

export default {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};
