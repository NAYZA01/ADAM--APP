import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Switch,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from './constants/theme';
import { ALL_WORDS, A1_WORDS, A2_WORDS, B1_WORDS, B2_WORDS, TODAY_WORDS } from './data/words';
import { DAILY_EXPRESSIONS, MOVIE_STYLE, IDIOMS, PHRASAL_VERBS } from './data/expressions';
import { ALL_STRUCTURES, A2_STRUCTURES, B1_STRUCTURES } from './data/structures';
import { STORIES } from './data/stories';
import { Word, Expression, SentenceStructure, Story } from './types';
import { useGoogleAuth, watchAuthState, signOutGoogle } from './services/googleAuth';
import { pullCloudData, pushCloudData, pushField } from './services/syncService';
import type { User } from '@firebase/auth';

type Tab = 'home' | 'learn' | 'practice' | 'stories' | 'notebook';
type LearnMode = 'words' | 'structures' | 'expressions' | 'verbs' | 'connectors' | 'auxiliaries' | 'prepositions';
type PracticeMode = 'builder' | 'order' | 'mistakes' | 'quiz' | 'review';

const norm = (s: string) => s.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();

const FILL_TEMPLATES: Record<string, string[]> = {
  Verb: ['I want to ___ every day.', 'She likes to ___ with her friends.', 'We need to ___ before tonight.'],
  Adverb: ['He spoke to me ___.', 'She finished the work ___.', 'They answered ___.'],
  Conjunction: ['I was tired, ___ I kept working.', 'She stayed home ___ it was raining.'],
  Other: ['I really like this ___.', 'Can you show me the ___?', 'We talked about the ___ yesterday.', 'This is a very important ___.'],
};

const STORAGE = { onboarded: 'adam_onboarded_v3', level: 'adam_level_v3', goal: 'adam_goal_v3', notebook: 'adam_notebook_v3', review: 'adam_review_v3', progress: 'adam_progress_v3', streak: 'adam_streak_v3', coins: 'adam_coins_v3' };
// STORAGE_KEY -> alan adı (Firestore'a bu isimlerle yazılır), örn. 'adam_level_v3' -> 'level'
const STORAGE_REVERSE: Record<string, keyof typeof STORAGE> = Object.fromEntries(Object.entries(STORAGE).map(([k, v]) => [v, k as keyof typeof STORAGE]));

const CONNECTORS = [
  ['and','ve'],['but','ama'],['because','çünkü'],['although','rağmen / -se de'],['however','ancak'],['therefore','bu nedenle'],['so','bu yüzden'],['if','eğer'],['unless','-medikçe'],['while','iken'],['when','-dığında'],['before','önce'],['after','sonra'],['as soon as','-er ermez'],['even though','her ne kadar'],['despite','-e rağmen'],['in addition','ek olarak'],['for example','örneğin'],['instead','yerine'],['otherwise','aksi halde'],['also','ayrıca'],['then','sonra'],['first','ilk olarak'],['finally','son olarak'],['because of','nedeniyle'],['as a result','sonuç olarak'],['on the other hand','öte yandan'],['in fact','aslında'],['although','gerçi'],['until','-e kadar'],
] as const;
const AUXILIARIES = [
  ['be','olmak / yardımcı fiil'],['do','yapmak / soru-olumsuz yardımcı fiili'],['have','sahip olmak / perfect yardımcı fiili'],['can','-ebilmek'],['could','-ebilirdi / rica'],['should','-meli / -malı'],['would','-erdi / kibar istek'],['will','-ecek'],['must','zorunda olmak'],['might','olabilir'],['may','-ebilir / izin'],['shall','-ecek / teklif'],
] as const;
const PREPOSITIONS = [
  ['in','içinde'],['on','üzerinde'],['at','-de/-da'],['to','-e/-a'],['for','için'],['from','-den/-dan'],['with','ile'],['about','hakkında'],['by','tarafından / ile'],['of','-ın/-in'],['into','içine'],['out of','dışına / -den'],['over','üzerinde / üzerinden'],['under','altında'],['between','arasında'],['among','arasında'],['before','önce'],['after','sonra'],['during','sırasında'],['without','olmadan'],['against','karşı'],['through','içinden'],['around','etrafında'],['near','yakınında'],['behind','arkasında'],['beside','yanında'],
] as const;

const BUILDER_EXERCISES = [
  { words: ['my','name','is','Maya'], answer: 'My name is Maya.', level: 'A1' },
  { words: ['they','are','at','home'], answer: 'They are at home.', level: 'A1' },
  { words: ['I','usually','walk','to','school'], answer: 'I usually walk to school.', level: 'A1' },
  { words: ['yesterday','I','went','to','school'], answer: 'I went to school yesterday.', level: 'A2' },
  { words: ['she','every','works','day','hard'], answer: 'She works hard every day.', level: 'A2' },
  { words: ['we','are','going','to','travel','tomorrow'], answer: 'We are going to travel tomorrow.', level: 'A2' },
  { words: ['he','has','already','finished','the','work'], answer: 'He has already finished the work.', level: 'B1' },
  { words: ['although','it','was','raining','we','went','outside'], answer: 'Although it was raining, we went outside.', level: 'B1' },
  { words: ['if','I','had','time','I','would','learn','Spanish'], answer: 'If I had time, I would learn Spanish.', level: 'B1' },
  { words: ['the','report','has','already','been','sent'], answer: 'The report has already been sent.', level: 'B2' },
  { words: ['despite','the','delay','we','finished','on','time'], answer: 'Despite the delay, we finished on time.', level: 'B2' },
  { words: ['not','only','did','she','apologize','but','she','also','offered','help'], answer: 'Not only did she apologize, but she also offered help.', level: 'B2' },
];
const ERROR_EXERCISES = [
  { bad: 'She go to work every day.', fix: 'She goes to work every day.', explain: 'He / she / it ile Present Simple fiiline genellikle -s gelir.', level:'A1' },
  { bad: 'I have saw that movie.', fix: 'I have seen that movie.', explain: 'Present Perfect yapısında fiilin üçüncü hâli (V3) kullanılır.', level:'B1' },
  { bad: 'He don’t like coffee.', fix: 'He doesn’t like coffee.', explain: 'He / she / it ile olumsuz cümlede doesn’t kullanılır.', level:'A1' },
  { bad: 'We was tired after work.', fix: 'We were tired after work.', explain: 'We öznesiyle geçmiş zamanda were kullanılır.', level:'A2' },
  { bad: 'I am agree with you.', fix: 'I agree with you.', explain: 'Agree zaten fiildir; önüne am getirilmez.', level:'A2' },
  { bad: 'She can to swim.', fix: 'She can swim.', explain: 'Can gibi modal fiillerden sonra to olmadan fiilin yalın hâli gelir.', level:'A2' },
  { bad: 'If I will see her, I will tell her.', fix: 'If I see her, I will tell her.', explain: 'First Conditional if cümleciğinde gelecek anlamı için genellikle Present Simple kullanılır.', level:'B1' },
  { bad: 'I look forward to meet you.', fix: 'I look forward to meeting you.', explain: 'Look forward to ifadesindeki to edattır; ardından fiilin -ing biçimi gelir.', level:'B1' },
  { bad: 'Rarely I have seen such a view.', fix: 'Rarely have I seen such a view.', explain: 'Rarely gibi olumsuz anlam taşıyan ifadeler cümle başına geldiğinde devrik yapı kullanılabilir.', level:'B2' },
  { bad: 'Had I would known, I would have called.', fix: 'Had I known, I would have called.', explain: 'Third Conditional devrik yapısında Had + özne + V3 kullanılır; would kullanılmaz.', level:'B2' },
];

