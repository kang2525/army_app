import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('전체');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가', start: '', end: '' });

  useEffect(() => {
    localStorage.setItem('katusa-members', JSON.stringify(members));
    localStorage.setItem('katusa-vacations', JSON.stringify(vacations));
  }, [members, vacations]);

  const deleteMember = (id, e) => {
    e.stopPropagation();
    if (window.confirm("이 대원을 목록에서 삭제하시겠습니까?")) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const calculatePercent = (joinDate) => {
    if (!joinDate) return "0.0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    if (today < start) return "0.0";
    if (today > end) return "100.0";
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const servedDays = (today - start) / (1000 * 60 * 60 * 24);
    return ((servedDays / totalDays) * 100).toFixed(1);
  };

  const addMember = () => {
    if (!newName) return;
    setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, returned: false }]);
    setNewName('');
    setNewJoinDate(new Date().toISOString().split('T')[0]);
  };

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
      <div style={{ background: '#e74c3c', color: 'white', fontSize: '10px', padding: '2px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold' }}>
        {dayVacations.length === 1 ? dayVacations[0].name : `${dayVacations[0].name} 외 ${dayVacations.length - 1}`}
      </div>
    );
  };

  const filteredMembers = activeTab === '전체' ? members : members.filter(m => m.unit === activeTab);

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", -apple-system, sans-serif' },
    nav: { display: 'flex', background: '#1a2e05', padding: '5px 10px' },
    navBtn: (isActive) => ({ flex: 1, padding: '15px', border: 'none', background: 'none', color: isActive ? '#e9ce63' : '#888', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderBottom: isActive ? '3px solid #e9ce63' : 'none' }),
    header: { background: '#1a2e05', padding: '40px 25px', borderRadius: '0 0 40px 40px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },
    titleArea: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '25px' },
    title: { margin: 0, color: 'white', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' },
    inputArea: { background: 'rgba(255,255,255,0.08)', padding: '20px', borderRadius: '25px', backdropFilter: 'blur(5px)' },
    input: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '15px', marginBottom: '10px', boxSizing: 'border-box', background: 'white' },
    regBtn: { width: '100%', background: '#e9ce63', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', color: '#1a2e05', fontSize: '16px', cursor: 'pointer' },
    filterBar: { display: 'flex', gap: '10px', padding: '25px 20px', overflowX: 'auto' },
    filterBtn: (isActive) => ({ padding: '10px 20px', borderRadius: '15px', border: 'none', background: isActive ? '#1a2e05' : 'white', color: isActive ? '#e9ce63' : '#555', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', cursor: 'pointer' }),
    memberCard: { background: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', textAlign: 'center', position: 'relative', marginBottom: '15px' },
    unitBadge: { fontSize: '11px', fontWeight: 'bold', background: '#fdf3d0', color: '#b28900', padding: '4px 10px', borderRadius: '8px', marginBottom: '10px', display: 'inline-block' },
    nameText: { fontSize: '22px', fontWeight: '800', color: '#1a1a1a', marginBottom: '20px' },
    percentText: { fontWeight: '400', color: '#888', fontSize: '18px', marginLeft: '6px' },
    returnBtn: (isReturned) => ({ width: '100%', padding: '15px 0', borderRadius: '15px', border: 'none', background: isReturned ? '#e74c3c' : '#f0f2f5', color: isReturned ? 'white' : '#888', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s' })
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
            <div style={styles.titleArea}>
              <h2 style={styles.title}>지원대대 지원대</h2>
            </div>
            
            <div style={styles.inputArea}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{...styles.input, flex: 1}} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
                </select>
                <input type="date" style={{...styles.input, flex: 1}} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
              </div>
              <input style={styles.input} placeholder="대원 이름을 입력하세요" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={styles.regBtn} onClick={addMember}>대원 등록</button>
            </div>
          </div>

          <div style={styles.filterBar}>
            {['전체', 'HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={styles.filterBtn(activeTab === u)} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={{ padding: '0 20px 40px' }}>
            {filteredMembers.map(m => (
              <div key={m.id} style={styles.memberCard}>
                <button style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', color: '#ddd', fontSize: '20px', cursor: 'pointer' }} onClick={(e) => deleteMember(m.id, e)}>✕</button>
                <span style={styles.unitBadge}>{m.unit}</span>
                <div style={styles.nameText}>
                  {m.name} <span style={styles.percentText}>{calculatePercent(m.joinDate)}%</span>
                </div>
                <button 
                  style={styles.returnBtn(m.returned)} 
                  onClick={() => setMembers(members.map(x => x.id === m.id ? {...x, returned: !x.returned} : x))}
                >
                  {m.returned ? '✅ 복귀 완료' : '미복귀'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '30px', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={handleDateClick} tileContent={tileContent} formatDay={(locale, date) => date.getDate()} value={selectedDate} />
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '30px', marginTop: '20px', boxShadow: '0 -5px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a2e05' }}>🚩 {selectedDate.toLocaleDateString()}</h3>
              <button style={{ background: '#1a2e05', color: '#e9ce63', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold' }} onClick={() => setShowModal(true)}>+ 휴가작성</button>
            </div>
            {getVacationersByDate(selectedDate).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #eee' }}>
                <span><strong>{v.name}</strong> <small style={{color:'#e74c3c', marginLeft: '5px'}}>{v.type}</small></span>
                <button style={{ border: 'none', background: 'none', color: '#ccc', fontSize: '18px' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '85%', maxWidth: '380px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>휴가 일정 추가</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input style={styles.input} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
              <input style={styles.input} placeholder="휴가 종류" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
              <div style={{ display: 'flex', gap: '5px' }}>
                <input type="date" style={styles.input} value={vacationInput.start} onChange={e => setVacationInput({...vacationInput, start: e.target.value})} />
                <input type="date" style={styles.input} value={vacationInput.end} onChange={e => setVacationInput({...vacationInput, end: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#eee' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#1a2e05', color: 'white' }} onClick={() => {
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
      `}</style>
    </div>
  );
}