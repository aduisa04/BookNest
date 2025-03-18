import React, { useEffect, useState } from 'react';
import { 
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Button,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Animatable from 'react-native-animatable';
import * as Notifications from 'expo-notifications';
import { getBooksFromDatabase, addBook, deleteBook, updateBookDeadline } from '../database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Default color scheme (fallback for light mode)
const newColors = {
  primary: "#C8B6FF",   // Periwinkle
  secondary: "#B8C0FF", // Mauve-ish
  text: "#333333",
  background: "#F3F0FF",
};

// Dark purple for buttons (if needed)
const darkPurple = "#4B0082";

// Check if notifications are enabled.
const areNotificationsEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem('notificationsEnabled');
    return value === 'true';
  } catch (error) {
    console.error("Error reading notifications flag", error);
    return false;
  }
};

// ----------------------------------------------------------------------
// ReminderPicker Component (time-only picker)
// ----------------------------------------------------------------------
const ReminderPicker = ({ onSetReminder, onCancel }) => {
  const { theme } = useTheme();
  const currentTheme = {
    background: theme.background || newColors.background,
    text: theme.text || newColors.text,
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
  };

  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') return;
    const newTime = selectedTime || time;
    setTime(newTime);
    // Immediately update the time.
    onSetReminder(newTime);
  };

  return (
    <View style={[reminderStyles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[reminderStyles.header, { color: currentTheme.text }]}>Set Reminder Time</Text>
      <View style={reminderStyles.buttonContainer}>
        <Button
          onPress={() => setShow(true)}
          title="Select Time"
          color={currentTheme.primary}
        />
      </View>
      <Text style={[reminderStyles.selectedDateTime, { color: currentTheme.text }]}>
        Selected Time: {time.toLocaleTimeString()}
      </Text>
      {show && (
        <DateTimePicker
          testID="timePicker"
          value={time}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
      {/* No additional action buttons here */}
    </View>
  );
};

const reminderStyles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  selectedDateTime: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});
// ----------------------------------------------------------------------
// End of ReminderPicker Component
// ----------------------------------------------------------------------

