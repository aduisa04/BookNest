// EditBookScreen.jsx

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  Alert
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions, PermissionStatus } from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, getCategories } from '../database/db';
import { useTheme } from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';

const newColors = {
  primary: "#C8B6FF",
  secondary: "#B8C0FF",
  text: "#333333",
  background: "#FFFFFF",
};

const EditBookScreen = () => {
  const navigation = useNavigation();
  const { bookId } = useRoute().params;
  const { theme } = useTheme();
  const currentTheme = {
    background: theme.background || newColors.background,
    text: theme.text || newColors.text,
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    inputBackground: theme.inputBackground || newColors.background,
  };

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('To Read');
  const [description, setDescription] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [progressMode, setProgressMode] = useState('pages');
  const [coverImage, setCoverImage] = useState(null);

  // fetch existing book + categories on focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      async function load() {
        const db = await getDbConnection();
        const b = await db.getFirstAsync('SELECT * FROM books WHERE id=?;', [bookId]);
        const cats = await getCategories();
        if (!active) return;
        setCategories(cats);
        setSelectedCategory(b.category);
        setTitle(b.title);
        setAuthor(b.author);
        setStatus(b.status);
        setDescription(b.description);
        setTotalPages(String(b.totalPages));
        setProgressMode(b.progressMode);
        setCoverImage(b.coverImage);
      }
      load();
      return () => { active = false; };
    }, [bookId])
  );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== PermissionStatus.GRANTED) {
      return Alert.alert("Permission required", "Gallery access required");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7
    });
    if (!result.canceled && result.assets.length) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!title || !author || !selectedCategory || !status || !totalPages) {
      return Alert.alert('Error','Please fill all fields');
    }
    const db = await getDbConnection();
    await db.runAsync(
      `UPDATE books SET
         title=?, author=?, category=?, status=?,
         description=?, coverImage=?, totalPages=?, progressMode=?
       WHERE id=?;`,
      [
        title, author, selectedCategory, status,
        description, coverImage, parseInt(totalPages,10), progressMode,
        bookId
      ]
    );
    Alert.alert('Success','Book updated');
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <AppHeader title="Edit Book" navigation={navigation} />
      <ScrollView
        style={[styles.outer]}
        contentContainerStyle={[styles.inner, { marginTop: 0, padding: 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={[styles.input,{
            backgroundColor:currentTheme.inputBackground,
            color:currentTheme.text,
            borderColor:currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        <TextInput
          placeholder="Author"
          value={author}
          onChangeText={setAuthor}
          style={[styles.input,{
            backgroundColor:currentTheme.inputBackground,
            color:currentTheme.text,
            borderColor:currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        {/* Category Picker */}
        <Text style={[styles.label,{color:currentTheme.text}]}>Category</Text>
        <View style={[styles.pickerWrap,{borderColor:currentTheme.primary}]}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={{color:currentTheme.text}}
          >
            {categories.map(cat => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.label,{color:currentTheme.text}]}>Total Pages</Text>
        <TextInput
          placeholder="e.g. 320"
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="numeric"
          style={[styles.input,{
            backgroundColor:currentTheme.inputBackground,
            color:currentTheme.text,
            borderColor:currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        <Text style={[styles.label,{color:currentTheme.text}]}>Record Progress By</Text>
        <View style={[styles.pickerWrap,{borderColor:currentTheme.primary}]}>
          <Picker
            selectedValue={progressMode}
            onValueChange={setProgressMode}
            style={{color:currentTheme.text}}
          >
            <Picker.Item label="By Pages" value="pages" />
            <Picker.Item label="By Percentage" value="percentage" />
          </Picker>
        </View>

        <Text style={[styles.label,{color:currentTheme.text}]}>Status</Text>
        <View style={[styles.pickerWrap,{borderColor:currentTheme.primary}]}>
          <Picker
            selectedValue={status}
            onValueChange={setStatus}
            style={{color:currentTheme.text}}
          >
            <Picker.Item label="To Read" value="To Read" />
            <Picker.Item label="Reading" value="Reading" />
            <Picker.Item label="I've Read It All" value="I've Read It All" />
            <Picker.Item label="Gave Up" value="Gave Up" />
          </Picker>
        </View>

        <Text style={[styles.label,{color:currentTheme.text}]}>Description</Text>
        <TextInput
          placeholder="Short description…"
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input,styles.textArea,{
            backgroundColor:currentTheme.inputBackground,
            color:currentTheme.text,
            borderColor:currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        <TouchableOpacity
          style={[styles.imgBtn,{backgroundColor:currentTheme.secondary}]}
          onPress={pickImage}
        >
          <Text style={{color:currentTheme.text}}>
            {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
          </Text>
        </TouchableOpacity>
        {coverImage && (
          <Image source={{uri:coverImage}} style={styles.cover} />
        )}

        <TouchableOpacity
          style={[styles.saveBtn,{backgroundColor:currentTheme.secondary}]}
          onPress={handleUpdate}
        >
          <Ionicons name="save-outline" size={20} color={currentTheme.text} />
          <Text style={[styles.saveText,{color:currentTheme.text}]}> Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outer:{flex:1},
  inner:{padding:20},
  input:{borderWidth:1,padding:12,marginBottom:15,borderRadius:8,fontSize:16},
  textArea:{height:100,textAlignVertical:'top'},
  label:{fontSize:16,fontWeight:'600',marginBottom:5},
  pickerWrap:{borderWidth:1,borderRadius:8,marginBottom:15,overflow:'hidden'},
  imgBtn:{padding:12,alignItems:'center',borderRadius:30,marginBottom:10},
  cover:{width:'100%',height:200,borderRadius:10,marginBottom:15},
  saveBtn:{flexDirection:'row',padding:14,alignItems:'center',justifyContent:'center',borderRadius:30},
  saveText:{fontSize:16,fontWeight:'bold',marginLeft:6},
});

export default EditBookScreen;
