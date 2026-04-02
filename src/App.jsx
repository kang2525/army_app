import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

// Firebase 로직 제거 (주석 처리)
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, onValue, set, update } from "firebase/database";

export default function App() {
  // localStorage 복구
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  const [lastResetDate, setLastResetDate] = useState(() => localStorage.getItem('last-reset-date') || '');
  
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false); // + 버튼 누를 때만 true
  const [activeTab, setActiveTab] = useState('HHC');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가' });

  // 24시간 리셋 로직 (localStorage 기반 유지)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (lastResetDate && lastResetDate !== today) {
      setMembers(members.map(m => ({ ...m, status: '미복귀' })));
    }
    setLastResetDate(today);
    localStorage.setItem('last-reset-date', today);
  }, []);

  useEffect(() => {
    localStorage.setItem('katusa-members', JSON.stringify(members));
    localStorage.setItem('katusa-vacations', JSON.stringify(vacations));
  }, [members, vacations]);

  // 대원 관리 로직
  const addMember = () => {
    if (!newName) return;
    setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]);
    setNewName('');
  };

  const updateStatus = (id, currentStatus, targetStatus) => {
    const nextStatus = currentStatus === targetStatus ? '미복귀' : targetStatus;
    setMembers(members.map(m => m.id === id ? { ...m, status: nextStatus } : m));
  };

  const deleteMember = (id) => {
    if (window.confirm("삭제하시겠습니까?")) setMembers(members.filter(m => m.id !== id));
  };

  // --- 휴가 관련 로직 (개선) ---
  const getVacationersByDate = (date) => {
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return vacations.filter(v => d >= v.start && d <= v.end);
  };

  // 날짜 클릭 시: 명단만 확인 (팝업 안 띄움)
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // [+] 버튼 클릭 시: 팝업 띄우고 날짜 자동 설정
  const handleAddBtnClick = () => {
    const formatted = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setVacationInput({ ...vacationInput, start: formatted, end: formatted });
    setShowModal(true);
  };

  const addVacation = () => {
    if (!vacationInput.name || !vacationInput.start || !vacationInput.end) return;
    setVacations([...vacations, { ...vacationInput, id: Date.now() }]);
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
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif' },
    header: { background: 'linear-gradient(to bottom, #2d391e, #1a230e)', padding: '20px 20px 40px 20px', borderRadius: '0 0 40px 40px', textAlign: 'center' },
    nav: { display: 'flex', justifyContent: 'space-around', marginBottom: '20px' },
    navBtn: (active) => ({ background: 'none', border: 'none', padding: '10px', color: active ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', fontSize: '18px', borderBottom: active ? '3px solid #e9ce63' : 'none' }),
    inputCard: { background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '25px' },
    input: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', marginBottom: '10px', boxSizing: 'border-box' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '-20px 20px 20px', padding: '20px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '25px 20px', borderRadius: '30px', margin: '0 20px 15px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', textAlign: 'center', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '15px 0', borderRadius: '15px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '16px' }),
    // 사진 속 팝업 디자인
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' },
    modalContent: { background: 'white', padding: '40px 30px', borderRadius: '35px', width: '85%', maxWidth: '380px', textAlign: 'center' },
    modalTitle: { margin: '0 0 30px 0', fontSize: '20px', fontWeight: '700', color: '#333' },
    modalInput: { width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: '#f1f3f5', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' },
    modalBtnGroup: { display: 'flex', gap: '10px', marginTop: '15px' },
    modalBtnCancel: { flex: 1, padding: '16px', borderRadius: '15px', border: 'none', background: '#eee', color: '#555', fontWeight: 'bold', fontSize: '16px' },
    modalBtnSubmit: { flex: 1, padding: '16px', borderRadius: '15px', border: 'none', background: '#25311b', color: 'white', fontWeight: 'bold', fontSize: '16px' }
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
              <select style={styles.input} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
              </select>
              <input type="date" style={styles.input} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <input style={styles.input} placeholder="대원 성함" value={newName} onChange={e => setNewName(e.target.value)} />
            <button style={{...styles.input, background:'#e9ce63', fontWeight:'bold', marginBottom:0}} onClick={addMember}>대원 추가</button>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '10px 20px', borderRadius: '15px', border: 'none', background: activeTab === u ? '#25311b' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>총원</span><br/><b>{currentStats.total}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>복귀</span><br/><b style={{color:'#2ecc71'}}>{currentStats.returned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>미복귀</span><br/><b style={{color:'#e74c3c'}}>{currentStats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>잔류</span><br/><b style={{color:'#3498db'}}>{currentStats.stay}</b></div>
          </div>

          {members.filter(m => m.unit === activeTab).map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{position:'absolute', top:'20px', right:'20px', border:'none', background:'none', color:'#eee', fontSize:'20px'}} onClick={() => deleteMember(m.id)}>✕</button>
              <div style={{fontSize: '21px', fontWeight: '800', marginBottom: '15px'}}>{m.name} <span style={{fontSize: '14px', color: '#bbb'}}>{calculatePercent(m.joinDate)}%</span></div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, m.status, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, m.status, '잔류')}>잔류</button>
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
            {/* 제목 옆 [+] 버튼 추가 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight:'800', color: '#25311b' }}>🚩 {selectedDate.toLocaleDateString()} 휴가 인원</h3>
                <button style={{ background: '#25311b', color: '#e9ce63', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontSize: '20px', fontWeight: 'bold' }} onClick={handleAddBtnClick}>+</button>
            </div>
            {getVacationersByDate(selectedDate).length === 0 ? (
                <p style={{textAlign:'center', color:'#ccc', fontSize:'14px', margin:'20px 0'}}>[+] 버튼을 눌러 휴가자를 등록하세요</p>
            ) : (
                getVacationersByDate(selectedDate).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
                    <span><strong>{v.name}</strong> <small style={{color:'#e74c3c', marginLeft:'5px'}}>{v.type}</small></span>
                    <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
                </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 사진 속 깔끔한 팝업 디자인 복구 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{selectedDate.toLocaleDateString()} 휴가 등록</h3>
            <input style={styles.modalInput} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={styles.modalInput} placeholder="휴가 종류 (연가, 청원 등)" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            <div style={styles.modalBtnGroup}>
              <button style={styles.modalBtnCancel} onClick={() => setShowModal(false)}>취소</button>
              <button style={styles.modalBtnSubmit} onClick={addVacation}>등록</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; }
        .react-calendar__tile--active { background: #25311b !important; border-radius: 12px !important; color: #e9ce63 !important; }
        .react-calendar__tile--now { background: #fdf3d0 !important; border-radius: 12px !important; }
        .react-calendar__navigation button { font-weight: bold; font-size: 16px; }
      `}</style>
    </div>
  );
}