// Main screen component.
function BookCalendarScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const currentTheme = {
    background: theme.background || newColors.background,
    text: theme.text || newColors.text,
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
  };

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookTime, setNewBookTime] = useState(new Date());
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [isReminder, setIsReminder] = useState(false);
  // When editingBook is non-null, we're updating an existing book's deadline.
  const [editingBook, setEditingBook] = useState(null);
  // State for showing the date picker (for updating deadline date)
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Custom success alert modal state.
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // Custom confirmation alert state for finished reading.
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
  const [selectedBookForAlert, setSelectedBookForAlert] = useState(null);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    };
    requestPermissions();
  }, []);

  const fetchBooks = async () => {
    try {
      const storedBooks = await getBooksFromDatabase();
      const dates = {};
      storedBooks.forEach((book) => {
        if (book.dueDate) {
          const dateKey = new Date(book.dueDate).toISOString().split('T')[0];
          dates[dateKey] = { marked: true, dotColor: currentTheme.primary };
        }
      });
      setBooks(storedBooks);
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Combine selectedDate (YYYY-MM-DD) and newBookTime into one Date.
  const getCombinedDueDate = () => {
    if (!selectedDate) throw new Error("No date selected");
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day, newBookTime.getHours(), newBookTime.getMinutes(), newBookTime.getSeconds());
  };

  const scheduleDeadlineNotification = async (title, dueDate) => {
    if (!(await areNotificationsEnabled())) {
      console.log("Notifications are disabled; skipping scheduling for", title);
      return;
    }
    const now = new Date();
    if (dueDate.getTime() <= now.getTime()) {
      console.warn(`Due date for "${title}" is in the past. Not scheduling notification.`);
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Deadline Reminder",
          body: `Your book "${title}" is due!`,
          sound: 'default',
        },
        trigger: dueDate,
      });
      console.log(`Notification scheduled for "${title}" at ${dueDate.toLocaleString()}.`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // Custom confirmation alert for finished reading.
  const handleFinishedReading = (book) => {
    setSelectedBookForAlert(book);
    setConfirmAlertVisible(true);
  };

  const handleSetReminder = (selectedTime) => {
    const currentTime = new Date(newBookTime);
    const t = new Date(selectedTime);
    currentTime.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
    setNewBookTime(currentTime);
    setShowReminderPicker(false);
    setIsReminder(true);
  };

  const handleCancelReminder = () => {
    setShowReminderPicker(false);
  };

  // Function for adding a new reminder.
  const handleAddBook = async () => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date from the calendar.");
      return;
    }
    let dueDateObj;
    try {
      dueDateObj = getCombinedDueDate();
    } catch (error) {
      Alert.alert("Error", error.message);
      return;
    }
    const dueDateISO = dueDateObj.toISOString();
    try {
      await addBook(newBookTitle, newBookAuthor, isReminder ? 'reminder' : 'General', 'pending', dueDateISO);
      if (isReminder) await scheduleDeadlineNotification(newBookTitle, dueDateObj);
      await fetchBooks();
      setSelectedDate('');
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookTime(new Date());
      setIsReminder(false);
      setShowAddModal(false);
      // Show custom success alert.
      setSuccessMessage("Book successfully added!");
      setSuccessAlertVisible(true);
      setTimeout(() => setSuccessAlertVisible(false), 2000);
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  // Function for updating an existing book's deadline.
  const handleUpdateDeadline = async () => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a new deadline date.");
      return;
    }
    let dueDateObj;
    try {
      dueDateObj = getCombinedDueDate();
    } catch (error) {
      Alert.alert("Error", error.message);
      return;
    }
    const dueDateISO = dueDateObj.toISOString();
    try {
      await updateBookDeadline(editingBook.id, dueDateISO);
      await scheduleDeadlineNotification(newBookTitle, dueDateObj);
      setSuccessMessage("Book deadline successfully updated!");
      setSuccessAlertVisible(true);
      setTimeout(() => setSuccessAlertVisible(false), 2000);
      setEditingBook(null);
      await fetchBooks();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error updating deadline:", error);
    }
  };

  const filteredBooks = selectedDate
    ? books.filter(
        (book) =>
          book.dueDate &&
          new Date(book.dueDate).toISOString().split('T')[0] === selectedDate
      )
    : books.filter((book) => book.dueDate);

  // Handler for date picker (for updating deadline date)
  const onChangeDate = (event, selectedDateValue) => {
    setShowDatePicker(false);
    if (event.type !== 'dismissed' && selectedDateValue) {
      const year = selectedDateValue.getFullYear();
      const month = selectedDateValue.getMonth() + 1;
      const day = selectedDateValue.getDate();
      const dateString = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      setSelectedDate(dateString);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={{ color: currentTheme.text }}>Loading books...</Text>
      </View>
    );
  }

  return (
    <Animatable.View animation="fadeIn" duration={800} style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Calendar Container */}
      <View style={[styles.calendarContainer, { backgroundColor: isDark ? currentTheme.background : "#F3F0FF" }]}>
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            const defaultTime = new Date(day.year, day.month - 1, day.day, 9, 0, 0);
            setNewBookTime(defaultTime);
            // Clear any update mode.
            setEditingBook(null);
            setShowAddModal(true);
          }}
          theme={{
            backgroundColor: isDark ? currentTheme.background : "#F3F0FF",
            calendarBackground: isDark ? currentTheme.background : "#F3F0FF",
            textSectionTitleColor: currentTheme.text,
            selectedDayBackgroundColor: currentTheme.primary,
            selectedDayTextColor: currentTheme.background,
            todayTextColor: currentTheme.primary,
            dayTextColor: currentTheme.text,
            textDisabledColor: '#d9e1e8',
            dotColor: currentTheme.primary,
            selectedDotColor: currentTheme.background,
            arrowColor: currentTheme.primary,
            monthTextColor: currentTheme.text,
            indicatorColor: currentTheme.primary,
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
            'stylesheet.calendar.header': {
              header: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? currentTheme.background : "#F3F0FF",
                paddingHorizontal: 10,
                paddingVertical: 5,
              },
              monthText: {
                fontSize: 20,
                fontWeight: 'bold',
                color: currentTheme.text,
              },
              arrow: {
                tintColor: currentTheme.primary,
                width: 24,
                height: 24,
              },
            },
          }}
        />
      </View>

      {/* Book List */}
      <Animatable.Text animation="fadeInUp" duration={800} style={[styles.header, { color: currentTheme.text }]}>
        📚 Your Books
      </Animatable.Text>
      {filteredBooks.length === 0 ? (
        <Text style={[styles.noBooks, { color: currentTheme.text }]}>
          {selectedDate ? 'No books for selected date.' : 'No books added yet.'}
        </Text>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Animatable.View animation="fadeInUp" duration={600} style={[styles.bookItem, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.title, { color: currentTheme.text }]}>{item.title}</Text>
              <Text style={[styles.dueDate, { color: currentTheme.text }]}>
                Due: {new Date(item.dueDate).toLocaleString()}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => deleteBook(item.id, fetchBooks)}
                  style={[styles.deleteButton, { backgroundColor: currentTheme.primary }]}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFinishedReading(item)}
                  style={[styles.finishedButton, { backgroundColor: darkPurple }]}
                >
                  <Text style={styles.finishedButtonText}>Finished Reading</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          )}
        />
      )}

      {/* Modal for Adding a Reminder / Extending Deadline */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingBook(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={800} style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.modalHeader, { color: currentTheme.text }]}>
              {editingBook ? `Extend Deadline for ${editingBook.title}` : `Add Reminder for ${selectedDate}`}
            </Text>
            {editingBook ? (
              <>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                  Title: {newBookTitle}
                </Text>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                  Author: {newBookAuthor}
                </Text>
                <Text style={[styles.reminderLabel, { color: currentTheme.text }]}>
                  Deadline Date: {selectedDate}
                </Text>
                <TouchableOpacity
                  style={[styles.remindMeButton, { backgroundColor: newColors.primary }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.remindMeText, { color: newColors.text }]}>
                    Change Date
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    testID="datePicker"
                    value={new Date(selectedDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDate}
                  />
                )}
                <Text style={[styles.reminderLabel, { color: currentTheme.text }]}>
                  Deadline Time: {newBookTime.toLocaleTimeString()}
                </Text>
                <TouchableOpacity
                  style={[styles.remindMeButton, { backgroundColor: newColors.primary }]}
                  onPress={() => setShowReminderPicker(true)}
                >
                  <Text style={[styles.remindMeText, { color: newColors.text }]}>
                    Change Time
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { borderColor: currentTheme.primary, color: currentTheme.text, backgroundColor: currentTheme.background }]}
                  placeholder="Book Title"
                  placeholderTextColor={currentTheme.text}
                  value={newBookTitle}
                  onChangeText={setNewBookTitle}
                />
                <TextInput
                  style={[styles.input, { borderColor: currentTheme.primary, color: currentTheme.text, backgroundColor: currentTheme.background }]}
                  placeholder="Author"
                  placeholderTextColor={currentTheme.text}
                  value={newBookAuthor}
                  onChangeText={setNewBookAuthor}
                />
                <Text style={[styles.reminderLabel, { color: currentTheme.text }]}>
                  Reminder Time: {newBookTime.toLocaleTimeString()}
                </Text>
                <TouchableOpacity
                  style={[styles.remindMeButton, { backgroundColor: newColors.primary }]}
                  onPress={() => setShowReminderPicker(true)}
                >
                  <Text style={[styles.remindMeText, { color: newColors.text }]}>
                    Select Reminder
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {showReminderPicker && (
              <ReminderPicker
                onSetReminder={handleSetReminder}
                onCancel={handleCancelReminder}
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.customModalButton, { backgroundColor: newColors.primary }]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingBook(null);
                }}
              >
                <Text style={styles.customModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customModalButton, { backgroundColor: newColors.secondary }]}
                onPress={editingBook ? handleUpdateDeadline : handleAddBook}
              >
                <Text style={styles.customModalButtonText}>
                  {editingBook ? "Update Deadline" : "Set Reminder"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>

      {/* Custom success alert modal */}
      {successAlertVisible && (
        <Modal
          visible={successAlertVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSuccessAlertVisible(false)}
        >
          <View style={styles.successAlertOverlay}>
            <View style={styles.successAlertContainer}>
              <Text style={styles.successAlertText}>{successMessage}</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom confirmation alert modal */}
      {confirmAlertVisible && (
        <Modal
          visible={confirmAlertVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setConfirmAlertVisible(false)}
        >
          <View style={styles.confirmAlertOverlay}>
            <View style={styles.confirmAlertContainer}>
              <Text style={styles.confirmAlertTitle}>Finished Reading</Text>
              <Text style={styles.confirmAlertMessage}>
                Are you sure you finished reading this book?
              </Text>
              <View style={styles.confirmAlertButtons}>
                <TouchableOpacity
                  style={styles.confirmAlertButtonNo}
                  onPress={() => {
                    setConfirmAlertVisible(false);
                    // Set update mode for extending deadline.
                    setEditingBook(selectedBookForAlert);
                    setNewBookTitle(selectedBookForAlert.title);
                    setNewBookAuthor(selectedBookForAlert.author);
                    setNewBookTime(new Date(selectedBookForAlert.dueDate));
                    setSelectedDate(new Date(selectedBookForAlert.dueDate).toISOString().split('T')[0]);
                    setShowAddModal(true);
                  }}
                >
                  <Text style={styles.confirmAlertButtonText}>No, extend deadline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmAlertButtonYes}
                  onPress={async () => {
                    setConfirmAlertVisible(false);
                    await deleteBook(selectedBookForAlert.id, fetchBooks);
                    navigation.navigate("AddBookScreen", { book: selectedBookForAlert });
                  }}
                >
                  <Text style={styles.confirmAlertButtonText}>Yes, finished reading</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  calendarContainer: {
    marginVertical: 10,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  noBooks: {
    fontSize: 18,
    textAlign: 'center',
  },
  bookItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dueDate: {
    fontSize: 16,
    marginVertical: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  finishedButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  finishedButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  reminderLabel: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  remindMeButton: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  remindMeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  customModalButtonText: {
    color: newColors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Custom success alert styles
  successAlertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successAlertContainer: {
    width: '80%',
    backgroundColor: newColors.secondary,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  successAlertText: {
    color: newColors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Custom confirmation alert styles
  confirmAlertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmAlertContainer: {
    width: '80%',
    backgroundColor: newColors.secondary,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmAlertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: newColors.text,
  },
  confirmAlertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: newColors.text,
  },
  confirmAlertButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmAlertButtonNo: {
    backgroundColor: newColors.primary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  confirmAlertButtonYes: {
    backgroundColor: newColors.background,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  confirmAlertButtonText: {
    color: newColors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BookCalendarScreen;
