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

  // 24시간 초기화 로직
  useEffect(() => {
    const now = Date.now();
    if (now - lastResetTimestamp > 86400000) {
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

  const calculatePercent = (joinDate) => {
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const total = (end - start);
    const served = (today - start);
    return Math.min(100, Math.max(0, (served / total) * 100)).toFixed(1);
  };

  const getStats = (unit) => {
    const list = members.filter(m => m.unit === unit);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  };

  // 날짜 클릭 핸들러 (입력창 자동 연동)
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const formatted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setVacationInput({ ...vacationInput, start: formatted, end: formatted });
    setShowModal(true); // 날짜 누르면 바로 입력창 띄우기
  };

  const getVacationersByDate = (date) => {
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return vacations.filter(v => d >= v.start && d <= v.end);
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const count = getVacationersByDate(date).length;
    return count > 0 ? <div style={{ background: '#e74c3c', color: 'white', fontSize: '10px', borderRadius: '4px', marginTop: '4px' }}>{count}명</div> : null;
  };

  const stats = getStats(activeTab);

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif' },
    header: { background: 'linear-gradient(to bottom, #2d391e, #1a230e)', padding: '20px 20px 40px 20px', borderRadius: '0 0 40px 40px', textAlign: 'center' },
    nav: { display: 'flex', justifyContent: 'space-around', marginBottom: '20px' },
    navBtn: (isActive) => ({ background: 'none', border: 'none', padding: '10px', color: isActive ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', fontSize: '18px', borderBottom: isActive ? '3px solid #e9ce63' : 'none' }),
    inputCard: { background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '25px' },
    input: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', marginBottom: '10px', boxSizing: 'border-box' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '-20px 20px 20px', padding: '20px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '25px 20px', borderRadius: '30px', margin: '0 20px 15px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', textAlign: 'center', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '15px 0', borderRadius: '15px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '16px' })
  };

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
            <button style={{...styles.input, background:'#e9ce63', fontWeight:'bold', marginBottom:0}} onClick={() => { if(newName){ setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]); setNewName(''); } }}>대원 추가</button>
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
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>총원</span><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>복귀</span><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>미복귀</span><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>잔류</span><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {members.filter(m => m.unit === activeTab).map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{position:'absolute', top:'20px', right:'20px', border:'none', background:'none', color:'#eee', fontSize:'20px'}} onClick={() => setMembers(members.filter(x => x.id !== m.id))}>✕</button>
              <div style={{fontSize: '21px', fontWeight: '800', marginBottom: '15px'}}>{m.name} <span style={{fontSize: '14px', color: '#bbb'}}>{calculatePercent(m.joinDate)}%</span></div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => setMembers(members.map(x => x.id === m.id ? {...x, status: x.status === '복귀' ? '미복귀' : '복귀'} : x))}>복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => setMembers(members.map(x => x.id === m.id ? {...x, status: x.status === '잔류' ? '미복귀' : '잔류'} : x))}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '30px', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={handleDateClick} tileContent={tileContent} value={selectedDate} formatDay={(l, d) => d.getDate()} />
          </div>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '30px', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', color: '#25311b' }}>🚩 {selectedDate.toLocaleDateString()} 휴가 인원</h3>
            {getVacationersByDate(selectedDate).length === 0 ? (
              <p style={{color: '#ccc', textAlign: 'center', fontSize: '14px'}}>날짜를 눌러 휴가자를 등록하세요</p>
            ) : (
              getVacationersByDate(selectedDate).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
                  <span><strong>{v.name}</strong> <small style={{color:'#e74c3c'}}>{v.type}</small></span>
                  <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '85%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#25311b' }}>{selectedDate.toLocaleDateString()} 휴가 등록</h3>
            <input style={{...styles.input, background:'#f1f3f5'}} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={{...styles.input, background:'#f1f3f5'}} placeholder="휴가 종류 (연가, 청원 등)" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#eee' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#25311b', color: 'white', fontWeight: 'bold' }} onClick={() => {
                if(vacationInput.name){ setVacations([...vacations, { ...vacationInput, id: Date.now() }]); setShowModal(false); setVacationInput({ name: '', type: '연가', start: '', end: '' }); }
              }}>등록</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; }
        .react-calendar__tile--active { background: #25311b !important; border-radius: 12px !important; color: #e9ce63 !important; }
        .react-calendar__tile--now { background: #fdf3d0 !important; border-radius: 12px !important; }
      `}</style>
    </div>
  );
}