export default function App() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [level, setLevel] = useState<'A1'|'A2'|'B1'|'B2'>('A2');
  const [goal, setGoal] = useState(10);
  const [tab, setTab] = useState<Tab>('home');
  const [learnMode, setLearnMode] = useState<LearnMode>('words');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('builder');
  const [notebook, setNotebook] = useState<string[]>([]);
  const [progress, setProgress] = useState({ words: 0, sentences: 0, structures: 0, stories: 0, quiz: 0 });
  const [review, setReview] = useState<Record<string,{next:number;interval:number;box:number}>>({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle'|'syncing'|'synced'|'error'>('idle');
  const { request: googleRequest, promptAsync: googlePromptAsync } = useGoogleAuth();

  // Kullanıcı Google ile giriş yapınca / uygulama açılışında oturum hâlâ açıksa çalışır.
  useEffect(() => {
    const unsub = watchAuthState(async (u) => {
      setUser(u);
      if (!u) return;
      setSyncStatus('syncing');
      try {
        const cloud = await pullCloudData(u.uid);
        if (cloud) {
          // Buluttaki veri varsa (bu hesapla daha önce ilerleme kaydedilmiş) onu kullan.
          if (typeof cloud.onboarded === 'boolean') setOnboarded(cloud.onboarded);
          if (cloud.level) setLevel(cloud.level as any);
          if (typeof cloud.goal === 'number') setGoal(cloud.goal);
          if (cloud.notebook) setNotebook(cloud.notebook);
          if (cloud.progress) setProgress(cloud.progress as any);
          if (cloud.review) setReview(cloud.review as any);
          if (cloud.streak) setStreak(cloud.streak.count || 0);
          await Promise.all(
            (Object.keys(STORAGE) as (keyof typeof STORAGE)[])
              .filter((k) => cloud[k] !== undefined)
              .map((k) => AsyncStorage.setItem(STORAGE[k], typeof cloud[k] === 'string' ? (cloud[k] as string) : JSON.stringify(cloud[k])))
          );
        } else {
          // Bu hesapla ilk kez giriş yapılıyor: mevcut cihazdaki veriyi buluta yükle.
          await pushCloudData(u.uid, {
            onboarded: !!onboarded, level, goal, notebook, progress, review,
            streak: { count: streak, lastDate: new Date().toDateString() },
          });
        }
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Senkronizasyon hatası:', e);
        setSyncStatus('error');
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { (async () => {
    try {
      const entries = await Promise.all(
        (Object.keys(STORAGE) as (keyof typeof STORAGE)[]).map(async (k) => [k, await AsyncStorage.getItem(STORAGE[k])] as const)
      );
      const map = Object.fromEntries(entries) as Record<keyof typeof STORAGE, string | null>;
      setOnboarded(map.onboarded === '1');
      if (map.level && ['A1','A2','B1','B2'].includes(map.level)) setLevel(map.level as 'A1'|'A2'|'B1'|'B2');
      if (map.goal) setGoal(Number(map.goal));
      if (map.notebook) setNotebook(JSON.parse(map.notebook));
      if (map.progress) setProgress(JSON.parse(map.progress));
      if (map.review) setReview(JSON.parse(map.review));
      const today = new Date().toDateString();
      const prevStreak = map.streak ? JSON.parse(map.streak) : { count: 0, lastDate: '' };
      let nextCount = prevStreak.count;
      if (prevStreak.lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        nextCount = prevStreak.lastDate === yesterday ? prevStreak.count + 1 : 1;
        await persist(STORAGE.streak, { count: nextCount, lastDate: today });
      }
      setStreak(nextCount);
    } catch { setOnboarded(false); }
  })(); }, []);
  const persist = async (key:string, value:any) => {
    try { await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch {}
    // Kullanıcı Google ile giriş yapmışsa aynı veriyi buluta (Firestore) da yaz.
    if (user) {
      const field = STORAGE_REVERSE[key];
      if (field) pushField(user.uid, field, key === STORAGE.goal ? Number(value) : value);
    }
  };
  const signOutOfGoogle = async () => { try { await signOutGoogle(); setUser(null); setSyncStatus('idle'); } catch {} };
  const finishOnboarding = async () => { await persist(STORAGE.onboarded,'1'); await persist(STORAGE.level,level); await persist(STORAGE.goal,String(goal)); setOnboarded(true); };
  const toggleNotebook = (id:string) => { const next = notebook.includes(id) ? notebook.filter(x=>x!==id) : [...notebook,id]; setNotebook(next); persist(STORAGE.notebook,next); };
  const speak = (text:string, id?:string) => {
    const key = id || text;
    if (speakingId === key) { Speech.stop(); setSpeakingId(null); return; }
    Speech.stop();
    setSpeakingId(key);
    Speech.speak(text, {
      language:'en-US', rate:0.88, pitch:1,
      onDone: () => setSpeakingId(prev => prev === key ? null : prev),
      onStopped: () => setSpeakingId(prev => prev === key ? null : prev),
      onError: () => setSpeakingId(prev => prev === key ? null : prev),
    });
  };
  const markProgress = (key:keyof typeof progress) => { const next={...progress,[key]:progress[key]+1}; setProgress(next); persist(STORAGE.progress,next); };
  const scheduleReview = (id:string, remembered:boolean) => {
    const old=review[id]||{next:Date.now(),interval:1,box:0};
    const interval=remembered ? Math.min(old.interval*3,30) : 1; const box=remembered ? Math.min(old.box+1,5) : 0; const next={...review,[id]:{next:Date.now()+interval*86400000,interval,box}}; setReview(next); persist(STORAGE.review,next);
  };
  const changeLevel = (l:'A1'|'A2'|'B1'|'B2') => { setLevel(l); persist(STORAGE.level,l); };
  const changeGoal = (g:number) => { setGoal(g); persist(STORAGE.goal,String(g)); };
  const resetProgress = async () => {
    const empty={words:0,sentences:0,structures:0,stories:0,quiz:0};
    setProgress(empty); setReview({});
    await persist(STORAGE.progress,empty); await persist(STORAGE.review,{});
  };
  const resetNotebook = async () => { setNotebook([]); await persist(STORAGE.notebook,[]); };
  if (onboarded === null) return <Loading />;
  if (!onboarded) return <Onboarding level={level} setLevel={setLevel} goal={goal} setGoal={setGoal} onStart={finishOnboarding} googlePromptAsync={googlePromptAsync} googleRequest={googleRequest} user={user} />;
  return <>
    <AppShell tab={tab} setTab={setTab} level={level} goal={goal} progress={progress} notebook={notebook} learnMode={learnMode} setLearnMode={setLearnMode} practiceMode={practiceMode} setPracticeMode={setPracticeMode} toggleNotebook={toggleNotebook} speak={speak} speakingId={speakingId} markProgress={markProgress} review={review} scheduleReview={scheduleReview} streak={streak} onOpenSettings={()=>setSettingsOpen(true)} />
    <SettingsModal visible={settingsOpen} onClose={()=>setSettingsOpen(false)} level={level} goal={goal} onChangeLevel={changeLevel} onChangeGoal={changeGoal} onResetProgress={resetProgress} onResetNotebook={resetNotebook} user={user} syncStatus={syncStatus} googlePromptAsync={googlePromptAsync} googleRequest={googleRequest} onSignOut={signOutOfGoogle} />
  </>;
}

function Loading(){return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.logo}>A<Text style={styles.logoAccent}>DAM</Text></Text><Text style={styles.muted}>Kısa İngilizce molan hazırlanıyor…</Text></View></SafeAreaView>}

function Onboarding({level,setLevel,goal,setGoal,onStart,googlePromptAsync,googleRequest,user}:{level:'A1'|'A2'|'B1'|'B2';setLevel:(x:'A1'|'A2'|'B1'|'B2')=>void;goal:number;setGoal:(x:number)=>void;onStart:()=>void;googlePromptAsync:()=>void;googleRequest:any;user:User|null}){
 const [step,setStep]=useState(1); const [reminder,setReminder]=useState(true);
 const auth=(name:string)=>Alert.alert('ADAM', `${name} yakında eklenecek. Şimdilik Google ile devam edebilirsin.`);
 const onGoogle=async()=>{ try{ await googlePromptAsync(); }catch(e:any){ Alert.alert('Google girişi başarısız', e?.message||'Lütfen tekrar dene.'); } };
 return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor={Colors.bgDeep}/><ScrollView contentContainerStyle={styles.onboard}>
  <View style={styles.brandMark}><View style={styles.mascot}><Ionicons name="sparkles" size={68} color={Colors.teal}/></View><Text style={styles.logo}>A<Text style={styles.logoAccent}>DAM</Text></Text><Text style={styles.tagline}>Kısa pratikler, gerçek ilerleme.</Text></View>
  {step===1&&<>{user?<View style={styles.infoBox}><Text style={styles.infoTitle}>✓ Google ile bağlandın</Text><Text style={styles.muted}>{user.email} · İlerlemen bu hesapta güvende, telefon değişse bile kaybolmaz.</Text></View>:null}<Text style={styles.hero}>İngilizceyi kendi ritminde keşfet.</Text><Text style={styles.muted}>Kısa hikâyeler, küçük pratikler ve günlük hayattan cümlelerle ilerle. İstediğinde devam et, yorulduğunda ara ver.</Text>{!user&&<TouchableOpacity style={styles.authBtn} disabled={!googleRequest} onPress={onGoogle}><Text style={styles.authText}>G  Continue with Google</Text></TouchableOpacity>}<TouchableOpacity style={styles.authBtn} onPress={()=>auth('Apple ile devam')}><Text style={styles.authText}>  Continue with Apple</Text></TouchableOpacity><TouchableOpacity style={styles.authBtn} onPress={()=>auth('E-posta ile giriş')}><Text style={styles.authText}>✉  Sign in with Email</Text></TouchableOpacity><TouchableOpacity style={styles.primary} onPress={()=>setStep(2)}><Text style={styles.primaryText}>{user?'Devam Et →':'Explore as Guest →'}</Text></TouchableOpacity></>}
  {step===2&&<><Text style={styles.hero}>Seviyeni seç.</Text><Text style={styles.muted}>Bu seçim içerik ve günlük yolculuk önerilerini kişiselleştirir.</Text><View style={styles.levelGrid}>{([['A1','Beginner'],['A2','Elementary'],['B1','Intermediate'],['B2','Upper-Intermediate']] as const).map(([x,t])=><TouchableOpacity key={x} onPress={()=>setLevel(x)} style={[styles.levelCard,level===x&&styles.optionActive]}><Text style={styles.optionTitle}>{x}</Text><Text style={styles.optionSub}>{t}</Text></TouchableOpacity>)}</View><TouchableOpacity style={styles.primary} onPress={()=>setStep(3)}><Text style={styles.primaryText}>Devam Et →</Text></TouchableOpacity></>}
  {step===3&&<><Text style={styles.hero}>Günlük hedefini belirle.</Text><View style={styles.optionRow}>{[5,10,15].map(x=><TouchableOpacity key={x} onPress={()=>setGoal(x)} style={[styles.goalOption,goal===x&&styles.optionActive]}><Text style={styles.goalNumber}>{x}</Text><Text style={styles.muted}>dakika/gün</Text></TouchableOpacity>)}</View><View style={styles.reminderRow}><View><Text style={styles.sectionTitle}>Habit reminder</Text><Text style={styles.muted}>Günlük hedefini hatırlat</Text></View><Switch value={reminder} onValueChange={setReminder} trackColor={{false:Colors.line,true:Colors.amber}}/></View><View style={styles.infoBox}><Text style={styles.infoTitle}>✨ Küçük adımlar yeter</Text><Text style={styles.muted}>Kısa bir pratik yap, yeni bir şey öğren ve gününe devam et. Burada acele yok.</Text></View><TouchableOpacity style={styles.primary} onPress={onStart}><Text style={styles.primaryText}>Başlayalım →</Text></TouchableOpacity></>}
  {step>1&&<TouchableOpacity style={styles.close} onPress={()=>setStep(step-1)}><Text style={styles.muted}>← Geri</Text></TouchableOpacity>}
 </ScrollView></SafeAreaView>
}

function AppShell(props:any){
 const {tab,setTab,streak,onOpenSettings}=props;
 return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor={Colors.bgDeep}/><View style={{flex:1}}>
   <View style={styles.topBar}>
     <View style={styles.row}>
       <View style={styles.logoBadge}><Ionicons name="sparkles" size={16} color={Colors.amberDark}/></View>
       <Text style={styles.topBarTitle}>ADAM · English, your way</Text>
     </View>
     <View style={styles.row}>
       <View style={styles.streakBadge}><Ionicons name="flame" size={15} color={Colors.amber}/><Text style={styles.streakText}>{streak||1}</Text></View>
       <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn} hitSlop={{top:12,bottom:12,left:12,right:12}} accessibilityRole="button" accessibilityLabel="Ayarlar"><Ionicons name="settings-outline" size={24} color={Colors.text}/></TouchableOpacity>
     </View>
   </View>
   {tab==='home'&&<Home {...props}/>} {tab==='learn'&&<Learn {...props}/>} {tab==='practice'&&<Practice {...props}/>} {tab==='stories'&&<Stories {...props}/>} {tab==='notebook'&&<Notebook {...props}/>}
   <View style={styles.nav}>{([['home','Ana Sayfa','home','home-outline'],['learn','Öğren','book','book-outline'],['practice','Pratik','extension-puzzle','extension-puzzle-outline'],['stories','Hikâyeler','library','library-outline'],['notebook','Defterim','star','star-outline']] as any[]).map(([k,t,on,off])=><TouchableOpacity key={k} onPress={()=>setTab(k)} style={styles.navItem}><Ionicons name={tab===k?on:off} size={19} color={tab===k?Colors.teal:Colors.textFaint}/><Text style={[styles.navText,tab===k&&styles.navActive]}>{t}</Text></TouchableOpacity>)}</View>
 </View></SafeAreaView>
}
function SettingsModal({visible,onClose,level,goal,onChangeLevel,onChangeGoal,onResetProgress,onResetNotebook,user,syncStatus,googlePromptAsync,googleRequest,onSignOut}:any){
  const confirmReset=(what:string,action:()=>void)=>Alert.alert('Emin misin?',`${what} sıfırlanacak. Bu işlem geri alınamaz.`,[{text:'Vazgeç',style:'cancel'},{text:'Sıfırla',style:'destructive',onPress:action}]);
  const confirmSignOut=()=>Alert.alert('Çıkış yap','Google hesabından çıkış yapmak istiyor musun? İlerlemen bu hesapta bulutta saklı kalmaya devam eder, tekrar giriş yaptığında geri gelir.',[{text:'Vazgeç',style:'cancel'},{text:'Çıkış yap',style:'destructive',onPress:onSignOut}]);
  const onGoogleFromSettings = async () => { try { await googlePromptAsync(); } catch (e:any) { Alert.alert('Google girişi başarısız', e?.message || 'Lütfen tekrar dene.'); } };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalShade}><View style={styles.wordModal}>
    <View style={styles.rowBetween}><Text style={styles.modalWord}>Ayarlar</Text></View>
    <Text style={styles.sectionTitle}>Hesap</Text>
    {user?<View style={styles.infoBox}>
      <Text style={styles.infoTitle}>✓ {user.email}</Text>
      <Text style={styles.muted}>{syncStatus==='syncing'?'Senkronize ediliyor…':syncStatus==='error'?'Senkronizasyon hatası, internetini kontrol et.':'İlerlemen Google hesabınla bulutta yedekleniyor.'}</Text>
      <TouchableOpacity style={[styles.secondary,{marginTop:10}]} onPress={confirmSignOut}><Text style={styles.secondaryText}>Çıkış yap</Text></TouchableOpacity>
    </View>:<TouchableOpacity style={styles.authBtn} disabled={!googleRequest} onPress={onGoogleFromSettings}><Text style={styles.authText}>{googleRequest?'G  Google ile bağlan (ilerlemeni yedekle)':'Google girişi hazırlanıyor…'}</Text></TouchableOpacity>}
    <Text style={[styles.sectionTitle,{marginTop:16}]}>Seviye</Text>
    <View style={styles.row}>{(['A1','A2','B1','B2'] as const).map(l=><TouchableOpacity key={l} onPress={()=>onChangeLevel(l)} style={[styles.levelPill,level===l&&styles.levelPillActive]}><Text style={styles.levelPillText}>{l}</Text></TouchableOpacity>)}</View>
    <Text style={[styles.sectionTitle,{marginTop:16}]}>Günlük hedef (kelime)</Text>
    <View style={styles.row}>{[5,10,15,20].map(g=><TouchableOpacity key={g} onPress={()=>onChangeGoal(g)} style={[styles.levelPill,goal===g&&styles.levelPillActive]}><Text style={styles.levelPillText}>{g}</Text></TouchableOpacity>)}</View>
    <Text style={[styles.sectionTitle,{marginTop:16}]}>Veri</Text>
    <TouchableOpacity style={styles.secondary} onPress={()=>confirmReset('İlerleme ve tekrar programı',onResetProgress)}><Text style={styles.secondaryText}>İlerlemeyi sıfırla</Text></TouchableOpacity>
    <TouchableOpacity style={[styles.secondary,{marginTop:10}]} onPress={()=>confirmReset('Kelime defteri',onResetNotebook)}><Text style={styles.secondaryText}>Kelime defterini sıfırla</Text></TouchableOpacity>
    <TouchableOpacity onPress={onClose} style={styles.close}><Text style={styles.muted}>Kapat</Text></TouchableOpacity>
  </View></View></Modal>;
}

function Header({title,subtitle}:{title:string;subtitle?:string}){return <View style={styles.header}><Text style={styles.headerTitle}>{title}</Text>{subtitle&&<Text style={styles.headerSub}>{subtitle}</Text>}</View>}
function Home({level,goal,progress,setTab,notebook,speak,speakingId,review,toggleNotebook}:any){
 const due=Object.values(review).filter((x:any)=>x.next<=Date.now()).length;
 return <ScrollView style={{flex:1}} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <LinearGradient colors={[Colors.surface,'#20364A','#24434D']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.homeHero}>
   <Text style={styles.kicker}>BUGÜNÜN KISA MOLASI · {level}</Text>
   <Text style={styles.bigTitle}>Biraz İngilizce,<Text style={styles.accent}> iyi hissettiren ilerleme.</Text></Text>
   <View style={styles.shipTrack}><Text style={styles.ship}>{progress.words>=goal?'🏝️':'⛵'}</Text><View style={styles.shipLine}><View style={[styles.shipFill,{width:`${Math.min(progress.words/goal,1)*100}%`}]} /></View><Text style={styles.island}>🏝️</Text></View>
   <Text style={styles.goalSmall}>{Math.min(progress.words,goal)} / {goal} günlük görev</Text>
 </LinearGradient>
 <View style={styles.grid2}>
   <Quick title="Kelime Öğren" icon="book-outline" onPress={()=>setTab('learn')}/>
   <Quick title="Cümle Kur" icon="extension-puzzle-outline" onPress={()=>setTab('practice')}/>
   <Quick title="Hikâyeler" icon="library-outline" onPress={()=>setTab('stories')}/>
   <Quick title="Kelime Defterim" icon="star-outline" sub={`${notebook.length} kayıt`} onPress={()=>setTab('notebook')}/>
 </View>
 <View style={styles.panel}><Text style={styles.sectionTitle}>Bugün Öğrendiklerim</Text><Text style={styles.muted}>Her kelimeyi seç, sesini dinle ve defterine ekle.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:12}}>{TODAY_WORDS.map(w=><MiniWord key={w.id} word={w} saved={notebook.includes(w.id)} onSave={()=>toggleNotebook(w.id)} speak={speak} speakingId={speakingId}/>)}</ScrollView></View>
 <View style={styles.panel}><View style={styles.rowBetween}><View><Text style={styles.sectionTitle}>Tekrar zamanı</Text><Text style={styles.muted}>{due} içerik bugün tekrar bekliyor.</Text></View><Text style={styles.reviewBadge}>{due}</Text></View></View>
 </ScrollView>
}
function Quick({title,icon,sub,onPress}:any){return <TouchableOpacity style={styles.quick} onPress={onPress}><Ionicons name={icon} size={22} color={Colors.teal}/><Text style={styles.quickTitle}>{title}</Text>{sub&&<Text style={styles.muted}>{sub}</Text>}</TouchableOpacity>}
function MiniWord({word,saved,onSave,speak,speakingId}:any){return <View style={styles.mini}><Text style={styles.miniWord}>{word.word}</Text><Text style={styles.miniTr}>{word.translation}</Text><View style={styles.miniActions}><TouchableOpacity onPress={()=>speak(word.word,word.id)}><Text>{speakingId===word.id?'⏹':'🔊'}</Text></TouchableOpacity><TouchableOpacity onPress={onSave}><Text>{saved?'★':'☆'}</Text></TouchableOpacity></View></View>}

function Learn({level,learnMode,setLearnMode,notebook,toggleNotebook,speak,speakingId}:any){
 const [query,setQuery]=useState(''); const [levelFilter,setLevelFilter]=useState<'A1'|'A2'|'B1'|'B2'| 'ALL'>(level); const [selected,setSelected]=useState<Word|null>(null);
 const words=useMemo(()=>ALL_WORDS.filter(w=>(levelFilter==='ALL'||w.level===levelFilter)&&w.word.toLowerCase().includes(query.toLowerCase())),[query,levelFilter]);
 const modes=[['words','Kelime Havuzu'],['structures','Cümle Yapıları'],['verbs','Fiiller'],['connectors','Bağlaçlar'],['auxiliaries','Yardımcı Fiiller'],['prepositions','Edatlar'],['expressions','Konuşma Kalıpları']];
 return <View style={{flex:1}}><Header title="Öğren" subtitle="İçeriği sen seçiyorsun. Dinle, kaydet, kullan."/><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>{modes.map(([k,t])=><TouchableOpacity key={k} onPress={()=>setLearnMode(k as LearnMode)} style={[styles.tabPill,learnMode===k&&styles.tabPillActive]}><Text style={[styles.tabPillText,learnMode===k&&styles.tabPillTextActive]}>{t}</Text></TouchableOpacity>)}</ScrollView>
 {learnMode==='words'&&<><View style={styles.filters}><TouchableOpacity style={styles.searchBox}><TextInput value={query} onChangeText={setQuery} placeholder="Kelime ara…" placeholderTextColor={Colors.textFaint} style={styles.searchInput}/></TouchableOpacity>{(['ALL','A1','A2','B1','B2'] as const).map(x=><TouchableOpacity key={x} onPress={()=>setLevelFilter(x)} style={[styles.levelPill,levelFilter===x&&styles.levelPillActive]}><Text style={styles.levelPillText}>{x==='ALL'?'Tümü':x}</Text></TouchableOpacity>)}</View><FlatList style={{flex:1}} data={words} keyExtractor={x=>x.id} contentContainerStyle={styles.list} renderItem={({item})=><WordRow word={item} saved={notebook.includes(item.id)} onSave={()=>toggleNotebook(item.id)} onOpen={()=>setSelected(item)} speak={speak} speakingId={speakingId}/>} /></>}
 {learnMode==='structures'&&<StructureList data={levelFilter==='B1'?B1_STRUCTURES:levelFilter==='A1'||levelFilter==='B2'?ALL_STRUCTURES.filter(x=>x.level===levelFilter).length?ALL_STRUCTURES.filter(x=>x.level===levelFilter):ALL_STRUCTURES:A2_STRUCTURES} speak={speak} speakingId={speakingId}/>} {learnMode==='expressions'&&<ExpressionHub speak={speak} speakingId={speakingId}/>} {learnMode==='verbs'&&<SimpleList title="Fiil havuzu" data={ALL_WORDS.filter(x=>x.type==='Verb').slice(0,160).map(x=>[x.word,x.forms,x.translation])} speak={speak} speakingId={speakingId}/>} {learnMode==='connectors'&&<SimpleList title="Bağlaç havuzu" data={CONNECTORS.map(x=>[x[0],x[1]])} speak={speak} speakingId={speakingId}/>} {learnMode==='auxiliaries'&&<SimpleList title="Yardımcı fiiller" data={AUXILIARIES.map(x=>[x[0],x[1]])} speak={speak} speakingId={speakingId}/>} {learnMode==='prepositions'&&<SimpleList title="Edatlar" data={PREPOSITIONS.map(x=>[x[0],x[1]])} speak={speak} speakingId={speakingId}/>}
 <Modal visible={!!selected} transparent animationType="slide" onRequestClose={()=>setSelected(null)}><View style={styles.modalShade}><View style={styles.wordModal}>{selected&&<><View style={styles.rowBetween}><Text style={styles.modalWord}>{selected.word}</Text><Text style={styles.badge}>{selected.level}</Text></View><Text style={styles.modalTr}>{selected.translation}</Text><Text style={styles.forms}>{selected.forms||selected.type}</Text><Text style={styles.example}>{selected.example}</Text><View style={styles.modalActions}><TouchableOpacity style={styles.secondary} onPress={()=>speak(selected.word,selected.id)}><Text style={styles.secondaryText}>{speakingId===selected.id?'⏹ Durdur':'🔊 Dinle'}</Text></TouchableOpacity><TouchableOpacity style={styles.primarySmall} onPress={()=>toggleNotebook(selected.id)}><Text style={styles.primaryText}>{notebook.includes(selected.id)?'★ Defterde':'☆ Deftere ekle'}</Text></TouchableOpacity></View><TouchableOpacity onPress={()=>setSelected(null)} style={styles.close}><Text style={styles.muted}>Kapat</Text></TouchableOpacity></>}</View></View></Modal>
 </View>
}
function WordRow({word,saved,onSave,onOpen,speak,speakingId}:any){return <View style={styles.wordRow}><TouchableOpacity style={{flex:1}} onPress={onOpen}><View style={styles.row}><Text style={styles.word}>{word.word}</Text><Text style={styles.badge}>{word.level}</Text></View><Text style={styles.translation}>{word.translation}</Text><Text style={styles.forms}>{word.forms||word.type}</Text></TouchableOpacity><TouchableOpacity onPress={()=>speak(word.word,word.id)} style={styles.iconBtn}><Text>{speakingId===word.id?'⏹':'🔊'}</Text></TouchableOpacity><TouchableOpacity onPress={onSave} style={styles.iconBtn}><Text>{saved?'★':'☆'}</Text></TouchableOpacity></View>}
function StructureList({data,speak,speakingId}:any){return <FlatList style={{flex:1}} data={data} keyExtractor={(x:any)=>x.id} contentContainerStyle={styles.list} renderItem={({item}:any)=><View style={styles.structureCard}><View style={styles.rowBetween}><Text style={styles.word}>{item.name}</Text><Text style={styles.badge}>{item.level}</Text></View><Text style={styles.pattern}>{item.pattern}</Text><Text style={styles.example}>{item.example}</Text><Text style={styles.forms}>{item.explanation}</Text><TouchableOpacity onPress={()=>speak(item.example,item.id)}><Text style={styles.listen}>{speakingId===item.id?'⏹ Durdur':'🔊 Cümleyi dinle'}</Text></TouchableOpacity></View>}/>}
function SimpleList({title,data,speak,speakingId}:any){return <FlatList style={{flex:1}} data={data} keyExtractor={(_:any,i:number)=>`${title}-${i}`} contentContainerStyle={styles.list} ListHeaderComponent={<Text style={styles.sectionTitle}>{title}</Text>} renderItem={({item,index}:any)=>{const id=`${title}-${index}`;return <View style={styles.simpleRow}><View style={{flex:1}}><Text style={styles.word}>{item[0]}</Text><Text style={styles.translation}>{item[1]}</Text>{item[2]&&<Text style={styles.forms}>{item[2]}</Text>}</View><TouchableOpacity onPress={()=>speak(item[0],id)}><Text>{speakingId===id?'⏹':'🔊'}</Text></TouchableOpacity></View>}}/>}
function ExpressionHub({speak,speakingId}:any){const [cat,setCat]=useState('daily'); const data=cat==='daily'?DAILY_EXPRESSIONS:cat==='movie'?MOVIE_STYLE:cat==='idiom'?IDIOMS:PHRASAL_VERBS; return <View style={{flex:1}}><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>{[['daily','Günlük'],['movie','Film/Dizi'],['idiom','Deyimler'],['phrasal','Phrasal Verbs']].map(([k,t])=><TouchableOpacity key={k} onPress={()=>setCat(k)} style={[styles.tabPill,cat===k&&styles.tabPillActive]}><Text style={[styles.tabPillText,cat===k&&styles.tabPillTextActive]}>{t}</Text></TouchableOpacity>)}</ScrollView><FlatList style={{flex:1}} data={data} keyExtractor={(x:any)=>x.id} contentContainerStyle={styles.list} renderItem={({item}:any)=><View style={styles.expressionCard}><View style={styles.rowBetween}><Text style={styles.word}>{item.phrase}</Text><TouchableOpacity onPress={()=>speak(item.phrase,item.id)}><Text>{speakingId===item.id?'⏹':'🔊'}</Text></TouchableOpacity></View><Text style={styles.translation}>{item.meaning}</Text><Text style={styles.forms}>{item.usage}</Text><Text style={styles.example}>{item.example}</Text></View>}/></View>}

function Practice({practiceMode,setPracticeMode,markProgress,speak,speakingId,review,scheduleReview,level}:any){const modes=[['builder','Cümle Kur'],['order','Kelime Sırala'],['mistakes','Hata Bul'],['quiz','Sınav'],['review','Tekrar']]; return <View style={{flex:1}}><Header title="Pratik" subtitle="Öğrendiğini aktif olarak üret."/><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>{modes.map(([k,t])=><TouchableOpacity key={k} onPress={()=>setPracticeMode(k)} style={[styles.tabPill,practiceMode===k&&styles.tabPillActive]}><Text style={[styles.tabPillText,practiceMode===k&&styles.tabPillTextActive]}>{t}</Text></TouchableOpacity>)}</ScrollView>{practiceMode==='builder'&&<Builder markProgress={markProgress} speak={speak} speakingId={speakingId} level={level}/>} {practiceMode==='order'&&<OrderExercise markProgress={markProgress} level={level}/>} {practiceMode==='mistakes'&&<Mistakes markProgress={markProgress} level={level}/>} {practiceMode==='quiz'&&<VocabQuiz level={level} markProgress={markProgress} speak={speak} speakingId={speakingId}/>} {practiceMode==='review'&&<Review review={review} scheduleReview={scheduleReview} speak={speak} speakingId={speakingId}/>}</View>}
function Builder({markProgress,speak,speakingId,level}:any){const [n,setN]=useState(0);const [placed,setPlaced]=useState<number[]>([]);const [done,setDone]=useState(false);const [wrong,setWrong]=useState(false);const poolExercises=useMemo(()=>BUILDER_EXERCISES.filter((x:any)=>x.level===level),[level]);const exercises=poolExercises.length?poolExercises:BUILDER_EXERCISES;const ex=exercises[n%exercises.length];const pool=useMemo(()=>ex.words.map((word,idx)=>({word,idx})).sort(()=>0.5-Math.random()),[n,level]);const built=placed.map(i=>ex.words[i]);const check=()=>{const ok=norm(built.join(' '))===norm(ex.answer);setDone(ok);setWrong(!ok);if(ok)markProgress('sentences');};return <ScrollView contentContainerStyle={styles.practiceContent}><Text style={styles.exerciseTitle}>Hadi bir cümle kuralım</Text><Text style={styles.muted}>Kelimelere sırayla dokun. Sonra kontrol et.</Text><View style={styles.target}>{placed.length?placed.map(i=><TouchableOpacity key={i} style={styles.chipPlaced} onPress={()=>{setPlaced(placed.filter(x=>x!==i));setWrong(false)}}><Text style={styles.chipText}>{ex.words[i]}</Text></TouchableOpacity>):<Text style={styles.muted}>Cümle burada oluşacak…</Text>}</View><View style={styles.chips}>{pool.map(({word,idx})=><TouchableOpacity key={idx} disabled={placed.includes(idx)} onPress={()=>{setPlaced([...placed,idx]);setWrong(false)}} style={[styles.chip,placed.includes(idx)&&styles.chipDisabled]}><Text style={styles.chipText}>{word}</Text></TouchableOpacity>)}</View>{done?<View style={styles.success}><Text style={styles.successText}>✓ Doğru! {ex.answer}</Text><TouchableOpacity style={styles.primarySmall} onPress={()=>{setN((n+1)%exercises.length);setPlaced([]);setDone(false);setWrong(false)}}><Text style={styles.primaryText}>Sonraki</Text></TouchableOpacity></View>:<TouchableOpacity style={styles.primary} onPress={check}><Text style={styles.primaryText}>Kontrol Et</Text></TouchableOpacity>}{wrong&&<Text style={[styles.errorText,{fontSize:14,marginTop:10}]}>Henüz doğru değil, kelime sırasını kontrol et.</Text>}<TouchableOpacity style={styles.secondary} onPress={()=>speak(ex.answer,'builder-'+n)}><Text style={styles.secondaryText}>{speakingId==='builder-'+n?'⏹ Durdur':'🔊 Doğru cümleyi dinle'}</Text></TouchableOpacity></ScrollView>}
function OrderExercise({markProgress,level}:any){const [i,setI]=useState(0);const [sel,setSel]=useState<number[]>([]);const [msg,setMsg]=useState('');const poolExercises=useMemo(()=>BUILDER_EXERCISES.filter((x:any)=>x.level===level),[level]);const exercises=poolExercises.length?poolExercises:BUILDER_EXERCISES;const ex=exercises[i%exercises.length];const words=useMemo(()=>ex.words.map((word,idx)=>({word,idx})).sort(()=>0.5-Math.random()),[i,level]);const check=()=>{if(norm(sel.map(x=>ex.words[x]).join(' '))===norm(ex.answer)){setMsg('✓ Doğru!');markProgress('sentences')}else setMsg('Tekrar dene. Kelime sırasını kontrol et.');};return <ScrollView contentContainerStyle={styles.practiceContent}><Text style={styles.exerciseTitle}>Kelimeleri Doğru Sırala</Text><Text style={styles.muted}>Cümleyi doğru İngilizce sırasına getir.</Text><View style={styles.target}>{sel.map(x=><TouchableOpacity key={x} style={styles.chipPlaced} onPress={()=>setSel(sel.filter(k=>k!==x))}><Text style={styles.chipText}>{ex.words[x]}</Text></TouchableOpacity>)}</View><View style={styles.chips}>{words.map(({word,idx})=><TouchableOpacity key={idx} onPress={()=>!sel.includes(idx)&&setSel([...sel,idx])} style={[styles.chip,sel.includes(idx)&&styles.chipDisabled]}><Text style={styles.chipText}>{word}</Text></TouchableOpacity>)}</View><TouchableOpacity style={styles.primary} onPress={check}><Text style={styles.primaryText}>Kontrol Et</Text></TouchableOpacity>{msg&&<Text style={styles.successText}>{msg}</Text>}<TouchableOpacity style={styles.secondary} onPress={()=>{setI((i+1)%exercises.length);setSel([]);setMsg('')}}><Text style={styles.secondaryText}>Sonraki soru</Text></TouchableOpacity></ScrollView>}
function Mistakes({markProgress,level}:any){const [i,setI]=useState(0);const [picked,setPicked]=useState<string|null>(null);const pool=useMemo(()=>ERROR_EXERCISES.filter((x:any)=>!x.level||x.level===level),[level]);const exercises=pool.length?pool:ERROR_EXERCISES;const ex=exercises[i%exercises.length];const options=useMemo(()=>shuffleArr([ex.fix,...(ex.options||ERROR_EXERCISES.filter((x:any)=>x.fix!==ex.fix).slice(0,3).map((x:any)=>x.fix))]).slice(0,4),[i,level]);return <ScrollView contentContainerStyle={styles.practiceContent}><Text style={styles.exerciseTitle}>Hata Avcısı</Text><Text style={styles.muted}>Yanlış cümleyi oku, en doğru düzeltmeyi seç. İpucu ve açıklama cevaptan sonra açılır.</Text><View style={styles.errorCard}><Text style={styles.errorText}>{ex.bad}</Text><Text style={styles.forms}>Doğru cümle hangisi?</Text></View>{options.map((option:string)=><TouchableOpacity key={option} disabled={!!picked} style={[styles.quizOption,picked===option&&option===ex.fix&&styles.quizOptionCorrect,picked===option&&option!==ex.fix&&styles.quizOptionWrong]} onPress={()=>{setPicked(option);if(option===ex.fix)markProgress('sentences')}}><Text style={styles.quizOptionText}>{option}</Text></TouchableOpacity>)}{picked&&<View style={styles.success}><Text style={styles.successText}>{picked===ex.fix?'✓ Doğru düzeltme!':'Doğru cevap: '+ex.fix}</Text><Text style={styles.muted}>{ex.explain}</Text><TouchableOpacity style={styles.primarySmall} onPress={()=>{setI((i+1)%exercises.length);setPicked(null)}}><Text style={styles.primaryText}>Sonraki soru →</Text></TouchableOpacity></View>}</ScrollView>}
function Review({review,scheduleReview,speak,speakingId}:any){const due=ALL_WORDS.filter(w=>{const r=review[w.id];return !r||r.next<=Date.now()}).slice(0,20);const [i,setI]=useState(0);const w=due[i];if(!w)return <View style={styles.center}><Text style={styles.exerciseTitle}>🎉 Tekrar tamamlandı</Text><Text style={styles.muted}>Şimdilik bekleyen kelime yok.</Text></View>;return <ScrollView contentContainerStyle={styles.practiceContent}><Text style={styles.exerciseTitle}>Spaced Repetition</Text><Text style={styles.muted}>Unuttuysan yeniden kısa aralıkla, hatırladıysan daha ileri tarihe gönderiyoruz.</Text><View style={styles.reviewCard}><Text style={styles.reviewWord}>{w.word}</Text><Text style={styles.modalTr}>{w.translation}</Text><Text style={styles.forms}>{w.forms||w.type}</Text><TouchableOpacity onPress={()=>speak(w.word,w.id)} style={styles.secondary}><Text style={styles.secondaryText}>{speakingId===w.id?'⏹ Durdur':'🔊 Dinle'}</Text></TouchableOpacity></View><View style={styles.row}><TouchableOpacity style={[styles.reviewBtn,styles.badBtn]} onPress={()=>{scheduleReview(w.id,false);setI(i+1)}}><Text style={styles.reviewBtnText}>❌ Unuttum</Text></TouchableOpacity><TouchableOpacity style={[styles.reviewBtn,styles.goodBtn]} onPress={()=>{scheduleReview(w.id,true);setI(i+1)}}><Text style={styles.reviewBtnText}>✓ Hatırladım</Text></TouchableOpacity></View></ScrollView>}

const shuffleArr = <T,>(arr:T[]):T[] => [...arr].sort(()=>0.5-Math.random());
const QUIZ_LENGTH = 10;
type QuizQ = { wordId:string; kind:'tr'|'en'|'fill'; prompt:string; options:string[]; answer:string };
function buildQuizQuestion(pool:Word[]):QuizQ{
  const word=pool[Math.floor(Math.random()*pool.length)];
  const kind=(['tr','en','fill'] as const)[Math.floor(Math.random()*3)];
  const distractors=shuffleArr(pool.filter(w=>w.id!==word.id)).slice(0,3);
  if(kind==='tr'){const options=shuffleArr([word.translation,...distractors.map(d=>d.translation)]);return{wordId:word.id,kind,prompt:`'${word.word}' kelimesinin Türkçe karşılığı nedir?`,options,answer:word.translation};}
  if(kind==='en'){const options=shuffleArr([word.word,...distractors.map(d=>d.word)]);return{wordId:word.id,kind,prompt:`'${word.translation}' kelimesinin İngilizcesi nedir?`,options,answer:word.word};}
  const templates=FILL_TEMPLATES[word.type]||FILL_TEMPLATES.Other;
  const sentence=templates[Math.floor(Math.random()*templates.length)];
  const options=shuffleArr([word.word,...distractors.map(d=>d.word)]);
  return{wordId:word.id,kind,prompt:sentence,options,answer:word.word};
}
function VocabQuiz({level,markProgress,speak,speakingId}:any){
  const pool=useMemo(()=>ALL_WORDS.filter(w=>w.level===level),[level]);
  const [qi,setQi]=useState(0);
  const [score,setScore]=useState(0);
  const [q,setQ]=useState<QuizQ>(()=>buildQuizQuestion(pool));
  const [picked,setPicked]=useState<string|null>(null);
  const word=ALL_WORDS.find(w=>w.id===q.wordId)!;
  const pick=(opt:string)=>{
    if(picked)return;
    setPicked(opt);
    if(opt===q.answer){setScore(s=>s+1);markProgress('quiz');}
  };
  const next=()=>{setQi(i=>i+1);setPicked(null);setQ(buildQuizQuestion(pool));};
  const restart=()=>{setQi(0);setScore(0);setPicked(null);setQ(buildQuizQuestion(pool));};
  if(qi>=QUIZ_LENGTH)return <View style={styles.center}><Text style={styles.exerciseTitle}>🎯 Sınav bitti</Text><Text style={styles.reviewWord}>{score}/{QUIZ_LENGTH}</Text><Text style={styles.muted}>{level} seviyesi kelime sınavı.</Text><TouchableOpacity style={styles.primary} onPress={restart}><Text style={styles.primaryText}>Yeniden başla</Text></TouchableOpacity></View>;
  return <ScrollView contentContainerStyle={styles.practiceContent}>
    <View style={styles.rowBetween}><Text style={styles.exerciseTitle}>Kelime Sınavı</Text><Text style={styles.badge}>{qi+1}/{QUIZ_LENGTH} · {score} doğru</Text></View>
    <Text style={styles.muted}>{q.kind==='fill'?'Boşluğa uygun kelimeyi seç. Kelime cümlede kullanılıyor.':'Doğru karşılığı seç.'}</Text>
    <View style={styles.quizCard}><Text style={styles.quizPrompt}>{q.prompt}</Text>
      {q.kind==='fill'&&<TouchableOpacity onPress={()=>speak(q.prompt.replace('___',word.word),'quiz-'+word.id)} style={{marginTop:8}}><Text style={styles.listen}>{speakingId==='quiz-'+word.id?'⏹ Durdur':'🔊 Cümleyi dinle'}</Text></TouchableOpacity>}
    </View>
    {q.options.map(opt=>{
      const isAnswer=opt===q.answer; const isPicked=opt===picked;
      const style=!picked?styles.quizOption:isAnswer?styles.quizOptionCorrect:isPicked?styles.quizOptionWrong:styles.quizOption;
      return <TouchableOpacity key={opt} style={style} onPress={()=>pick(opt)} disabled={!!picked}><Text style={styles.quizOptionText}>{opt}</Text></TouchableOpacity>;
    })}
    {picked&&<TouchableOpacity style={styles.primary} onPress={next}><Text style={styles.primaryText}>{picked===q.answer?'✓ Doğru · Sonraki':'✗ Yanlış · Sonraki'}</Text></TouchableOpacity>}
  </ScrollView>;
}

function Stories({speak,speakingId,markProgress}:any){
 const [level,setLevel]=useState<'A1'|'A2'|'B1'|'B2'>('A2'); const [selected,setSelected]=useState<Story|null>(null); const list=STORIES.filter(story=>story.level===level);
 return <View style={{flex:1}}><Header title="Hikâyeler" subtitle="Oku · dinle · Türkçeyi aç · yapıyı incele"/>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>{(['A1','A2','B1','B2'] as const).map(l=><TouchableOpacity key={l} onPress={()=>setLevel(l)} style={[styles.tabPill,level===l&&styles.tabPillActive]}><Text style={[styles.tabPillText,level===l&&styles.tabPillTextActive]}>{l} · {STORIES.filter(story=>story.level===l).length} hikâye</Text></TouchableOpacity>)}</ScrollView>
 <Text style={styles.contentCount}>{level} · {list.length} kısa hikâye</Text>
 <FlatList style={{flex:1}} data={list} keyExtractor={x=>x.id} contentContainerStyle={styles.list} renderItem={({item})=><TouchableOpacity style={styles.storyCard} onPress={()=>setSelected(item)}><View style={styles.rowBetween}><Text style={styles.word}>{item.title}</Text><Text style={styles.badge}>{item.level}</Text></View><Text style={styles.muted} numberOfLines={3}>{item.content}</Text><Text style={styles.listen}>🔊 Sesli hikâye · {item.keyStructures.slice(0,2).join(' · ')}</Text></TouchableOpacity>}/>
 <Modal visible={!!selected} transparent animationType="slide" onRequestClose={()=>setSelected(null)}><View style={styles.modalShade}><View style={styles.storyModal}>{selected&&<StoryDetail story={selected} speak={speak} speakingId={speakingId} markProgress={markProgress} close={()=>setSelected(null)}/>}</View></View></Modal></View>}
function StoryDetail({story,speak,speakingId,markProgress,close}:any){const [tr,setTr]=useState(false);return <ScrollView><View style={styles.rowBetween}><Text style={styles.modalWord}>{story.title}</Text><Text style={styles.badge}>{story.level}</Text></View><Text style={styles.storyBody}>{story.content}</Text><TouchableOpacity style={styles.primary} onPress={()=>{speak(story.content,story.id);markProgress('stories')}}><Text style={styles.primaryText}>{speakingId===story.id?'⏹ Durdur':'🔊 Hikâyeyi seslendir'}</Text></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={()=>setTr(!tr)}><Text style={styles.secondaryText}>{tr?'🇬🇧 İngilizceyi göster':'🇹🇷 Türkçe çeviriyi göster'}</Text></TouchableOpacity>{tr&&<Text style={styles.storyTr}>{story.translation}</Text>}<View style={styles.structureBox}><Text style={styles.sectionTitle}>Hikâyeden cümle yapıları</Text>{story.keyStructures.map((x:string)=><Text key={x} style={styles.forms}>• {x}</Text>)}</View><TouchableOpacity style={styles.close} onPress={close}><Text style={styles.muted}>Kapat</Text></TouchableOpacity></ScrollView>}

function Notebook({notebook,toggleNotebook,speak,speakingId}:any){const words=ALL_WORDS.filter(w=>notebook.includes(w.id));return <View style={{flex:1}}><Header title="Kelime Defterim" subtitle="Kendi seçtiğin kelimeler. Silme/ekleme tamamen sende."/>{words.length===0?<View style={styles.empty}><Text style={styles.emptyIcon}>☆</Text><Text style={styles.exerciseTitle}>Defterin boş</Text><Text style={styles.muted}>Kelime Öğren bölümünde bir kelimenin ☆ simgesine dokunarak buraya ekle.</Text></View>:<FlatList style={{flex:1}} data={words} keyExtractor={x=>x.id} contentContainerStyle={styles.list} renderItem={({item})=><View style={styles.wordRow}><View style={{flex:1}}><Text style={styles.word}>{item.word}</Text><Text style={styles.translation}>{item.translation}</Text><Text style={styles.forms}>{item.forms||item.type}</Text><Text style={styles.example}>{item.example}</Text></View><View><TouchableOpacity onPress={()=>speak(item.word,item.id)} style={styles.iconBtn}><Text>{speakingId===item.id?'⏹':'🔊'}</Text></TouchableOpacity><TouchableOpacity onPress={()=>toggleNotebook(item.id)} style={styles.iconBtn}><Text>🗑</Text></TouchableOpacity></View></View>}/>}</View>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:Colors.bgDeep}, content:{padding:18,paddingBottom:110}, center:{flex:1,alignItems:'center',justifyContent:'center',padding:24}, logo:{fontSize:28,fontWeight:'800',letterSpacing:1,color:Colors.text},logoAccent:{color:Colors.amber},tagline:{color:Colors.textDim,marginTop:8},muted:{color:Colors.textDim,fontSize:13,lineHeight:20},onboard:{padding:24,paddingTop:60,paddingBottom:40},brandMark:{marginBottom:45},hero:{fontSize:32,fontWeight:'800',color:Colors.text,lineHeight:38,marginBottom:10},label:{fontSize:11,letterSpacing:1.5,color:Colors.amber,fontWeight:'800',marginTop:28,marginBottom:10},optionRow:{flexDirection:'row',gap:10},option:{flex:1,borderWidth:1,borderColor:Colors.line,borderRadius:18,padding:16,backgroundColor:Colors.surface},optionActive:{borderColor:Colors.amber,backgroundColor:'rgba(125,211,199,0.12)'},optionTitle:{fontSize:19,fontWeight:'800',color:Colors.text},optionTitleActive:{color:Colors.amber},optionSub:{fontSize:11,color:Colors.textDim,lineHeight:16,marginTop:6},goalOption:{flex:1,alignItems:'center',paddingVertical:14,borderWidth:1,borderColor:Colors.line,borderRadius:16,backgroundColor:Colors.surface},goalNumber:{fontSize:22,fontWeight:'800',color:Colors.text},infoBox:{marginTop:24,padding:16,borderRadius:18,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line},infoTitle:{fontSize:15,fontWeight:'800',color:Colors.teal,marginBottom:6},primary:{backgroundColor:Colors.amber,paddingVertical:15,paddingHorizontal:18,borderRadius:16,alignItems:'center',marginTop:16},primarySmall:{backgroundColor:Colors.amber,paddingVertical:11,paddingHorizontal:15,borderRadius:13,alignItems:'center',marginTop:10},primaryText:{color:Colors.amberDark,fontWeight:'900'},secondary:{borderWidth:1,borderColor:Colors.line,paddingVertical:13,paddingHorizontal:16,borderRadius:14,alignItems:'center',marginTop:10,backgroundColor:Colors.surface},secondaryText:{color:Colors.text,fontWeight:'700'},header:{paddingHorizontal:18,paddingTop:18,paddingBottom:12},headerTitle:{fontSize:28,fontWeight:'800',color:Colors.text},headerSub:{color:Colors.textDim,fontSize:12,marginTop:4},
topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingTop:Platform.OS==='android'?(StatusBar.currentHeight||0)+10:10,paddingBottom:12,borderBottomWidth:1,borderBottomColor:Colors.line,backgroundColor:Colors.bgDeep},
logoBadge:{width:28,height:28,borderRadius:9,backgroundColor:Colors.amber,alignItems:'center',justifyContent:'center'},
topBarTitle:{fontSize:14,fontWeight:'700',color:Colors.text},
streakBadge:{flexDirection:'row',alignItems:'center',gap:4},
streakText:{fontSize:12,color:Colors.amber,fontWeight:'800'},
homeHero:{padding:18,borderRadius:22,borderWidth:1,borderColor:Colors.line,marginTop:4},kicker:{fontSize:10,letterSpacing:1.4,color:Colors.amber,fontWeight:'800',marginBottom:8},bigTitle:{fontSize:26,lineHeight:32,fontWeight:'800',color:Colors.text,marginBottom:16},accent:{color:Colors.amber},goalCard:{marginTop:18,padding:20,borderRadius:24,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardEyebrow:{fontSize:10,letterSpacing:1.2,color:Colors.textFaint,fontWeight:'800'},goalBig:{fontSize:32,fontWeight:'900',color:Colors.text,marginTop:3},goalSlash:{fontSize:14,color:Colors.textDim,fontWeight:'600'},ring:{width:56,height:56,borderRadius:28,borderWidth:6,borderColor:Colors.teal,alignItems:'center',justifyContent:'center'},ringText:{color:Colors.text,fontWeight:'900',fontSize:12},grid2:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:12,marginBottom:12},quick:{width:'48%',minHeight:110,padding:16,borderRadius:20,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line},quickIcon:{fontSize:24,marginBottom:12},quickTitle:{fontSize:15,fontWeight:'800',color:Colors.text,marginTop:10,marginBottom:3},panel:{backgroundColor:Colors.surface,borderRadius:22,borderWidth:1,borderColor:Colors.line,padding:16,marginBottom:12},sectionTitle:{fontSize:17,fontWeight:'800',color:Colors.text},mini:{width:145,backgroundColor:Colors.bgDeep,borderRadius:16,padding:14,marginRight:10,borderWidth:1,borderColor:Colors.line},miniWord:{fontSize:18,fontWeight:'800',color:Colors.text},miniTr:{fontSize:12,color:Colors.textDim,marginTop:5},miniActions:{flexDirection:'row',justifyContent:'space-between',marginTop:14},row:{flexDirection:'row',alignItems:'center',gap:8},rowBetween:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},reviewBadge:{backgroundColor:Colors.teal,borderRadius:20,minWidth:42,height:42,alignItems:'center',justifyContent:'center',color:Colors.tealDark,fontWeight:'900',textAlign:'center',paddingTop:12},nav:{position:'absolute',left:10,right:10,bottom:10,height:70,borderRadius:22,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},navItem:{alignItems:'center',justifyContent:'center',minWidth:60},navIcon:{fontSize:18,color:Colors.textFaint},navText:{fontSize:9,color:Colors.textFaint,marginTop:3,fontWeight:'700'},navActive:{color:Colors.amber},tabScroll:{height:58,flexGrow:0},tabs:{height:58,paddingHorizontal:14,paddingVertical:8,gap:8,alignItems:'center'},tabPill:{height:42,alignSelf:'center',justifyContent:'center',borderWidth:1,borderColor:Colors.line,borderRadius:14,paddingHorizontal:14,backgroundColor:Colors.surface,flexGrow:0},tabPillActive:{borderColor:Colors.amber,backgroundColor:'rgba(125,211,199,0.12)'},tabPillText:{fontSize:12,color:Colors.textDim,fontWeight:'800'},tabPillTextActive:{color:Colors.amber},filters:{paddingHorizontal:14,paddingBottom:10,flexDirection:'row',alignItems:'center',gap:7},searchBox:{flex:1,borderWidth:1,borderColor:Colors.line,borderRadius:13,backgroundColor:Colors.surface},searchInput:{color:Colors.text,paddingHorizontal:12,paddingVertical:10,fontSize:13},levelPill:{paddingHorizontal:10,paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:Colors.line},levelPillActive:{borderColor:Colors.teal},levelPillText:{fontSize:10,color:Colors.textDim,fontWeight:'800'},contentCount:{paddingHorizontal:18,paddingBottom:6,color:Colors.textFaint,fontSize:12,fontWeight:'700'},list:{padding:14,paddingBottom:118},wordRow:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:18,padding:15,marginBottom:9,flexDirection:'row',gap:10},word:{fontSize:16,fontWeight:'800',color:Colors.text,flexShrink:1},badge:{fontSize:9,color:Colors.teal,backgroundColor:'rgba(125,211,199,0.12)',paddingHorizontal:8,paddingVertical:4,borderRadius:8,fontWeight:'800',overflow:'hidden'},translation:{fontSize:13,color:Colors.textDim,marginTop:5},forms:{fontSize:11,color:Colors.textFaint,marginTop:5,lineHeight:17},example:{fontSize:13,color:Colors.teal,marginTop:8,lineHeight:20,fontStyle:'italic'},iconBtn:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:Colors.surface},settingsBtn:{width:46,height:46,alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line},structureCard:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:18,padding:15,marginBottom:9},pattern:{fontFamily:Platform.OS==='android'?'monospace':undefined,color:Colors.amber,fontSize:12,marginTop:8},listen:{color:Colors.amber,fontSize:12,fontWeight:'800',marginTop:10},simpleRow:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:16,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center'},expressionCard:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:18,padding:15,marginBottom:9},practiceContent:{padding:18,paddingBottom:120},exerciseTitle:{fontSize:24,fontWeight:'900',color:Colors.text,marginBottom:7},target:{minHeight:90,borderWidth:1.5,borderColor:Colors.amber,borderRadius:18,padding:12,marginTop:18,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:7,backgroundColor:'rgba(125,211,199,0.05)'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},chip:{backgroundColor:Colors.amber,paddingHorizontal:13,paddingVertical:10,borderRadius:999},chipDisabled:{opacity:.25},chipPlaced:{backgroundColor:Colors.bgDeep,borderWidth:1,borderColor:Colors.teal,paddingHorizontal:12,paddingVertical:9,borderRadius:999},chipText:{color:Colors.text,fontWeight:'800',fontSize:12},success:{backgroundColor:'rgba(125,211,199,0.10)',borderColor:Colors.teal,borderWidth:1,borderRadius:16,padding:14,marginTop:14},successText:{color:Colors.teal,fontWeight:'800',lineHeight:20},errorCard:{backgroundColor:'rgba(232,115,95,0.08)',borderWidth:1,borderColor:Colors.coral,borderRadius:18,padding:20,marginTop:18},errorText:{color:Colors.coral,fontSize:18,fontWeight:'800'},reviewCard:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:24,padding:26,marginTop:18,alignItems:'center'},reviewWord:{fontSize:38,fontWeight:'900',color:Colors.text},modalShade:{flex:1,backgroundColor:'rgba(0,0,0,0.72)',justifyContent:'flex-end'},wordModal:{maxHeight:'82%',backgroundColor:Colors.bgDeep,borderTopLeftRadius:28,borderTopRightRadius:28,borderWidth:1,borderColor:Colors.line,padding:20},storyModal:{maxHeight:'88%',backgroundColor:Colors.bgDeep,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20},modalWord:{fontSize:28,fontWeight:'900',color:Colors.text,flex:1},modalTr:{fontSize:18,color:Colors.teal,marginTop:7},modalActions:{flexDirection:'row',gap:9,marginTop:12},close:{alignItems:'center',padding:15,marginTop:8},storyCard:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:20,padding:16,marginBottom:10},storyBody:{fontSize:15,lineHeight:24,color:Colors.text,marginTop:14},storyTr:{fontSize:13,lineHeight:21,color:Colors.textDim,marginTop:12},structureBox:{marginTop:16,borderRadius:16,padding:14,backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line},segment:{marginHorizontal:14,marginBottom:4,backgroundColor:Colors.surface,borderRadius:14,padding:4,flexDirection:'row',borderWidth:1,borderColor:Colors.line},segmentBtn:{flex:1,paddingVertical:10,alignItems:'center',borderRadius:11},segmentActive:{backgroundColor:Colors.amber},segmentText:{fontSize:11,fontWeight:'800',color:Colors.text},empty:{flex:1,alignItems:'center',justifyContent:'center',padding:35},emptyIcon:{fontSize:60,color:Colors.amber,marginBottom:10},reviewBtn:{flex:1,paddingVertical:15,borderRadius:15,alignItems:'center',marginTop:12},badBtn:{backgroundColor:'rgba(232,115,95,0.18)',borderWidth:1,borderColor:Colors.coral},goodBtn:{backgroundColor:'rgba(95,207,163,0.18)',borderWidth:1,borderColor:Colors.teal},reviewBtnText:{fontWeight:'900',color:Colors.text},
quizCard:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:18,padding:18,marginTop:14,marginBottom:6},quizPrompt:{fontSize:17,fontWeight:'700',color:Colors.text,lineHeight:24},quizOption:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.line,borderRadius:14,padding:14,marginTop:9},quizOptionCorrect:{backgroundColor:'rgba(95,207,163,0.16)',borderWidth:1,borderColor:Colors.teal,borderRadius:14,padding:14,marginTop:9},quizOptionWrong:{backgroundColor:'rgba(232,115,95,0.16)',borderWidth:1,borderColor:Colors.coral,borderRadius:14,padding:14,marginTop:9},quizOptionText:{color:Colors.text,fontWeight:'700',fontSize:14},
mascot:{width:124,height:124,borderRadius:62,marginBottom:16,borderWidth:1,backgroundColor:Colors.surface,borderColor:Colors.line,alignItems:'center',justifyContent:'center'},authBtn:{marginTop:10,paddingVertical:14,paddingHorizontal:16,borderRadius:16,borderWidth:1,borderColor:Colors.line,backgroundColor:Colors.surface},authText:{color:Colors.text,fontWeight:'800',fontSize:14},levelGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:18},levelCard:{width:'47%',padding:16,borderRadius:18,borderWidth:1,borderColor:Colors.line,backgroundColor:Colors.surface},reminderRow:{marginTop:22,padding:16,borderRadius:18,borderWidth:1,borderColor:Colors.line,backgroundColor:Colors.surface,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},shipTrack:{flexDirection:'row',alignItems:'center',gap:8,marginTop:4},ship:{fontSize:28},island:{fontSize:24},shipLine:{flex:1,height:10,borderRadius:999,backgroundColor:Colors.bgDeep,overflow:'hidden',borderWidth:1,borderColor:Colors.line},shipFill:{height:'100%',backgroundColor:Colors.teal,borderRadius:999},goalSmall:{color:Colors.textDim,fontWeight:'700',marginTop:10}
});