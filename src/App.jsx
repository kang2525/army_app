import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';

// ⚠️ 분대장님의 실제 Config를 유지하세요!
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
  const [activeTab, setActiveTab] = useState('HHC');
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // 실시간 데이터 읽기
  useEffect(() => {
    const membersRef = ref(db, 'members');
    return onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const memberList = Object.keys(data).map(key => ({
          ...data[key],
          id: key 
        }));
        setMembers(memberList);
      } else {
        setMembers([]);
      }
    });
  }, []);

  // 상태 변경 (복귀/미복귀/잔류) - 클릭 즉시 반영
  const handleStatusUpdate = (memberId, newStatus) => {
    const memberRef = ref(db, `members/${memberId}`);
    update(memberRef, { status: newStatus });
  };

  // 대원 추가
  const addMember = () => {
    if (!newName) return;
    const id = Date.now().toString();
    set(ref(db, `members/${id}`), {
      id: id,
      name: newName,
      unit: newUnit, // 선택된 부대 저장
      joinDate: newJoinDate,
      status: '미복귀'
    });
    setNewName('');
  };

  // 대원 삭제
  const deleteMember = (id) => {
    if(window.confirm("정말 삭제하시겠습니까?")) {
      remove(ref(db, `members/${id}`));
    }
  };

  // 퍼센트 계산 (18개월 기준)
  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((today - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  // 현재 탭의 인원 및 통계
  const currentMembers = members.filter(m => m.unit === activeTab);
  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => m.status === '미복귀' || !m.status).length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f1f3f5', paddingBottom: '40px' },
    header: { background: '#2d391e', padding: '20px', borderRadius: '0 0 25px 25px', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    inputGroup: { display: 'grid', gap: '8px', marginTop: '15px' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', position: 'relative' },
    statusBtn: (active, color) => ({ 
      flex: 1, padding: '14px 0', borderRadius: '12px', border: 'none', 
      background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', 
      fontWeight: 'bold', cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
    })
  };

  return (
    <div style={styles.container}>
      {/* 상단 입력부 (복구 완료) */}
      <div style={styles.header}>
        <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: '#e9ce63' }}>Katusa Tracker</h3>
        <div style={styles.inputGroup}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
              {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
            </select>
            <input type="date" style={{ flex: 1.5, padding: '10px', borderRadius: '10px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={{ flex: 3, padding: '10px', borderRadius: '10px', border: 'none' }} placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
            <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#2d391e' }} onClick={addMember}>인원 추가</button>
          </div>
        </div>
      </div>

      {/* 부대 선택 탭 */}
      <div style={{ display: 'flex', gap: '8px', padding: '15px 15px 5px', overflowX: 'auto' }}>
        {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
          <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={() => setActiveTab(u)}>{u}</button>
        ))}
      </div>

      {/* 실시간 인원 통계 */}
      <div style={styles.statsBar}>
        <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
        <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
        <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
        <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
      </div>

      {/* 대원 카드 리스트 (짬순 정렬) */}
      {currentMembers.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).map(m => (
        <div key={m.id} style={styles.card}>
          <button style={{ position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ddd', fontSize: '18px' }} onClick={() => deleteMember(m.id)}>✕</button>
          
          <div style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>
            {m.name} <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>{calculatePercent(m.joinDate)}%</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '18px', overflow: 'hidden' }}>
            <div style={{ width: `${calculatePercent(m.joinDate)}%`, height: '100%', background: '#73c088', transition: 'width 0.5s ease-in-out' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => handleStatusUpdate(m.id, '복귀')}>복귀</button>
            <button style={styles.statusBtn(m.status === '미복귀' || !m.status, '#e74c3c')} onClick={() => handleStatusUpdate(m.id, '미복귀')}>미복귀</button>
            <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => handleStatusUpdate(m.id, '잔류')}>잔류</button>
          </div>
        </div>
      ))}
    </div>
  );
}