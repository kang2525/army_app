import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  const [lastResetTimestamp, setLastResetTimestamp] = useState(() => localStorage.getItem('last-reset-time') || Date.now());
  
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('HHC');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가', start: '', end: '' });

  // 24시간 주기 초기화 로직
  useEffect(() => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - lastResetTimestamp > twentyFourHours) {
      const resetMembers = members.map(m => ({ ...m, status: '미복귀' }));
      setMembers(resetMembers);
      setLastResetTimestamp(now);
      localStorage.setItem('katusa-members', JSON.stringify(resetMembers));
      localStorage.setItem('last-reset-time', now.toString());
    }
  }, [lastResetTimestamp, members]);

  useEffect(() => {
    localStorage.setItem('katusa-members', JSON.stringify(members));
    localStorage.setItem('katusa-vacations', JSON.stringify(vacations));
  }, [members, vacations]);

  const getStats = (unit) => {
    const list = members.filter(m => m.unit === unit);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  };

  const calculatePercent = (joinDate) => {
    if (!joinDate) return "0.0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const servedDays = (today - start) / (1000 * 60 * 60 * 24);
    return Math.min(100, Math.max(0, (servedDays / totalDays) * 100)).toFixed(1);
  };

  const addMember = () => {
    if (!newName) return;
    setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]);
    setNewName('');
  };

  const updateStatus = (id, currentStatus, targetStatus) => {
    const nextStatus = currentStatus === targetStatus ? '미복귀' : targetStatus;
    setMembers(members.map(m => m.id === id ? { ...m, status: nextStatus } : m));
  };

  // --- 휴가 관련 로직 ---
  const getVacationersByDate = (date) => {
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return vacations.filter(v => d >= v.start && d <= v.end);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setVacationInput({ ...vacationInput, start: d, end: d });
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dayVacations = getVacationersByDate(date);
    if (dayVacations.length === 0) return null;
    return (
      <div style={{ background: '#e74c3c', color: 'white', fontSize: '9px', padding: '1px', borderRadius: '3px', marginTop: '2px' }}>
        {dayVacations.length}명
      </div>
    );
  };

  const stats = getStats(activeTab);

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif' },
    nav: { display: 'flex', background: '#1a2e05', padding: '5px 10px' },
    navBtn: (isActive) => ({ flex: 1, padding: '15px', border: 'none', background: 'none', color: isActive ? '#e9ce63' : '#888', fontWeight: 'bold', borderBottom: isActive ? '3px solid #e9ce63' : 'none' }),
    header: { background: '#1a2e05', padding: '30px 20px', borderRadius: '0 0 30px 30px', textAlign: 'center', color: 'white' },
    inputArea: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '20px', marginTop: '15px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', marginBottom: '8px', boxSizing: 'border-box' },
    card: { background: 'white', padding: '20px', borderRadius: '25px', margin: '0 20px 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '14px 0', borderRadius: '12px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '15px' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.nav}>
        <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
        <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
      </div>

      {view === 'main' ? (
        <div>
          <div style={styles.header}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>🎖️ 지원대대 지원대</h2>
            <div style={styles.inputArea}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{...styles.input, flex: 1}} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
                </select>
                <input type="date" style={{...styles.input, flex: 1.5}} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
              </div>
              <input style={styles.input} placeholder="대원 성함 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{...styles.input, background: '#e9ce63', color: '#1a2e05', fontWeight: 'bold', marginBottom: 0}} onClick={addMember}>대원 추가</button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '0 20px 20px', overflowX: 'auto' }}>
              {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
                <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#1a2e05' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold' }} onClick={() => setActiveTab(u)}>{u}</button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', margin: '0 20px 20px', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{textAlign:'center'}}><span style={{fontSize:'11px', color:'#888'}}>총원</span><br/><b>{stats.total}</b></div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'11px', color:'#888'}}>복귀</span><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'11px', color:'#888'}}>미복귀</span><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'11px', color:'#888'}}>잔류</span><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
            </div>

            {members.filter(m => m.unit === activeTab).map(m => (
              <div key={m.id} style={styles.card}>
                <button style={{position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ddd'}} onClick={() => { if(window.confirm("삭제하시겠습니까?")) setMembers(members.filter(x => x.id !== m.id)) }}>✕</button>
                <div style={styles.nameTag}>{m.name} <span style={styles.percent}>{calculatePercent(m.joinDate)}%</span></div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, m.status, '복귀')}>복귀</button>
                  <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, m.status, '잔류')}>잔류</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '25px', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={handleDateClick} tileContent={tileContent} value={selectedDate} formatDay={(locale, date) => date.getDate()} />
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '25px', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>🚩 {selectedDate.toLocaleDateString()}</h3>
              <button style={{ background: '#1a2e05', color: '#e9ce63', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' }} onClick={() => setShowModal(true)}>+ 휴가 추가</button>
            </div>
            {getVacationersByDate(selectedDate).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '12px', borderRadius: '12px', marginBottom: '8px' }}>
                <span><strong>{v.name}</strong> <small style={{color:'#e74c3c'}}>{v.type}</small></span>
                <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '25px', width: '85%', maxWidth: '350px' }}>
            <h3 style={{ marginTop: 0 }}>휴가 일정 등록</h3>
            <input style={styles.input} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={styles.input} placeholder="휴가 종류 (연가, 외출 등)" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="date" style={styles.input} value={vacationInput.start} onChange={e => setVacationInput({...vacationInput, start: e.target.value})} />
              <input type="date" style={styles.input} value={vacationInput.end} onChange={e => setVacationInput({...vacationInput, end: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#eee' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#1a2e05', color: 'white' }} onClick={() => {
                if(!vacationInput.name || !vacationInput.start || !vacationInput.end) return;
                setVacations([...vacations, { ...vacationInput, id: Date.now() }]);
                setShowModal(false);
              }}>등록</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; font-family: inherit !important; }
        .react-calendar__tile--active { background: #1a2e05 !important; border-radius: 8px !important; }
        .react-calendar__tile--now { background: #fdf3d0 !important; border-radius: 8px !important; color: #1a2e05 !important; }
        .react-calendar__navigation button:enabled:hover { background-color: #f8f9fa; }
      `}</style>
    </div>
  );
}