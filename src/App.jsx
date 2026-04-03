import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBbqaA06Uq05IFDbWDOMeBOlRy2eqF0OR0E",
  authDomain: "armyapp-f95eb.firebaseapp.com",
  databaseURL: "https://armyapp-f95eb-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "armyapp-f95eb",
  storageBucket: "armyapp-f95eb.firebasestorage.app",
  messagingSenderId: "985720950178",
  appId: "1:985720950178:web:4a4c0cc37a21a56d0576fb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]); // 로그 상태 추가
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id') || null);

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // 1. 대원 데이터 동기화
    onValue(ref(db, 'members'), (snapshot) => {
      const data = snapshot.val();
      setMembers(data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : []);
    });

    // 2. 로그 데이터 동기화 (최근 50개만)
    onValue(ref(db, 'logs'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logArr = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setLogs(logArr.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50));
      } else {
        setLogs([]);
      }
    });
  }, []);

  const registerMe = (member) => {
    if (myId || member.isRegistered) return;
    if (window.confirm(`'${member.name}' 대원으로 이 기기를 등록하시겠습니까?`)) {
      update(ref(db, `members/${member.id}`), { isRegistered: true });
      localStorage.setItem('katusa_my_id', member.id);
      setMyId(member.id);
    }
  };

  const handleStatusUpdate = (member, newStatus) => {
    if (member.id !== myId) return;
    
    // 상태 업데이트
    update(ref(db, `members/${member.id}`), { status: newStatus });

    // 로그 생성 (복귀/미복귀/잔류 버튼 누를 때마다 기록)
    const now = new Date();
    push(ref(db, 'logs'), {
      name: member.name,
      unit: member.unit,
      status: newStatus,
      timeString: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      dateString: now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      timestamp: now.getTime()
    });
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' },
    header: { background: '#2d391e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' },
    title: { margin: '0 0 25px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' },
    navTabContainer: { 
      display: 'flex', background: 'rgba(255,255,255,0.1)', margin: '20px 0 10px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)'
    },
    navTab: (active) => ({ 
      flex: 1, padding: '14px', border: 'none', background: active ? '#e9ce63' : 'transparent', color: active ? '#2d391e' : 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '13px'
    }),
    card: (isMe, isOtherReg) => ({ 
      background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', 
      boxShadow: isMe ? '0 0 15px rgba(233, 206, 99, 0.4)' : '0 2px 5px rgba(0,0,0,0.02)', 
      position: 'relative', border: isMe ? '2px solid #e9ce63' : '2px solid transparent',
      opacity: (myId && !isMe) || (isOtherReg && !isMe) ? 0.5 : 1
    }),
    logItem: { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', background: 'white' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Katusa Tracker</h2>
        <div style={styles.navTabContainer}>
          <button style={styles.navTab(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navTab(view === 'logs')} onClick={() => setView('logs')}>기록 로그</button>
          <button style={styles.navTab(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          {/* 부대 필터 및 통계 바 (이전과 동일) */}
          <div style={{ display: 'flex', gap: '8px', padding: '15px 20px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          {currentMembers
            .sort((a, b) => {
              const dateA = new Date(a.joinDate);
              const dateB = new Date(b.joinDate);
              if (dateA - dateB !== 0) return dateA - dateB;
              return a.name.localeCompare(b.name, 'ko');
            })
            .map(m => {
              const isMe = m.id === myId;
              const isOtherReg = m.isRegistered && !isMe;
              return (
                <div key={m.id} style={styles.card(isMe, isOtherReg)} onClick={() => registerMe(m)}>
                   <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                    {m.name} {isMe && <span style={{fontSize:'12px', color:'#e9ce63'}}>★ 나</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', background: m.status === '복귀' ? '#2ecc71' : '#f1f3f5', color: m.status === '복귀' ? 'white' : '#777', fontWeight: 'bold' }} onClick={() => handleStatusUpdate(m, '복귀')}>복귀</button>
                    <button style={{ flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', background: m.status === '미복귀' ? '#e74c3c' : '#f1f3f5', color: m.status === '미복귀' ? 'white' : '#777', fontWeight: 'bold' }} onClick={() => handleStatusUpdate(m, '미복귀')}>미복귀</button>
                  </div>
                </div>
              );
          })}
        </>
      ) : view === 'logs' ? (
        <div style={{ padding: '10px 0' }}>
          <h4 style={{ padding: '0 20px', color: '#666' }}>최근 복귀 기록</h4>
          {logs.map(log => (
            <div key={log.id} style={styles.logItem}>
              <div>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{log.name}</span>
                <small style={{ color: '#888' }}>{log.unit}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: log.status === '복귀' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold', marginRight: '10px' }}>{log.status}</span>
                <small style={{ color: '#bbb' }}>{log.dateString} {log.timeString}</small>
              </div>
            </div>
          ))}
          {logs.length === 0 && <p style={{ textAlign: 'center', color: '#ccc', marginTop: '50px' }}>아직 기록된 로그가 없습니다.</p>}
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <Calendar onClickDay={setSelectedDate} value={selectedDate} />
        </div>
      )}
    </div>
  );
}