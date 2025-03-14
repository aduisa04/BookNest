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

// Custom Alert Component for simple alerts (one button)
const CustomAlert = ({ visible, title, message, onClose }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={alertStyles.modalBackground}>
      <View style={alertStyles.alertContainer}>
        <Text style={alertStyles.alertTitle}>{title}</Text>
        <Text style={alertStyles.alertMessage}>{message}</Text>
        <TouchableOpacity onPress={onClose} style={alertStyles.alertButton}>
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
      <View style={alertStyles.alertContainer}>
        <Text style={alertStyles.alertTitle}>{title}</Text>
        <Text style={alertStyles.alertMessage}>{message}</Text>
        <View style={alertStyles.buttonRow}>
          <TouchableOpacity 
            onPress={onCancel} 
            style={[alertStyles.alertButton, { backgroundColor: '#CCCCCC', marginRight: 10 }]}
          >
            <Text style={alertStyles.alertButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onConfirm} 
            style={[alertStyles.alertButton, { backgroundColor: '#A67C52' }]}
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
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
      console.error('❌ Error adding category:', error);
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
    <View style={[styles.categoryItemContainer, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.categoryItem, { color: theme.text }]}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.deleteButton}>
        <Text style={[styles.deleteButtonText, { color: theme.buttonBackground }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Add Category</Text>
      <TextInput
        placeholder="Enter Category Name"
        value={categoryName}
        onChangeText={setCategoryName}
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }
        ]}
        placeholderTextColor={theme.text}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddCategory}>
        <Text style={styles.buttonText}>Add Category</Text>
      </TouchableOpacity>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
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
    padding: 20 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5, 
    fontSize: 16 
  },
  listContainer: {
    marginTop: 20,
  },
  categoryItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  categoryItem: { 
    fontSize: 18,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#A67C52',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff', // Button text forced to white
  },
});

export default AddCategoryScreen;