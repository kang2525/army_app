import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
// 1. 필요한 함수들을 정확히 임포트합니다.
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';

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
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  const [newName, setNewName] = useState('');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // 실시간 데이터 읽기
  useEffect(() => {
    const membersRef = ref(db, 'members');
    return onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // 객체 형태를 배열로 변환
        const memberList = Object.keys(data).map(key => ({
          ...data[key],
          id: key // Firebase 키값을 id로 사용
        }));
        setMembers(memberList);
      } else {
        setMembers([]);
      }
    });
  }, []);

  // 2. 상태 변경 함수 (더 확실한 경로 지정)
  const handleStatusUpdate = (memberId, newStatus) => {
    if (!memberId) return;
    const memberRef = ref(db, `members/${memberId}`);
    update(memberRef, { status: newStatus })
      .then(() => console.log("업데이트 성공"))
      .catch((error) => alert("오류 발생: " + error.message));
  };

  // 대원 추가 함수
  const addMember = () => {
    if (!newName) return;
    const id = Date.now().toString(); // 고유 ID 생성
    set(ref(db, `members/${id}`), {
      id: id,
      name: newName,
      unit: activeTab,
      joinDate: newJoinDate,
      status: '미복귀'
    });
    setNewName('');
  };

  const deleteMember = (id) => {
    remove(ref(db, `members/${id}`));
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

  // 통계 계산
  const currentMembers = members.filter(m => m.unit === activeTab);
  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => m.status === '미복귀' || !m.status).length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '50px' },
    header: { background: '#2d391e', padding: '20px', color: 'white', borderRadius: '0 0 20px 20px' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '15px', borderRadius: '15px', margin: '10px 15px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
    // 클릭 영역 확보를 위해 padding을 키우고 터치 강조를 넣었습니다.
    statusBtn: (active, color) => ({ 
      flex: 1, 
      padding: '15px 0', 
      borderRadius: '10px', 
      border: 'none', 
      background: active ? color : '#eee', 
      color: active ? 'white' : '#777', 
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
      WebkitTapHighlightColor: 'rgba(0,0,0,0)' 
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>분대 관리 시스템</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none' }} 
            placeholder="이름" 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
          />
          <button 
            style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold' }} 
            onClick={addMember}
          >추가</button>
        </div>
      </div>

      {/* 부대 선택 탭 */}
      <div style={{ display: 'flex', gap: '10px', padding: '15px', overflowX: 'auto' }}>
        {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
          <button 
            key={u} 
            style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : 'white', color: activeTab === u ? '#e9ce63' : '#555' }} 
            onClick={() => setActiveTab(u)}
          >{u}</button>
        ))}
      </div>

      {/* 통계 수치 */}
      <div style={styles.statsBar}>
        <div style={{textAlign:'center'}}><small>총원</small><br/><b>{stats.total}</b></div>
        <div style={{textAlign:'center'}}><small>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
        <div style={{textAlign:'center'}}><small>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
        <div style={{textAlign:'center'}}><small>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
      </div>

      {/* 대원 리스트 */}
      {currentMembers.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).map(m => (
        <div key={m.id} style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>{m.name} <small style={{color:'#999'}}>{calculatePercent(m.joinDate)}%</small></span>
            <button style={{ border: 'none', background: 'none', color: '#ddd' }} onClick={() => deleteMember(m.id)}>✕</button>
          </div>
          
          <div style={{ width: '100%', height: '4px', background: '#eee', borderRadius: '2px', marginBottom: '15px' }}>
            <div style={{ width: `${calculatePercent(m.joinDate)}%`, height: '100%', background: '#73c088' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              style={styles.statusBtn(m.status === '복귀', '#2ecc71')} 
              onClick={() => handleStatusUpdate(m.id, '복귀')}
            >복귀</button>
            <button 
              style={styles.statusBtn(m.status === '미복귀' || !m.status, '#e74c3c')} 
              onClick={() => handleStatusUpdate(m.id, '미복귀')}
            >미복귀</button>
            <button 
              style={styles.statusBtn(m.status === '잔류', '#3498db')} 
              onClick={() => handleStatusUpdate(m.id, '잔류')}
            >잔류</button>
          </div>
        </div>
      ))}
    </div>
  );
}