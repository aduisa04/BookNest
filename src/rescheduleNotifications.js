// BookNest/src/rescheduleNotifications.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBooksFromDatabase } from './database/db';

export const rescheduleNotifications = async () => {
  try {
    const notificationsEnabled = (await AsyncStorage.getItem('notificationsEnabled')) === 'true';
    if (!notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Notifications are disabled. All scheduled notifications have been cancelled.");
      return;
    }
    const books = await getBooksFromDatabase();
    const now = new Date();
    books.forEach(async (book) => {
      if (book.dueDate) {
        const dueDate = new Date(book.dueDate);
        if (dueDate > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Deadline Reached",
              body: `Your book "${book.title}" deadline has arrived!`,
            },
            trigger: { date: dueDate },
          });
          console.log(`Notification rescheduled for "${book.title}" at ${dueDate.toLocaleString()}`);
        }
      }
    });
  } catch (error) {
    console.error("Error in rescheduling notifications:", error);
  }
};
