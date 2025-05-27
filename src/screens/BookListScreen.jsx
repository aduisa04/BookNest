// src/screens/BookListScreen.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getDbConnection,
  deleteBook,
  toggleFavorite,
  getLatestProgress,
} from '../database/db';
import CustomAlert from '../context/CustomAlert';
import { useTheme } from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ProgressBar Component
const BookProgressBar = ({ pct, theme }) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pct >= 0) {
      Animated.timing(animatedProgress, {
        toValue: pct,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [pct]);

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressBarBackground}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: animatedProgress.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={{ color: theme.text, fontSize: 10, marginLeft: 8 }}>{pct}%</Text>
    </View>
  );
};

const BookListScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [books, setBooks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState({ visible: false, id: null });
  const [layout, setLayout] = useState('small');
  const [successAlert, setSuccessAlert] = useState({ visible: false, message: '' });

  // Fetch books with pagination
  const fetchBooks = async (loadMore = false) => {
    if (loadMore && (loading || loadingMore || !hasMore)) return;

    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const db = await getDbConnection();
      const offset = loadMore ? page * pageSize : 0;
      const rows = await db.getAllAsync(
        `SELECT * FROM books ORDER BY id DESC LIMIT ${pageSize} OFFSET ${offset};`
      );

      const withProg = await Promise.all(
        rows.map(async (b) => {
          const latest = await getLatestProgress(b.id);
          return { ...b, latest };
        })
      );

      if (loadMore) {
        setBooks((prev) => [...prev, ...withProg]);
        setPage((prev) => prev + 1);
      } else {
        setBooks(withProg);
        setPage(1);
      }

      setHasMore(withProg.length === pageSize);

      if (!loadMore) {
        const total = await db.getAllAsync('SELECT COUNT(*) as cnt FROM books;');
        setCount(total[0].cnt);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      loadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setHasMore(true);
      fetchBooks();
    }, [])
  );

  const confirmDelete = async () => {
    await deleteBook(alert.id, fetchBooks);
    setAlert({ visible: false, id: null });
    setSuccessAlert({ visible: true, message: 'Book deleted successfully!' });
  };

  const handleFavorite = async (id, currentFavorite) => {
    await toggleFavorite(id, currentFavorite);
    navigation.navigate('Main', { screen: 'Favorites' });
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.secondary} />
      </View>
    );
  }

  const filtered = books.filter(
    (b) =>
      b.latest?.percentage !== 100 &&
      (
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader title="Book List" navigation={navigation} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 20 },
        ]}
        onEndReached={() => fetchBooks(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loadingMore ? (
            <ActivityIndicator style={{ margin: 20 }} color={theme.secondary} />
          ) : (
            // Extra blank space so you can scroll past last item
            <View style={{ height: insets.bottom + 20 }} />
          )
        }
        ListHeaderComponent={() => (
          <View style={{ paddingVertical: 10, paddingHorizontal: 20 }}>
            <View style={[styles.layoutButtons, { marginBottom: 10 }]}>
              <Text style={[styles.layoutLabel, { color: theme.text }]}>
                Layout:
              </Text>
              <TouchableOpacity
                style={[
                  styles.layoutButton,
                  layout === 'small' && styles.layoutButtonActive,
                  {
                    borderColor: theme.secondary,
                    backgroundColor:
                      layout === 'small' ? theme.secondary : 'transparent',
                  },
                ]}
                onPress={() => setLayout('small')}
              >
                <Text
                  style={[
                    styles.layoutButtonText,
                    {
                      color:
                        layout === 'small' ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  Small
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.layoutButton,
                  layout === 'medium' && styles.layoutButtonActive,
                  {
                    borderColor: theme.secondary,
                    marginLeft: 10,
                    backgroundColor:
                      layout === 'medium' ? theme.secondary : 'transparent',
                  },
                ]}
                onPress={() => setLayout('medium')}
              >
                <Text
                  style={[
                    styles.layoutButtonText,
                    {
                      color:
                        layout === 'medium' ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.viewFinishedButton, { backgroundColor: theme.secondary }]}
              onPress={() => navigation.navigate('FinishedBooks')}
            >
              <Text style={[styles.viewFinishedButtonText, { color: theme.text }]}>
                View Finished Books
              </Text>
            </TouchableOpacity>
            <Text style={[styles.header, { color: theme.text }]}>
              Books Added: {count}
            </Text>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={22} color={theme.text} />
              <TextInput
                style={[styles.searchInput, { borderColor: theme.secondary, color: theme.text }]}
                placeholder="Search by title, author, or category"
                placeholderTextColor={theme.text}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              layout === 'medium' && styles.cardMedium,
              {
                backgroundColor: theme.cardBackground,
                flexDirection: layout === 'small' ? 'row' : 'column',
              },
            ]}
            onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
          >
            {item.coverImage ? (
              <Image
                style={[styles.cover, layout === 'medium' && styles.coverMedium]}
                source={{ uri: item.coverImage }}
              />
            ) : (
              <Ionicons
                name="image"
                size={layout === 'small' ? 80 : 120}
                color={theme.text}
                style={layout === 'medium' && styles.coverPlaceholderMedium}
              />
            )}
            <View style={[styles.info, layout === 'medium' && styles.infoMedium]}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.text,
                    fontSize: layout === 'small' ? 18 : 22,
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.author,
                  {
                    color: theme.text,
                    fontSize: layout === 'small' ? 14 : 16,
                  },
                ]}
              >
                by {item.author}
              </Text>
              <BookProgressBar
                pct={
                  item.progressMode === 'percentage'
                    ? Math.round(item.latest?.percentage ?? 0)
                    : Math.round(
                        ((item.latest?.endPage ?? 0) / (item.totalPages || 1)) * 100
                      )
                }
                theme={theme}
              />
            </View>
            <View style={[styles.actions, layout === 'medium' && styles.actionsMedium]}>
              <TouchableOpacity onPress={() => handleFavorite(item.id, item.favorite)}>
                <Ionicons
                  name={item.favorite ? 'heart' : 'heart-outline'}
                  size={layout === 'small' ? 24 : 28}
                  color={item.favorite ? '#FF3B30' : theme.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAlert({ visible: true, id: item.id })}
                style={{ marginLeft: layout === 'small' ? 12 : 16 }}
              >
                <Ionicons name="trash" size={layout === 'small' ? 24 : 28} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          filtered.length === 0 ? (
            <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40, fontSize: 16 }}>
              No matches found.
            </Text>
          ) : null
        }
      />

      <CustomAlert
        visible={alert.visible}
        title="Delete Book"
        message="Are you sure?"
        onConfirm={confirmDelete}
        onCancel={() => setAlert({ visible: false, id: null })}
      />
      <CustomAlert
        visible={successAlert.visible}
        title="Success"
        message={successAlert.message}
        onConfirm={() => setSuccessAlert({ visible: false, message: '' })}
        showCancelButton={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginLeft: 10,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    alignItems: 'center',
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  coverMedium: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
    marginRight: 0,
  },
  coverPlaceholderMedium: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  info: {
    flex: 1,
    minHeight: 60,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  infoMedium: {
    width: '100%',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsMedium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    height: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'blue',
  },
  layoutButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: 20,
    marginBottom: 10,
  },
  layoutLabel: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  layoutButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  layoutButtonActive: {},
  viewFinishedButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewFinishedButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BookListScreen;
