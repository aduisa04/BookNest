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
import { getBooksFromDatabase, addBook, deleteBook } from '../database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

// Define the default color scheme (fallback for light mode)
const newColors = {
  primary: "#C8B6FF",
  secondary: "#B8C0FF",
  text: "#333333",
  background: "#FFFFFF",
};

// Define dark purple for the ReminderPicker buttons
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
  // Use the theme to apply dark mode colors
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
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    const newTime = selectedTime || time;
    setTime(newTime);
    if (Platform.OS === 'android') {
      onSetReminder(newTime);
    }
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
          is24Hour={false}  // Shows AM/PM on supported devices
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
      <View style={reminderStyles.actionButtons}>
        <Button onPress={() => onSetReminder(time)} title="Set Reminder" color={darkPurple} />
        <Button onPress={onCancel} title="Cancel" color={darkPurple} />
      </View>
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
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

function BookCalendarScreen() {
  // Get the current theme from context and define fallback values
  const { theme } = useTheme();
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
  // newBookTime stores only the time portion; the date comes from selectedDate.
  const [newBookTime, setNewBookTime] = useState(new Date());
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [isReminder, setIsReminder] = useState(false);

  // Request notification permissions and set a notification handler.
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

  // Fetch books from the database and update calendar marks.
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

  // Combine the selected calendar date with the chosen time using local time.
  const getCombinedDueDate = () => {
    if (!selectedDate) {
      throw new Error("No date selected");
    }
    const [year, month, day] = selectedDate.split('-').map(Number);
    const combinedDate = new Date(
      year,
      month - 1,
      day,
      newBookTime.getHours(),
      newBookTime.getMinutes(),
      newBookTime.getSeconds()
    );
    return combinedDate;
  };

  // Schedule a notification at the exact due date using a Date object as trigger.
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

  // Callback when the reminder time is set from the ReminderPicker.
  const handleSetReminder = (selectedTime) => {
    const currentTime = new Date(newBookTime);
    const t = new Date(selectedTime);
    currentTime.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
    setNewBookTime(currentTime);
    setShowReminderPicker(false);
    setIsReminder(true);
  };

  // Cancel the ReminderPicker.
  const handleCancelReminder = () => {
    setShowReminderPicker(false);
  };

  // Handle setting the reminder (save the reminder and schedule notification).
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
      if (isReminder) {
        await scheduleDeadlineNotification(newBookTitle, dueDateObj);
      }
      await fetchBooks();
      // Reset modal state.
      setSelectedDate('');
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookTime(new Date());
      setIsReminder(false);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  // Filter books: if a date is selected, show books for that date; otherwise, show all books.
  const filteredBooks = selectedDate
    ? books.filter(
        (book) =>
          book.dueDate &&
          new Date(book.dueDate).toISOString().split('T')[0] === selectedDate
      )
    : books.filter((book) => book.dueDate);

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
      {/* Calendar View */}
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          const defaultTime = new Date(day.year, day.month - 1, day.day, 9, 0, 0);
          setNewBookTime(defaultTime);
          setShowAddModal(true);
        }}
        theme={{
          backgroundColor: currentTheme.background,
          calendarBackground: currentTheme.background,
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
        }}
      />

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
              <TouchableOpacity
                onPress={() => deleteBook(item.id, fetchBooks)}
                style={[styles.deleteButton, { backgroundColor: currentTheme.primary }]}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
        />
      )}

      {/* Modal for Adding a Reminder */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={800} style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.modalHeader, { color: currentTheme.text }]}>
              Add Reminder for {selectedDate}
            </Text>
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
              style={[styles.remindMeButton, { backgroundColor: darkPurple }]}
              onPress={() => setShowReminderPicker(true)}
            >
              <Text style={[styles.remindMeText, { color: currentTheme.background }]}>
                Select Reminder
              </Text>
            </TouchableOpacity>
            {showReminderPicker && (
              <ReminderPicker
                onSetReminder={handleSetReminder}
                onCancel={handleCancelReminder}
              />
            )}
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setShowAddModal(false)} />
              <Button title="Set Reminder" onPress={handleAddBook} />
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
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
});

export default BookCalendarScreen;
