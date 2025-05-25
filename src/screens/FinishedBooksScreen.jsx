import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getDbConnection,
  getLatestProgress,
  deleteBook,
  toggleFavorite
} from '../database/db';
import { useTheme } from '../context/ThemeContext';
import CustomAlert from '../context/CustomAlert';

const FinishedBooksScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState({ visible:false, id:null });
  const [layout, setLayout] = useState('small');

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      async function load() {
        const db = await getDbConnection();
        const all = await db.getAllAsync("SELECT * FROM books WHERE status = 'I''ve Read It All';");
        const withProg = await Promise.all(
          all.map(async b => {
            const latest = await getLatestProgress(b.id);
            return { ...b, latest };
          })
        );
        if (!active) return;
        setBooks(withProg);
        setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [])
  );

  const renderStars = (item) => (
    item.rating > 0 && (
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {[1,2,3,4,5].map(i => (
          <Ionicons
            key={i}
            name={i <= item.rating ? 'star' : 'star-outline'}
            size={18}
            color={'#FFD700'}
            style={{ marginHorizontal: 1 }}
          />
        ))}
      </View>
    )
  );

  const handleFavorite = async (id, currentFavorite) => {
    await toggleFavorite(id, currentFavorite);
    navigation.navigate('Main', { screen: 'Favorites' });
  };

  const confirmDelete = async () => {
    await deleteBook(alert.id);
    setAlert({ visible:false, id:null });
    setLoading(true);
  };

  if (loading) {
    return (
      <View style={[styles.loader,{ backgroundColor: theme.background }]}> 
        <ActivityIndicator size="large" color={theme.secondary} />
      </View>
    );
  }

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.outer,{ backgroundColor: theme.background }]}>
      <View style={styles.layoutButtons}>
        <Text style={[styles.layoutLabel, { color: theme.text }]}>Layout:</Text>
        <TouchableOpacity
          style={[styles.layoutButton, layout === 'small' && styles.layoutButtonActive, { borderColor: theme.secondary, backgroundColor: layout === 'small' ? theme.secondary : 'transparent' }]} 
          onPress={() => setLayout('small')}
        >
          <Text style={[styles.layoutButtonText, { color: layout === 'small' ? theme.buttonText : theme.text }]}>Small</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layoutButton, layout === 'medium' && styles.layoutButtonActive, { borderColor: theme.secondary, marginLeft: 10, backgroundColor: layout === 'medium' ? theme.secondary : 'transparent' }]} 
          onPress={() => setLayout('medium')}
        >
          <Text style={[styles.layoutButtonText, { color: layout === 'medium' ? theme.buttonText : theme.text }]}>Medium</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.header,{ color: theme.text }]}>Finished Books</Text>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={22} color={theme.text} />
        <TextInput
          style={[styles.searchInput,{ borderColor: theme.secondary, color: theme.text }]}
          placeholder="Search by title, author, or category"
          placeholderTextColor={theme.text}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {filtered.length === 0 ? (
        <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40, fontSize: 16 }}>
          No finished books found.
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, layout === 'medium' && styles.cardMedium, { backgroundColor: theme.cardBackground, flexDirection: layout === 'small' ? 'row' : 'column' }]}
              onPress={()=>navigation.navigate('BookDetails',{ bookId:item.id })}
            >
              {item.coverImage
                ? <Image style={[styles.cover, layout === 'medium' && styles.coverMedium]} source={{ uri: item.coverImage }} />
                : <Ionicons name="image" size={layout === 'small' ? 80 : 120} color={theme.text} style={layout === 'medium' && styles.coverPlaceholderMedium} />
              }
              <View style={[styles.info, layout === 'medium' && styles.infoMedium]}>
                <Text style={[styles.title,{ color: theme.text, fontSize: layout === 'small' ? 18 : 22 }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.author,{ color: theme.text, fontSize: layout === 'small' ? 14 : 16 }]}>
                  by {item.author}
                </Text>
                {renderStars(item)}
              </View>
              <View style={[styles.actions, layout === 'medium' && styles.actionsMedium]}>
                <TouchableOpacity onPress={()=>handleFavorite(item.id, item.favorite)}>
                  <Ionicons
                    name={item.favorite?'heart':'heart-outline'}
                    size={layout === 'small' ? 24 : 28}
                    color={item.favorite? '#FF3B30': theme.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={()=>setAlert({ visible:true, id:item.id })}
                  style={{ marginLeft: layout === 'small' ? 12 : 16 }}
                >
                  <Ionicons name="trash" size={layout === 'small' ? 24 : 28} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <CustomAlert
        visible={alert.visible}
        title="Delete Book"
        message="Are you sure?"
        onConfirm={confirmDelete}
        onCancel={()=>setAlert({ visible:false, id:null })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outer:{ flex:1 },
  loader:{ flex:1, justifyContent:'center', alignItems:'center' },
  header:{ fontSize:20,fontWeight:'bold',padding:20 },
  searchRow:{ flexDirection:'row',alignItems:'center',paddingHorizontal:20,marginBottom:10 },
  searchInput:{ flex:1,borderWidth:1,borderRadius:8,padding:8,marginLeft:10,fontSize:16 },
  list:{ paddingHorizontal:20,paddingBottom:20 },
  card:{ flexDirection:'row',padding:10,borderRadius:12,marginBottom:15,overflow:'hidden',alignItems:'center' },
  cover:{ width:80,height:120,borderRadius:8,marginRight:10 },
  info:{ flex:1 },
  title:{ fontSize:18,fontWeight:'bold' },
  author:{ fontSize:14,marginBottom:6 },
  actions:{ flexDirection:'row',alignItems:'center' },
  layoutButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
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
  layoutButtonActive: {
    // Styles for active button (handled inline for dynamic color)
  },
  layoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardMedium: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 15,
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
  infoMedium: {
    flex: 0,
    marginBottom: 10,
  },
  actionsMedium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});

export default FinishedBooksScreen; 