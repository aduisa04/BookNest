import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal 
} from 'react-native';
import { addCategory, getCategories, deleteCategory } from '../database/db';
import { useTheme } from '../context/ThemeContext';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';

// Default color scheme (fallback)
const newColors = {
  primary: "#C8B6FF",    // Mauve (header background)
  secondary: "#B8C0FF",  // Periwinkle (buttons and accents)
  text: "#333333",       // Dark text
  background: "#FFFFFF", // White background
};

// Custom Alert Component for simple alerts (one button)
const CustomAlert = ({ visible, title, message, onClose }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={alertStyles.modalBackground}>
      <View style={[alertStyles.alertContainer, { backgroundColor: newColors.background }]}>
        <Text style={[alertStyles.alertTitle, { color: newColors.text }]}>{title}</Text>
        <Text style={[alertStyles.alertMessage, { color: newColors.text }]}>{message}</Text>
        <TouchableOpacity onPress={onClose} style={[alertStyles.alertButton, { backgroundColor: newColors.secondary }]}>
          <Text style={alertStyles.alertButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Custom Confirmation Alert Component for two-button alerts
const ConfirmationAlert = ({ visible, title, message, onConfirm, onCancel }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={alertStyles.modalBackground}>
      <View style={[alertStyles.alertContainer, { backgroundColor: newColors.background }]}>
        <Text style={[alertStyles.alertTitle, { color: newColors.text }]}>{title}</Text>
        <Text style={[alertStyles.alertMessage, { color: newColors.text }]}>{message}</Text>
        <View style={alertStyles.buttonRow}>
          <TouchableOpacity 
            onPress={onCancel} 
            style={[alertStyles.alertButton, { backgroundColor: '#CCCCCC', marginRight: 10 }]}
          >
            <Text style={alertStyles.alertButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onConfirm} 
            style={[alertStyles.alertButton, { backgroundColor: newColors.secondary }]}
          >
            <Text style={alertStyles.alertButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const alertStyles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

const AddCategoryScreen = () => {
  const { theme } = useTheme();
  const currentTheme = {
    background: theme.background || newColors.background,
    text: theme.text || newColors.text,
    inputBackground: theme.inputBackground || newColors.background,
    cardBackground: theme.cardBackground || newColors.background,
    border: theme.border || newColors.primary,
  };

  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);

  // State for simple alerts
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState(null);

  // State for confirmation alert (for deletion)
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationCallback, setConfirmationCallback] = useState(null);

  const navigation = useNavigation();

  // Helper to show simple alert
  const showAlert = (title, message, callback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => callback);
    setAlertVisible(true);
  };

  // Dismiss simple alert and run callback if provided
  const handleCloseAlert = () => {
    setAlertVisible(false);
    if (alertCallback) {
      alertCallback();
      setAlertCallback(null);
    }
  };

  // Helper to show confirmation alert
  const showConfirmationAlert = (title, message, onConfirm) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmationCallback(() => onConfirm);
    setConfirmationVisible(true);
  };

  // Dismiss confirmation alert and run onCancel (if needed)
  const handleCancelConfirmation = () => {
    setConfirmationVisible(false);
    setConfirmationCallback(null);
  };

  // When confirm is pressed, run the callback and dismiss the alert.
  const handleConfirmDeletion = () => {
    if (confirmationCallback) {
      confirmationCallback();
    }
    setConfirmationVisible(false);
    setConfirmationCallback(null);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const handleAddCategory = async () => {
    if (categoryName.trim() === '') {
      showAlert('Error', 'Category name cannot be empty');
      return;
    }
    try {
      await addCategory(categoryName, fetchCategories);
      showAlert('Success', 'Category added successfully!', () => {
        setCategoryName('');
      });
    } catch (error) {
      console.error('Error adding category:', error);
      showAlert('Error', 'Failed to add category.');
    }
  };

  const handleDeleteCategory = (categoryId) => {
    showConfirmationAlert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      async () => {
        await deleteCategory(categoryId, fetchCategories);
      }
    );
  };

  const renderItem = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={600} style={[styles.categoryItemContainer, { backgroundColor: currentTheme.cardBackground }]}>
      <Text style={[styles.categoryItem, { color: currentTheme.text }]}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.deleteButton}>
        <Text style={[styles.deleteButtonText, { color: newColors.primary }]}>Delete</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <AppHeader title="Add Category" navigation={navigation} />

      <TextInput
        placeholder="Enter Category Name"
        value={categoryName}
        onChangeText={setCategoryName}
        style={[styles.input, { backgroundColor: currentTheme.inputBackground, color: currentTheme.text, borderColor: newColors.primary, marginHorizontal: 20, marginTop: 20 }]}
        placeholderTextColor={currentTheme.text}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: newColors.secondary, marginHorizontal: 20 }]} onPress={handleAddCategory}>
        <Text style={styles.buttonText}>Add Category</Text>
      </TouchableOpacity>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContainer, { paddingHorizontal: 20 }]}
      />
      <CustomAlert 
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={handleCloseAlert}
      />
      <ConfirmationAlert 
        visible={confirmationVisible}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirm={handleConfirmDeletion}
        onCancel={handleCancelConfirmation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: newColors.background,
  },
  input: { 
    borderWidth: 1, 
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 8, 
    fontSize: 16,
  },
  listContainer: {
    marginTop: 25,
  },
  categoryItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: newColors.background,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: { 
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: newColors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AddCategoryScreen;
