import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
// Firebase 라이브러리 설치 필요: npm install firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// 1. Firebase 설정 (본인의 Firebase 콘솔에서 프로젝트 생성 후 아래 내용을 채워주세요)
// App.jsx 상단에 본인의 정보를 이렇게 업데이트하세요
const firebaseConfig = {
  apiKey: "AIzaSyBbqaA06Uq05IFDbWDOMeBOlRy2eqF0OR0E",
  authDomain: "armyapp-f95eb.firebaseapp.com",
  // 바로 이 부분을 지금 찾으신 주소로 넣으세요!
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
  const [vacations, setVacations] = useState([]);
  
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('HHC');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가', start: '', end: '' });

  // 2. 데이터 실시간 동기화 (DB에서 가져오기)
  useEffect(() => {
    const membersRef = ref(db, 'members');
    const vacationsRef = ref(db, 'vacations');

    onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      setMembers(data ? Object.values(data) : []);
    });

    onValue(vacationsRef, (snapshot) => {
      const data = snapshot.val();
      setVacations(data ? Object.values(data) : []);
    });
  }, []);

  // 3. 데이터 저장 함수 (DB에 쓰기)
  const syncMembers = (newList) => set(ref(db, 'members'), newList);
  const syncVacations = (newList) => set(ref(db, 'vacations'), newList);

  // 짬순 정렬 (입대일 오름차순)
  const sortedMembers = [...members]
    .filter(m => m.unit === activeTab)
    .sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));

  const updateStatus = (id, targetStatus) => {
    const newList = members.map(m => m.id === id ? { ...m, status: targetStatus } : m);
    syncMembers(newList);
  };

  const deleteMember = (id) => {
    const newList = members.filter(m => m.id !== id);
    syncMembers(newList);
  };

  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((today - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  const stats = (() => {
    const list = members.filter(m => m.unit === activeTab);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  })();

  const getColor = (name) => {
    const colors = ['#5fb2b2', '#73c088', '#f2bc57', '#e74c3c', '#3498db'];
    return colors[name.length % colors.length] || colors[0];
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif', position: 'relative' },
    header: { background: '#2d391e', padding: '20px', borderRadius: '0 0 30px 30px', color: 'white' },
    nav: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' },
    navBtn: (active) => ({ background: 'none', border: 'none', color: active ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', fontSize: '16px', borderBottom: active ? '2px solid #e9ce63' : 'none', padding: '5px' }),
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px 20px', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '20px', borderRadius: '25px', margin: '0 20px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '13px' }),
    fab: { position: 'fixed', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '28px', background: '#2d391e', color: '#e9ce63', fontSize: '30px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.nav}>
          <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
        {view === 'main' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ flex: 1, padding: '10px', borderRadius: '10px' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
              </select>
              <input type="date" style={{ flex: 1.5, padding: '10px', borderRadius: '10px' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ flex: 4, padding: '10px', borderRadius: '10px', border: 'none' }} placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold' }} onClick={() => { if(newName){ syncMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]); setNewName(''); } }}>추가</button>
            </div>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: activeTab === u ? '#2d391e' : 'white', color: activeTab === u ? '#e9ce63' : '#555' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {sortedMembers.map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{ position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ccc' }} onClick={() => deleteMember(m.id)}>✕</button>
              <div style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                {m.name} <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 'normal' }}>{calculatePercent(m.joinDate)}%</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀', '#e74c3c')} onClick={() => updateStatus(m.id, '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '10px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <Calendar 
              onClickDay={setSelectedDate} value={selectedDate} formatDay={(l, d) => d.getDate()}
              tileContent={({date}) => {
                const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const dayVacations = vacations.filter(v => d >= v.start && d <= v.end);
                return (
                  <div className="v-container">
                    {dayVacations.map((v, i) => (
                      <div key={i} className="v-bar" style={{ background: getColor(v.name) }}>{v.name}</div>
                    ))}
                  </div>
                );
              }}
            />
          </div>
          {/* 하단 상세 명단 생략 (위와 동일) */}
          <button style={styles.fab} onClick={() => setShowModal(true)}>+</button>
        </div>
      )}
      {/* 모달 등 스타일 생략 (위와 동일) */}
    </div>
  );
}