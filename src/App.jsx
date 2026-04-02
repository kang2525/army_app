import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

// Firebase 설정 (본인의 설정값으로 교체 필수)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
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
  
  // 휴가 입력 상태 (시작일, 종료일 포함)
  const [vacationInput, setVacationInput] = useState({ 
    name: '', 
    type: '연가', 
    start: '', 
    end: '' 
  });

  useEffect(() => {
    onValue(ref(db, 'members'), (s) => setMembers(s.val() ? Object.values(s.val()) : []));
    onValue(ref(db, 'vacations'), (s) => setVacations(s.val() ? Object.values(s.val()) : []));
  }, []);

  const handleDateClick = (date) => {
    const formatted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setSelectedDate(date);
    setVacationInput({ ...vacationInput, start: formatted, end: formatted });
    setShowModal(true);
  };

  const addVacation = () => {
    if (!vacationInput.name || !vacationInput.start || !vacationInput.end) return;
    const id = Date.now();
    set(ref(db, `vacations/${id}`), { ...vacationInput, id });
    setShowModal(false);
    setVacationInput({ name: '', type: '연가', start: '', end: '' });
  };

  const calculatePercent = (joinDate) => {
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    return Math.min(100, Math.max(0, ((today - start) / (end - start)) * 100)).toFixed(1);
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif', color: '#333' },
    header: { background: 'linear-gradient(135deg, #2d391e 0%, #1a230e 100%)', padding: '30px 20px 50px', borderRadius: '0 0 40px 40px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' },
    nav: { display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px' },
    navBtn: (active) => ({ background: 'none', border: 'none', color: active ? '#e9ce63' : 'rgba(255,255,255,0.4)', fontWeight: '800', fontSize: '18px', paddingBottom: '5px', borderBottom: active ? '3px solid #e9ce63' : 'none' }),
    inputCard: { background: 'rgba(255,255,255,0.08)', padding: '20px', borderRadius: '25px', backdropFilter: 'blur(10px)' },
    input: { width: '100%', padding: '14px', borderRadius: '15px', border: 'none', marginBottom: '10px', fontSize: '15px', outline: 'none' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '-25px 20px 20px', padding: '20px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '25px 20px', borderRadius: '30px', margin: '0 20px 15px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', textAlign: 'center', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '16px 0', borderRadius: '16px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: '800', fontSize: '15px' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }
  };

  const currentStats = (() => {
    const list = members.filter(m => m.unit === activeTab);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  })();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.nav}>
          <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
        {view === 'main' && (
          <div style={styles.inputCard}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{...styles.input, flex: 1}} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
              </select>
              <input type="date" style={{...styles.input, flex: 1.5}} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <input style={styles.input} placeholder="대원 성함 입력" value={newName} onChange={e => setNewName(e.target.value)} />
            <button style={{...styles.input, background: '#e9ce63', color: '#1a2e05', fontWeight: '800', marginBottom: 0}} onClick={() => { if(newName){ set(ref(db, `members/${Date.now()}`), { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }); setNewName(''); } }}>대원 추가</button>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '10px 22px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#25311b' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>총원</span><br/><b style={{fontSize:'18px'}}>{currentStats.total}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>복귀</span><br/><b style={{color:'#2ecc71', fontSize:'18px'}}>{currentStats.returned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>미복귀</span><br/><b style={{color:'#e74c3c', fontSize:'18px'}}>{currentStats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>잔류</span><br/><b style={{color:'#3498db', fontSize:'18px'}}>{currentStats.stay}</b></div>
          </div>

          {members.filter(m => m.unit === activeTab).map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{position:'absolute', top:'20px', right:'20px', border:'none', background:'none', color:'#eee', fontSize:'22px'}} onClick={() => { if(window.confirm("삭제할까요?")) set(ref(db, `members/${m.id}`), null); }}>✕</button>
              <div style={{fontSize: '22px', fontWeight: '800', marginBottom: '18px'}}>{m.name} <span style={{fontSize: '14px', color: '#bbb', fontWeight: '400'}}>{calculatePercent(m.joinDate)}%</span></div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => update(ref(db, `members/${m.id}`), { status: m.status === '복귀' ? '미복귀' : '복귀' })}>복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => update(ref(db, `members/${m.id}`), { status: m.status === '잔류' ? '미복귀' : '잔류' })}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '30px', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={handleDateClick} value={selectedDate} formatDay={(l, d) => d.getDate()} 
              tileContent={({date}) => {
                const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const count = vacations.filter(v => d >= v.start && d <= v.end).length;
                return count > 0 ? <div style={{ background: '#e74c3c', color: 'white', fontSize: '10px', borderRadius: '4px', marginTop: '4px' }}>{count}명</div> : null;
              }}
            />
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '30px', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', fontWeight:'800' }}>🚩 {selectedDate.toLocaleDateString()} 휴가 인원</h3>
            {vacations.filter(v => {
              const d = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              return d >= v.start && d <= v.end;
            }).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
                <span><strong>{v.name}</strong> <small style={{color:'#e74c3c', marginLeft:'5px'}}>{v.type}</small></span>
                <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => set(ref(db, `vacations/${v.id}`), null)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '35px', width: '85%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', fontWeight:'800' }}>📅 휴가 기간 설정</h3>
            
            <label style={{fontSize:'12px', color:'#888', marginLeft:'5px'}}>이름</label>
            <input style={{...styles.input, background:'#f1f3f5'}} placeholder="성함" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            
            <label style={{fontSize:'12px', color:'#888', marginLeft:'5px'}}>휴가 종류</label>
            <input style={{...styles.input, background:'#f1f3f5'}} placeholder="연가, 외출, 청원 등" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <div style={{flex:1}}>
                <label style={{fontSize:'12px', color:'#888', marginLeft:'5px'}}>시작일</label>
                <input type="date" style={{...styles.input, background:'#f1f3f5', marginBottom:0}} value={vacationInput.start} onChange={e => setVacationInput({...vacationInput, start: e.target.value})} />
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:'12px', color:'#888', marginLeft:'5px'}}>종료일</label>
                <input type="date" style={{...styles.input, background:'#f1f3f5', marginBottom:0}} value={vacationInput.end} onChange={e => setVacationInput({...vacationInput, end: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, padding: '16px', borderRadius: '15px', border: 'none', background: '#eee', fontWeight: 'bold' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '16px', borderRadius: '15px', border: 'none', background: '#25311b', color: '#e9ce63', fontWeight: 'bold' }} onClick={addVacation}>등록하기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; font-family: inherit !important; }
        .react-calendar__tile--active { background: #25311b !important; border-radius: 12px !important; color: #e9ce63 !important; }
        .react-calendar__tile--now { background: #fdf3d0 !important; border-radius: 12px !important; color: #25311b !important; }
        .react-calendar__navigation button { font-weight: 800; font-size: 16px; }
      `}</style>
    </div>
  );
}