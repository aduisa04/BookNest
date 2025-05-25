// src/screens/BookDetailsScreen.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import {
  getDbConnection,
  getLogsForBook,
  getLatestProgress,
  addReadingLog,
  updateBookProgress,
  updateBookRating
} from '../database/db';
import { useTheme } from '../context/ThemeContext';

const newColors = {
  primary: "#C8B6FF",
  secondary: "#B8C0FF",
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonText: "#FFFFFF",
};

const BookDetailsScreen = () => {
  const navigation = useNavigation();
  const { bookId } = useRoute().params;
  const { theme } = useTheme();
  const ct = {
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    text: theme.text || newColors.text,
    background: theme.background || newColors.background,
    cardBackground: theme.cardBackground || newColors.cardBackground,
    buttonText: theme.buttonText || newColors.buttonText,
  };

  const [book, setBook] = useState(null);
  const [logs, setLogs] = useState([]);

  const reload = useCallback(async () => {
    const db = await getDbConnection();
    const b = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);
    const latest = await getLatestProgress(bookId);
    const allLogs = await getLogsForBook(bookId);
    setBook({ ...b, latest });
    setLogs(allLogs);
  }, [bookId]);

  useFocusEffect(
    React.useCallback(() => { reload(); }, [reload])
  );

  // timer state
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // modals
  const [noteModal, setNoteModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [progressFrom, setProgressFrom] = useState('');
  const [progressTo, setProgressTo] = useState('');
  const [progressPct, setProgressPct] = useState('');
  const [progressError, setProgressError] = useState('');
  const [readPages, setReadPages] = useState(new Set());
  const [nextUnreadPage, setNextUnreadPage] = useState(1);

  // note state
  const [noteText, setNoteText] = useState('');
  const [noteEmoji, setNoteEmoji] = useState('');
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

  // save session
  const [pickedPages, setPickedPages] = useState('0');
  const [pickedStatus, setPickedStatus] = useState('To Read');
  const [sessionError, setSessionError] = useState('');

  // Star rating modal state
  const [showCongrats, setShowCongrats] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  // Helper: Build set of read pages from logs
  const computeReadPages = (logs) => {
    const pages = new Set();
    logs.forEach(l => {
      if (l.endPage && l.endPage > 0) {
        const start = l.startPage || 1;
        for (let p = start; p <= l.endPage; ++p) pages.add(p);
      }
    });
    return pages;
  };

  // Helper: Find next unread page
  const computeNextUnreadPage = (pagesSet, totalPages) => {
    for (let i = 1; i <= totalPages; ++i) {
      if (!pagesSet.has(i)) return i;
    }
    return totalPages + 1;
  };

  // When logs change, update readPages and nextUnreadPage
  React.useEffect(() => {
    if (logs && book && book.progressMode === 'pages') {
      const pages = computeReadPages(logs);
      setReadPages(pages);
      setNextUnreadPage(computeNextUnreadPage(pages, book.totalPages));
    }
  }, [logs, book]);

  // Calculate percent based on progressMode
  const percent = book
    ? (book.progressMode === 'percentage'
        ? (book.latest?.percentage || 0)
        : Math.round(((book.latest?.endPage || 0) / (book.totalPages || 1)) * 100))
    : 0;

  // Show congrats modal if finished and not rated
  React.useEffect(() => {
    if (!book) return;
    if (percent === 100 && book.status !== "I've Read It All") {
      // Automatically set status to Finished
      updateBookProgress(book.id, "I've Read It All");
    }
    if (percent === 100 && !showCongrats && !hasRated && book.rating === 0) {
      setShowCongrats(true);
    }
    if (book.rating > 0) setHasRated(true);
  }, [percent, book, showCongrats, hasRated]);

  // Save star rating
  const handleSaveRating = async (stars) => {
    await updateBookRating(book.id, stars);
    setShowCongrats(false);
    setHasRated(true);
    await reload();
  };

  if (!book) return <Text style={[styles.loading, { color: ct.text }]}>Loading…</Text>;

  const openNote = () => {
    setNoteText('');
    setNoteEmoji('');
    setNoteModal(true);
  };
  const saveNote = async () => {
    await addReadingLog({
      bookId, type: 'note',
      startPage: null, endPage: null,
      percentage: null,
      description: noteText,
      sessionDuration: null,
      status: book.status,
      emoji: noteEmoji
    });
    setNoteModal(false);
    await reload();
  };

  const startSession = () => {
    setElapsed(0);
    setRunning(true);
    setSessionModal(true);
  };
  const doneSession = () => {
    setRunning(false);
    setSessionModal(false);
    setSaveModal(true);
    if (book && book.progressMode === 'pages') {
      setPickedPages(String(nextUnreadPage));
    }
    setSessionError('');
  };
  const saveSession = async () => {
    let endPage = null;
    let percentage = null;
    if (book.progressMode === 'pages') {
      endPage = +pickedPages || 0;
      percentage = (endPage / (book.totalPages || 1)) * 100;
      if (readPages.has(endPage)) {
        setSessionError(`Page ${endPage} already logged.`);
        return;
      }
    } else {
      percentage = +pickedPages || 0;
    }
    await addReadingLog({
      bookId,
      type: 'session',
      startPage: null,
      endPage,
      percentage,
      description: null,
      sessionDuration: elapsed,
      status: pickedStatus
    });
    await updateBookProgress(bookId, pickedStatus);
    setSaveModal(false);
    await reload();
  };

  const saveProgress = async () => {
    if (book.progressMode === 'pages') {
      const fromPage = parseInt(progressFrom, 10);
      const toPage = parseInt(progressTo, 10);
      if (isNaN(toPage) || toPage < 0 || toPage > book.totalPages) return;
      if (isNaN(fromPage) || fromPage < 1 || fromPage > toPage) {
        setProgressError('Invalid page range.');
        return;
      }
      // Check for overlap
      for (let p = fromPage; p <= toPage; ++p) {
        if (readPages.has(p)) {
          setProgressError(`Page ${p} already logged.`);
          return;
        }
      }
      await addReadingLog({
        bookId,
        type: 'progress',
        startPage: isNaN(fromPage) ? null : fromPage,
        endPage: toPage,
        percentage: (toPage / book.totalPages) * 100,
        description: null,
        sessionDuration: null,
        status: book.status
      });
      setProgressError('');
    } else {
      const pct = parseFloat(progressPct);
      if (isNaN(pct) || pct < 0 || pct > 100) return;
      await addReadingLog({
        bookId,
        type: 'progress',
        startPage: null,
        endPage: null,
        percentage: pct,
        description: null,
        sessionDuration: null,
        status: book.status
      });
    }
    setProgressModal(false);
    setProgressFrom('');
    setProgressTo('');
    setProgressPct('');
    await reload();
  };

  // Emoji bar options
  const emojiOptions = ['😀','😢','😡','😍','😱','🤔','😴','😮','😆'];

  // Delete note function
  const deleteNote = async (noteId) => {
    const db = await getDbConnection();
    await db.runAsync('DELETE FROM reading_logs WHERE id = ?;', [noteId]);
    await reload();
  };

  return (
    <View style={{ flex:1, backgroundColor: ct.background }}>
      <Animatable.View
        animation="fadeInUp" duration={400}
        style={[styles.header,{ backgroundColor: ct.primary }]}
      >
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#fff"/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menu}
          onPress={()=>navigation.navigate('EditBook',{ bookId })}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff"/>
        </TouchableOpacity>
        <Text style={[styles.title,{color:'#fff'}]}>{book.title}</Text>
      </Animatable.View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.coverCard,{ backgroundColor: ct.primary }]}>
          {book.coverImage && <Image source={{uri:book.coverImage}} style={styles.coverImage}/>}
          <Text style={[styles.sub,{color:'#fff'}]}>{percent}%</Text>
          <View style={styles.progressLineBg}>
            <View style={[styles.progressLineFg,{ width:`${percent}%`, backgroundColor:ct.secondary }]} />
          </View>
          {/* Show stars if rated */}
          {book.rating > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
              {[1,2,3,4,5].map(i => (
                <Ionicons
                  key={i}
                  name={i <= book.rating ? 'star' : 'star-outline'}
                  size={22}
                  color={ct.buttonText}
                  style={{ marginHorizontal: 1 }}
                />
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.btn,{backgroundColor:ct.secondary,marginTop:12}]}
            onPress={() => {
              setProgressModal(true);
              if (book.progressMode === 'pages') {
                setProgressFrom(String(nextUnreadPage));
                setProgressTo(String(nextUnreadPage));
              } else {
                setProgressPct('');
              }
              setProgressError('');
            }}
          >
            <Text style={{color:ct.text}}>Update Progress</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={openNote} style={styles.iconBox}>
            <Ionicons name="document-text-outline" size={28} color={ct.primary}/>
          </TouchableOpacity>
          <TouchableOpacity onPress={startSession} style={styles.iconBox}>
            <Ionicons name="timer-outline" size={28} color={ct.primary}/>
          </TouchableOpacity>
        </View>

        <Text style={[styles.section,{color:ct.text}]}>Notes</Text>
        {logs.filter(l=>l.type==='note').map(l=>(
          <View key={l.id} style={[styles.logCard,{ backgroundColor: ct.cardBackground, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
            <View style={{ flex: 1 }}>
              <Text style={{color:ct.text,fontSize:12}}>
                {new Date(l.timestamp).toLocaleString()} {l.emoji ? `— ${l.emoji}` : ''}
              </Text>
              <Text style={{color:ct.text}}>
                {l.emoji && <Text style={{fontSize:18}}>{l.emoji} </Text>}{l.description}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteNote(l.id)} style={{ marginLeft: 10 }}>
              <Ionicons name="trash" size={20} color={ct.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Note Modal */}
      <Modal visible={noteModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal,{backgroundColor:ct.background}]}> 
            <Text style={[styles.modalTitle,{color:ct.text}]}>Add Note</Text>
            <TextInput
              placeholder="Your note..." value={noteText} onChangeText={setNoteText}
              multiline style={[styles.input,{borderColor:ct.primary,color:ct.text}]}
            />
            {/* Emoji picker button */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10, borderWidth: 1, borderColor: ct.primary, borderRadius: 8, padding: 8, backgroundColor: ct.cardBackground }}
              onPress={() => setEmojiPickerVisible(true)}
            >
              <Text style={{ fontSize: 18, color: ct.text, marginRight: 8 }}>
                {noteEmoji ? `Emoji: ${noteEmoji}` : 'Pick Emoji'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={ct.text} />
            </TouchableOpacity>
            {/* Emoji picker modal */}
            <Modal visible={emojiPickerVisible} transparent animationType="fade">
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: ct.background, borderRadius: 12, padding: 20, elevation: 5 }}>
                  {emojiOptions.map(e => (
                    <TouchableOpacity key={e} onPress={() => { setNoteEmoji(e); setEmojiPickerVisible(false); }}>
                      <Text style={{ fontSize: 32, margin: 10, opacity: noteEmoji === e ? 1 : 0.7 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setEmojiPickerVisible(false)}>
                  <Text style={{ color: ct.primary, marginTop: 16, fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Modal>
            <TouchableOpacity
              style={[styles.btn,{backgroundColor:ct.secondary}]}
              onPress={saveNote}
            >
              <Text style={{color:ct.text}}>Save Note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setNoteModal(false)}>
              <Text style={{marginTop:10,color:ct.primary}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Session Modal */}
      <Modal visible={sessionModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal,{backgroundColor:ct.primary}]}>
            <Text style={{fontSize:32,color:'#fff',marginBottom:8}}>
              {new Date(elapsed*1000).toISOString().substr(11,8)}
            </Text>
            <Text style={{color:'#fff',marginBottom:20}}>Reading...</Text>
            <View style={styles.timerControls}>
              <TouchableOpacity onPress={()=>setRunning(r=>!r)}>
                <Ionicons name={running?'pause':'play'} size={40} color="#fff"/>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.btn,{backgroundColor:'#fff',marginTop:20}]}
              onPress={doneSession}
            >
              <Text style={{color:ct.primary}}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save Session Modal */}
      <Modal visible={saveModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal,{backgroundColor:ct.background}]}>
            <Text style={[styles.modalTitle,{color:ct.text}]}>Save Reading</Text>
            <Text style={{color:ct.text,marginBottom:10}}>
              {new Date().toLocaleString()}
            </Text>
            <Text style={{color:ct.text}}>Session duration:</Text>
            <Text style={{fontSize:24,color:ct.text,marginBottom:20}}>
              {new Date(elapsed*1000).toISOString().substr(11,8)}
            </Text>
            <Text style={{color:ct.text}}>
              {book.progressMode === 'pages' ? 'Pages read' : 'Progress (%)'}
            </Text>
            {sessionError ? <Text style={{color:'red',marginBottom:6}}>{sessionError}</Text> : null}
            <Picker
              selectedValue={pickedPages}
              onValueChange={setPickedPages}
              style={{color:ct.text}}
            >
              {book.progressMode === 'pages'
                ? Array.from({length: book.totalPages+1},(_,i)=>
                    !readPages.has(i) && i > 0 ? <Picker.Item key={i} label={String(i)} value={String(i)} /> : null
                  )
                : Array.from({length: 101},(_,i)=><Picker.Item key={i} label={String(i)} value={String(i)} />)
              }
            </Picker>
            <Text style={{color:ct.text}}>Status</Text>
            <Picker
              selectedValue={pickedStatus}
              onValueChange={setPickedStatus}
              style={{color:ct.text}}
            >
              <Picker.Item label="To Read" value="To Read" />
              <Picker.Item label="Reading" value="Reading" />
              <Picker.Item label="I've Read It All" value="I've Read It All" />
              <Picker.Item label="Gave Up" value="Gave Up" />
            </Picker>
            <TouchableOpacity
              style={[styles.btn,{backgroundColor:ct.secondary}]}
              onPress={saveSession}
            >
              <Text style={{color:ct.text}}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setSaveModal(false)}>
              <Text style={{marginTop:10,color:ct.primary}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Update Progress Modal */}
      <Modal visible={progressModal && !!book} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal,{backgroundColor:ct.background}]}> 
            <Text style={[styles.modalTitle,{color:ct.text}]}>Update Progress</Text>
            <Text style={{color:'red',marginBottom:4,fontSize:12}}>progressMode: {book.progressMode || 'undefined'}</Text>
            {(book.progressMode || 'pages') === 'pages' ? (
              <>
                <Text style={{color:ct.text,marginBottom:10}}>
                  Enter page range (0-{book.totalPages})
                </Text>
                {progressError ? <Text style={{color:'red',marginBottom:6}}>{progressError}</Text> : null}
                <View style={styles.row}>
                  <TextInput
                    placeholder="From"
                    value={progressFrom}
                    onChangeText={setProgressFrom}
                    keyboardType="numeric"
                    style={[styles.smallInput,{borderColor:ct.primary,color:ct.text}]}
                    placeholderTextColor={ct.text}
                  />
                  <TextInput
                    placeholder="To"
                    value={progressTo}
                    onChangeText={setProgressTo}
                    keyboardType="numeric"
                    style={[styles.smallInput,{borderColor:ct.primary,color:ct.text}]}
                    placeholderTextColor={ct.text}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={{color:ct.text,marginBottom:10}}>Enter percentage (0-100)</Text>
                <TextInput
                  placeholder="Percentage"
                  value={progressPct}
                  onChangeText={setProgressPct}
                  keyboardType="numeric"
                  style={[styles.input,{borderColor:ct.primary,color:ct.text}]}
                  placeholderTextColor={ct.text}
                />
              </>
            )}
            <TouchableOpacity
              style={[styles.btn,{backgroundColor:ct.secondary}]}
              onPress={saveProgress}
            >
              <Text style={{color:ct.text}}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setProgressModal(false)}>
              <Text style={{marginTop:10,color:ct.primary}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Congrats/Rating Modal */}
      <Modal visible={showCongrats} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: ct.background, alignItems: 'center' }]}> 
            <Text style={[styles.modalTitle, { color: ct.text, fontSize: 22 }]}>🎉 Congrats!</Text>
            <Text style={{ color: ct.text, marginVertical: 10, fontSize: 16, textAlign: 'center' }}>
              You finished reading this book!
            </Text>
            <Text style={{ color: ct.text, marginBottom: 10, fontSize: 16 }}>How many stars do you rate it?</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {[1,2,3,4,5].map(i => (
                <TouchableOpacity key={i} onPress={() => setPendingRating(i)}>
                  <Ionicons
                    name={i <= pendingRating ? 'star' : 'star-outline'}
                    size={32}
                    color={i <= pendingRating ? '#FFD700' : ct.text}
                    style={{ marginHorizontal: 2 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: ct.secondary, width: 120 }]}
              onPress={() => handleSaveRating(pendingRating)}
              disabled={pendingRating === 0}
            >
              <Text style={{ color: ct.text, fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex:1, textAlign:'center', marginTop:40 },
  header: {
    padding:20,
    alignItems:'center',
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20
  },
  back: { position:'absolute', top:40,left:20 },
  menu: { position:'absolute', top:40, right:20 },
  title:{fontSize:24, fontWeight:'bold',marginTop:40, color:'#fff'},
  container:{ padding:20 },
  coverCard:{
    borderRadius:12,
    padding:20,
    alignItems:'center'
  },
  coverImage:{ width:80,height:120,borderRadius:8,marginBottom:8 },
  sub:{ fontSize:20, fontWeight:'bold' },
  progressLineBg:{
    height:4,
    backgroundColor:'#eee',
    borderRadius:2,
    overflow:'hidden',
    alignSelf:'stretch',
    marginTop:8
  },
  progressLineFg:{ height:4 },
  actionsRow:{
    flexDirection:'row',
    justifyContent:'space-around',
    marginVertical:20
  },
  iconBox:{
    padding:10,
    borderRadius:30,
    backgroundColor:'#eee'
  },
  section:{
    fontSize:20,
    fontWeight:'600',
    marginBottom:10
  },
  logCard:{
    padding:12,
    borderRadius:8,
    marginBottom:10
  },
  modalBg:{
    flex:1,
    justifyContent:'center',
    backgroundColor:'rgba(0,0,0,0.5)',
    padding:20
  },
  modal:{
    borderRadius:12,
    padding:20
  },
  modalTitle:{
    fontSize:18,
    fontWeight:'600',
    marginBottom:12
  },
  input:{
    borderWidth:1,
    borderRadius:8,
    padding:8,
    marginBottom:10
  },
  row:{
    flexDirection:'row',
    justifyContent:'space-between'
  },
  smallInput:{
    borderWidth:1,
    borderRadius:8,
    padding:8,
    flex:1,
    marginHorizontal:4
  },
  btn:{
    padding:12,
    borderRadius:8,
    alignItems:'center',
    marginTop:12
  },
  timerControls:{
    flexDirection:'row',
    justifyContent:'space-around',
    width:'60%'
  }
});

export default BookDetailsScreen;
