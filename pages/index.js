import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { CATS, ITEMS, CEREMONY, PARENTS, MANAGERS, SEATING as DEFAULT_SEATING } from '../lib/data';

const STATUS_ORDER = ['todo', 'doing', 'done'];
const SIDE_LABEL = { groom: '新郎方', bride: '新娘方', both: '双方共同' };

function computeDaysLeft() {
  const target = new Date('2026-09-12T00:00:00+10:00');
  const now = new Date();
  return Math.ceil((target - now) / 86400000);
}

export default function Home() {
  const [screen, setScreen] = useState('home');
  const [currentCat, setCurrentCat] = useState(CATS[0]);
  const [currentOwner, setCurrentOwner] = useState('all');
  const [flowTab, setFlowTab] = useState('ceremony');
  const [currentUser, setCurrentUser] = useState('家人');
  const [statusStore, setStatusStore] = useState({}); // { cat: { itemId: {status, by, at} } }
  const [guests, setGuests] = useState([]);
  const [seating, setSeating] = useState(DEFAULT_SEATING);
  const [daysLeft, setDaysLeft] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const guestsRef = useRef(guests);
  const seatingRef = useRef(seating);
  const statusRef = useRef(statusStore);
  guestsRef.current = guests;
  seatingRef.current = seating;
  statusRef.current = statusStore;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };

  const loadAllStatus = async () => {
    const entries = await Promise.all(
      CATS.map(async (cat) => {
        try {
          const r = await fetch(`/api/status?cat=${encodeURIComponent(cat)}`);
          const j = await r.json();
          return [cat, j.data || {}];
        } catch {
          return [cat, statusRef.current[cat] || {}];
        }
      })
    );
    setStatusStore(Object.fromEntries(entries));
  };

  const loadGuests = async () => {
    try {
      const r = await fetch('/api/guests');
      const j = await r.json();
      setGuests(j.guests || []);
    } catch {
      /* keep current guests on failure */
    }
  };

  const loadSeating = async () => {
    try {
      const r = await fetch('/api/seating');
      const j = await r.json();
      setSeating(j.tables || DEFAULT_SEATING);
    } catch {
      /* keep current seating on failure */
    }
  };

  const saveSeating = async (tables) => {
    setSeating(tables);
    try {
      await fetch('/api/seating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables }),
      });
    } catch {
      showToast('同步失败，请检查网络');
    }
  };

  const addGuestToTable = (tableId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tables = seatingRef.current.map((t) =>
      t.id === tableId ? { ...t, guests: [...t.guests, trimmed] } : t
    );
    saveSeating(tables);
    showToast('已添加，已同步给全家');
  };

  const removeGuestFromTable = (tableId, idx) => {
    const tables = seatingRef.current.map((t) =>
      t.id === tableId ? { ...t, guests: t.guests.filter((_, i) => i !== idx) } : t
    );
    saveSeating(tables);
  };

  const moveGuestToTable = (fromTableId, idx, toTableId) => {
    if (fromTableId === toTableId) return;
    const from = seatingRef.current.find((t) => t.id === fromTableId);
    if (!from) return;
    const name = from.guests[idx];
    const tables = seatingRef.current.map((t) => {
      if (t.id === fromTableId) return { ...t, guests: t.guests.filter((_, i) => i !== idx) };
      if (t.id === toTableId) return { ...t, guests: [...t.guests, name] };
      return t;
    });
    saveSeating(tables);
    showToast(`已移到 ${seatingRef.current.find((t) => t.id === toTableId)?.label || ''}`);
  };

  const addTable = (label, capacity) => {
    const tables = [
      ...seatingRef.current,
      { id: 't' + Date.now(), label: label || `${seatingRef.current.length + 1}号桌`, capacity: capacity || '', guests: [] },
    ];
    saveSeating(tables);
  };

  useEffect(() => {
    setDaysLeft(computeDaysLeft());
    loadAllStatus();
    loadGuests();
    loadSeating();
    const cd = setInterval(() => setDaysLeft(computeDaysLeft()), 60000);
    const poll = setInterval(() => {
      loadAllStatus();
      loadGuests();
      loadSeating();
    }, 6000);
    return () => {
      clearInterval(cd);
      clearInterval(poll);
    };
  }, []);

  const effectiveStatus = (item) => statusStore[item.cat]?.[item.id]?.status || item.status;
  const effectiveBy = (item) => statusStore[item.cat]?.[item.id]?.by || null;

  const catStats = (cat) => {
    const list = ITEMS.filter((i) => i.cat === cat);
    const done = list.filter((i) => effectiveStatus(i) === 'done').length;
    return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  };
  const overall = useMemo(() => {
    const done = ITEMS.filter((i) => effectiveStatus(i) === 'done').length;
    return { total: ITEMS.length, done, pct: Math.round((done / ITEMS.length) * 100) };
  }, [statusStore]);

  const cycleStatus = async (item) => {
    const cur = effectiveStatus(item);
    const idx = STATUS_ORDER.indexOf(cur) === -1 ? 0 : STATUS_ORDER.indexOf(cur);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    const catMap = { ...(statusStore[item.cat] || {}) };
    catMap[item.id] = { status: next, by: currentUser || '家人', at: Date.now() };
    const updated = { ...statusStore, [item.cat]: catMap };
    setStatusStore(updated);
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cat: item.cat, data: catMap }),
      });
      if (next === 'done') showToast('已完成 ✓ 已同步给全家');
    } catch {
      showToast('同步失败，请检查网络');
    }
  };

  const addGuest = async (form) => {
    const name = form.name.trim();
    if (!name) {
      showToast('请填写姓名或家庭名称');
      return;
    }
    const next = [
      ...guestsRef.current,
      {
        id: 'g' + Date.now() + Math.floor(Math.random() * 1000),
        name,
        side: form.side,
        count: Math.max(1, parseInt(form.count) || 1),
        note: form.note.trim(),
        by: currentUser || '家人',
        at: Date.now(),
      },
    ];
    setGuests(next);
    try {
      await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: next }),
      });
      showToast('已添加，已同步给全家');
    } catch {
      showToast('同步失败，请检查网络');
    }
  };

  const deleteGuest = async (id) => {
    const next = guestsRef.current.filter((g) => g.id !== id);
    setGuests(next);
    try {
      await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: next }),
      });
    } catch {
      showToast('同步失败，请检查网络');
    }
  };

  const assignPendingToTable = async (guest, tableId) => {
    const parts = [];
    if (Number(guest.count) > 1) parts.push(`${guest.count}人`);
    if (guest.note) parts.push(guest.note);
    const chip = guest.name + (parts.length ? `（${parts.join('、')}）` : '');

    const tables = seatingRef.current.map((t) =>
      t.id === tableId ? { ...t, guests: [...t.guests, chip] } : t
    );
    await saveSeating(tables);
    await deleteGuest(guest.id);
    const table = tables.find((t) => t.id === tableId);
    showToast(`已把 ${guest.name} 分到 ${table ? table.label : ''}`);
  };

  const goScreen = (name) => {
    setScreen(name);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Head>
        <title>杨宇浩 & 王宁 · 婚礼筹备</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#F4EFE3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Noto+Serif+SC:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div id="app">
        <section className={`screen ${screen === 'home' ? 'active' : ''}`}>
          <HomeScreen
            overall={overall}
            catStats={catStats}
            guests={guests}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            daysLeft={daysLeft}
            goScreen={goScreen}
            setCurrentCat={setCurrentCat}
            setFlowTab={setFlowTab}
          />
        </section>

        <section className={`screen ${screen === 'checklist' ? 'active' : ''}`}>
          <ChecklistScreen
            currentCat={currentCat}
            setCurrentCat={setCurrentCat}
            currentOwner={currentOwner}
            setCurrentOwner={setCurrentOwner}
            catStats={catStats}
            effectiveStatus={effectiveStatus}
            effectiveBy={effectiveBy}
            cycleStatus={cycleStatus}
          />
        </section>

        <section className={`screen ${screen === 'flow' ? 'active' : ''}`}>
          <FlowScreen flowTab={flowTab} setFlowTab={setFlowTab} />
        </section>

        <section className={`screen ${screen === 'guests' ? 'active' : ''}`}>
          <GuestsScreen
            guests={guests}
            addGuest={addGuest}
            deleteGuest={deleteGuest}
            seating={seating}
            addGuestToTable={addGuestToTable}
            removeGuestFromTable={removeGuestFromTable}
            moveGuestToTable={moveGuestToTable}
            addTable={addTable}
            assignPendingToTable={assignPendingToTable}
          />
        </section>
      </div>

      <nav className="tabbar">
        <TabBtn active={screen === 'home'} onClick={() => goScreen('home')} label="首页">
          <path d="M4 11.5L12 4l8 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </TabBtn>
        <TabBtn active={screen === 'checklist'} onClick={() => goScreen('checklist')} label="筹备清单">
          <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </TabBtn>
        <TabBtn active={screen === 'flow'} onClick={() => goScreen('flow')} label="流程手册">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </TabBtn>
        <TabBtn active={screen === 'guests'} onClick={() => goScreen('guests')} label="宾客清单">
          <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 8.2a2.7 2.7 0 1 1 0 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15.2 14.3c2.4.4 4.3 2.2 4.3 4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </TabBtn>
      </nav>

      <div id="toast" className={toast ? 'show' : ''}>{toast}</div>
    </>
  );
}

function TabBtn({ active, onClick, label, children }) {
  return (
    <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none">{children}</svg>
      <span>{label}</span>
    </button>
  );
}

/* ============================= HOME ============================= */
function HomeScreen({ overall, catStats, guests, currentUser, setCurrentUser, daysLeft, goScreen, setCurrentCat, setFlowTab }) {
  const circumference = 213.6;
  const offset = circumference - (circumference * (overall.pct || 0)) / 100;
  const totalGuestPeople = guests.reduce((a, g) => a + Number(g.count || 0), 0);

  return (
    <>
      <div className="hero-wrap">
        <div className="hero-frame">
          <div className="hero-photo">
            <img src="/cover.jpg" alt="杨宇浩 & 王宁" />
            <div className="hero-quote">I love you</div>
          </div>
        </div>
      </div>

      <div className="names-block">
        <img src="/logo-mark.png" alt="杨宇浩 & 王宁" className="brand-logo" />
        <div className="lunar-line">农历 八月初二 · 周六 · 悉尼</div>
      </div>

      <div className="countdown">
        <div>
          <div className="cd-num">{daysLeft === null ? '--' : daysLeft > 0 ? daysLeft : daysLeft === 0 ? '0' : '已举行'}</div>
          <div className="cd-label">距离婚礼还有（天）</div>
        </div>
        <div className="cd-right">2026年9月12日<br />周六</div>
      </div>

      <div className="you-are">
        你是{' '}
        <input
          placeholder="家人"
          maxLength={8}
          defaultValue={currentUser === '家人' ? '' : currentUser}
          onBlur={(e) => setCurrentUser(e.target.value.trim() || '家人')}
        />{' '}
        · 打钩会记录是谁完成的
      </div>

      <div className="section-title">
        <h2>筹备进度</h2>
        <span className="more" onClick={() => goScreen('checklist')}>查看全部 ›</span>
      </div>
      <div className="progress-card">
        <div className="progress-top">
          <svg className="ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#EAE1CC" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="34" fill="none" stroke="url(#ringGrad)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              transform="rotate(-90 40 40)"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#AD8A4E" />
                <stop offset="100%" stopColor="#7C2430" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div className="progress-overall-num">{overall.pct || 0}%</div>
            <div className="progress-overall-sub">{overall.done} / {overall.total} 项已完成</div>
          </div>
        </div>
        <div className="progress-mini-list">
          {CATS.map((cat) => {
            const s = catStats(cat);
            return (
              <div className="mini-row" key={cat} onClick={() => { setCurrentCat(cat); goScreen('checklist'); }}>
                <div className="mini-row-top"><b>{cat}</b><span>{s.done}/{s.total}</span></div>
                <div className="mini-bar-bg"><div className="mini-bar-fill" style={{ width: `${s.pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-title"><h2>快捷入口</h2></div>
      <div className="quick-grid">
        <div className="quick-card" onClick={() => { goScreen('flow'); setFlowTab('ceremony'); }}>
          <svg className="qc-icon" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.2 4.6 5 .7-3.6 3.6.9 5.1-4.5-2.4-4.5 2.4.9-5.1L4.8 8.3l5-.7L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
          <div className="qc-title">仪式流程</div>
          <div className="qc-sub">当日环节时间轴</div>
        </div>
        <div className="quick-card" onClick={() => { goScreen('flow'); setFlowTab('parents'); }}>
          <svg className="qc-icon" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.5" /><circle cx="16" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 19c0-2.8 2-4.8 4.5-4.8s4.5 2 4.5 4.8M11.5 19c0-2.8 2-4.8 4.5-4.8s4.5 2 4.5 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <div className="qc-title">父母流程</div>
          <div className="qc-sub">当日双方父母安排</div>
        </div>
        <div className="quick-card" onClick={() => { goScreen('flow'); setFlowTab('managers'); }}>
          <svg className="qc-icon" viewBox="0 0 24 24" fill="none"><path d="M4 20V10l8-6 8 6v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" /></svg>
          <div className="qc-title">总管职责</div>
          <div className="qc-sub">岗位分工与时间</div>
        </div>
        <div className="quick-card" onClick={() => goScreen('guests')}>
          <svg className="qc-icon" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <div className="qc-title">宾客清单</div>
          <div className="qc-sub">{guests.length ? `待定 ${totalGuestPeople} 人` : '桌位安排 · 待定名单'}</div>
        </div>
      </div>

      <div className="home-foot">全家人共用一份清单 · 谁勾选了都会同步给大家<br />点击底部导航切换页面</div>
    </>
  );
}

/* ============================= CHECKLIST ============================= */
function ChecklistScreen({ currentCat, setCurrentCat, currentOwner, setCurrentOwner, catStats, effectiveStatus, effectiveBy, cycleStatus }) {
  const s = catStats(currentCat);
  const owners = useMemo(() => {
    const set = new Set();
    ITEMS.filter((i) => i.cat === currentCat).forEach((i) => i.owner && set.add(i.owner));
    return Array.from(set);
  }, [currentCat]);

  let list = ITEMS.filter((i) => i.cat === currentCat);
  if (currentOwner !== 'all') list = list.filter((i) => i.owner === currentOwner);
  const subs = [];
  list.forEach((i) => { if (!subs.includes(i.sub)) subs.push(i.sub); });

  return (
    <>
      <div className="topbar">
        <h1>筹备清单</h1>
        <div className="sub">当前查看：{currentCat}</div>
      </div>

      <div className="pill-row">
        {CATS.map((cat) => (
          <div key={cat} className={`pill ${cat === currentCat ? 'active' : ''}`} onClick={() => { setCurrentCat(cat); setCurrentOwner('all'); }}>
            {cat}
          </div>
        ))}
      </div>

      <div className="cat-progress">
        <div className="cat-progress-top"><span>当前分类完成度</span><b>{s.pct}%（{s.done}/{s.total}）</b></div>
        <div className="cat-bar-bg"><div className="cat-bar-fill" style={{ width: `${s.pct}%` }} /></div>
      </div>

      <div className="owner-scroll">
        <div className={`chip ${currentOwner === 'all' ? 'active' : ''}`} onClick={() => setCurrentOwner('all')}>全部负责人</div>
        {owners.map((o) => (
          <div key={o} className={`chip ${currentOwner === o ? 'active' : ''}`} onClick={() => setCurrentOwner(o)}>{o}</div>
        ))}
      </div>

      <div>
        {!list.length && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5L12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.4" /></svg>
            <div>这里空空如也</div>
          </div>
        )}
        {subs.map((sub) => (
          <div className="group-block" key={sub}>
            <div className="group-title">{sub}</div>
            {list.filter((i) => i.sub === sub).map((item) => (
              <ItemRow key={item.id} item={item} status={effectiveStatus(item)} by={effectiveBy(item)} onClick={() => cycleStatus(item)} />
            ))}
          </div>
        ))}
        <div style={{ height: 8 }} />
      </div>
    </>
  );
}

function ItemRow({ item, status, by, onClick }) {
  return (
    <div className={`item-row ${status === 'done' ? 'done' : ''} ${status === 'doing' ? 'doing' : ''}`} onClick={onClick}>
      <div className="check-box">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3.2L13 4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="item-main">
        <div className="item-name">{item.name}</div>
        <div className="item-meta">
          <span className={`tag pri-${item.priority}`}>{item.priority}</span>
          {item.deadline && <span className="tag deadline">{item.deadline}</span>}
          {item.owner && <span className="tag owner">{item.owner}</span>}
          {status === 'doing' && <span className="tag status-doing">进行中</span>}
          {status === 'pending' && <span className="tag status-pending">待确认</span>}
        </div>
        {item.note && <div className="item-note">💬 {item.note}</div>}
        {status === 'done' && by && <div className="by-line">✓ 由 {by} 完成</div>}
      </div>
    </div>
  );
}

/* ============================= FLOW ============================= */
function FlowScreen({ flowTab, setFlowTab }) {
  const groups = [];
  CEREMONY.forEach((c) => { if (!groups.includes(c.cat)) groups.push(c.cat); });
  const roles = [];
  PARENTS.forEach((p) => { if (!roles.includes(p.role)) roles.push(p.role); });

  return (
    <>
      <div className="topbar">
        <h1>流程手册</h1>
        <div className="sub">婚礼当天怎么走，一目了然</div>
      </div>

      <div className="flow-tabs">
        <div className={`flow-tab ${flowTab === 'ceremony' ? 'active' : ''}`} onClick={() => setFlowTab('ceremony')}>仪式流程</div>
        <div className={`flow-tab ${flowTab === 'parents' ? 'active' : ''}`} onClick={() => setFlowTab('parents')}>父母流程</div>
        <div className={`flow-tab ${flowTab === 'managers' ? 'active' : ''}`} onClick={() => setFlowTab('managers')}>总管职责</div>
      </div>

      <div className={`flow-panel ${flowTab === 'ceremony' ? 'active' : ''}`}>
        <div className="timeline">
          {groups.map((g) => (
            <div key={g}>
              <div className="tl-group-label">{g}</div>
              {CEREMONY.filter((c) => c.cat === g).map((c, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-name">{c.name}{c.dur && <span className="tl-dur">{c.dur}</span>}</div>
                  {c.desc && <div className="tl-desc">{c.desc}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`flow-panel ${flowTab === 'parents' ? 'active' : ''}`}>
        <div className="parent-cols">
          {roles.map((role) => (
            <div key={role}>
              <div className="parent-col-title">{role}</div>
              {PARENTS.filter((p) => p.role === role).map((s, idx) => (
                <div className="p-step" key={idx}>
                  <div className="p-step-num">{idx + 1}</div>
                  <div className="p-step-body">
                    <b>{s.step}</b><span className="p-step-time">{s.time}</span>
                    <div className="p-step-note">{s.note}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`flow-panel ${flowTab === 'managers' ? 'active' : ''}`}>
        {MANAGERS.map((m, i) => (
          <div className="mgr-card" key={i}>
            <div className="mgr-top"><span className="mgr-role">{m.role}</span><span className="mgr-num">建议 {m.num}</span></div>
            <div className="mgr-time">执行时间：{m.time}</div>
            <div className="mgr-duty">{m.duty}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================= GUESTS ============================= */
function GuestsScreen({ guests, addGuest, deleteGuest, seating, addGuestToTable, removeGuestFromTable, moveGuestToTable, addTable, assignPendingToTable }) {
  const [tab, setTab] = useState('seating');
  const [name, setName] = useState('');
  const [side, setSide] = useState('bride');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [newTableLabel, setNewTableLabel] = useState('');
  const [assignOpenId, setAssignOpenId] = useState(null);

  const totalPeople = guests.reduce((a, g) => a + Number(g.count || 0), 0);
  const seatingTotal = seating.reduce((a, t) => a + t.guests.length, 0);

  const submit = () => {
    addGuest({ name, side, count, note });
    setName(''); setNote(''); setCount(1);
  };

  const submitNewTable = () => {
    if (!newTableLabel.trim()) return;
    addTable(newTableLabel.trim(), '');
    setNewTableLabel('');
  };

  return (
    <>
      <div className="topbar">
        <h1>宾客清单</h1>
        <div className="sub">待定名单 + 桌位安排，全家实时同步</div>
      </div>

      <div className="flow-tabs">
        <div className={`flow-tab ${tab === 'seating' ? 'active' : ''}`} onClick={() => setTab('seating')}>桌位安排</div>
        <div className={`flow-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>待定名单</div>
      </div>

      {tab === 'list' && (
        <>
          <div className="guest-summary">
            <div className="gs-card"><div className="gs-num">{totalPeople}</div><div className="gs-label">待定人数</div></div>
            <div className="gs-card"><div className="gs-num">{guests.length}</div><div className="gs-label">待定条目</div></div>
          </div>

          <div className="guest-form">
            <div className="guest-form-title">+ 登记待定宾客</div>
            <div className="gf-row">
              <input placeholder="姓名 / 家庭名称" value={name} onChange={(e) => setName(e.target.value)} />
              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="groom">新郎方</option>
                <option value="bride">新娘方</option>
                <option value="both">双方共同</option>
              </select>
            </div>
            <div className="gf-row">
              <input type="number" min="1" placeholder="人数" value={count} onChange={(e) => setCount(e.target.value)} style={{ maxWidth: 90 }} />
              <input placeholder="备注（如：需要素食 / 带小孩）" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button className="gf-submit" onClick={submit}>加入待定名单</button>
          </div>

          <div className="guest-list">
            {!guests.length && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.4" /><path d="M5 20c0-3.8 3.1-6.4 7-6.4s7 2.6 7 6.4" stroke="currentColor" strokeWidth="1.4" /></svg>
                <div>暂无待定宾客 —— 桌位还没定的人，先登记在这里</div>
              </div>
            )}
            {guests.slice().reverse().map((g) => (
              <div className="guest-row" key={g.id}>
                <div className={`guest-side ${g.side}`} />
                <div className="guest-info">
                  <div className="guest-name">{g.name}</div>
                  <div className="guest-tags">{SIDE_LABEL[g.side] || ''} · {g.count} 人{g.by ? ` · ${g.by} 添加` : ''}</div>
                  {g.note && <div className="guest-note">{g.note}</div>}
                </div>
                <div className="guest-row-actions">
                  <div className="guest-chip-wrap">
                    <button className="guest-assign" onClick={() => setAssignOpenId(assignOpenId === g.id ? null : g.id)}>分桌位</button>
                    {assignOpenId === g.id && (
                      <div className="move-menu">
                        <div className="move-menu-title">分到：</div>
                        {seating.map((t) => (
                          <div
                            key={t.id}
                            className="move-menu-item"
                            onClick={() => { assignPendingToTable(g, t.id); setAssignOpenId(null); }}
                          >
                            {t.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="guest-del" onClick={() => deleteGuest(g.id)}>
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'seating' && (
        <>
          <div className="guest-summary">
            <div className="gs-card"><div className="gs-num">{seating.length}</div><div className="gs-label">桌数</div></div>
            <div className="gs-card"><div className="gs-num">{seatingTotal}</div><div className="gs-label">已排座位</div></div>
          </div>
          <div className="seating-list">
            {seating.map((t) => (
              <TableCard
                key={t.id}
                table={t}
                allTables={seating}
                onAddGuest={(name) => addGuestToTable(t.id, name)}
                onRemoveGuest={(idx) => removeGuestFromTable(t.id, idx)}
                onMoveGuest={(idx, toId) => moveGuestToTable(t.id, idx, toId)}
              />
            ))}
          </div>
          <div className="add-table-form">
            <input
              placeholder="新增一桌，比如「6号桌」"
              value={newTableLabel}
              onChange={(e) => setNewTableLabel(e.target.value)}
            />
            <button onClick={submitNewTable}>+ 新增</button>
          </div>
        </>
      )}
    </>
  );
}

function TableCard({ table, allTables, onAddGuest, onRemoveGuest, onMoveGuest }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [newName, setNewName] = useState('');

  const submit = () => {
    onAddGuest(newName);
    setNewName('');
  };

  return (
    <div className="table-card">
      <div className="table-card-top">
        <span className="table-name">{table.label}</span>
        <span className="table-cap">{table.capacity ? `${table.capacity} · ` : ''}{table.guests.length} 人</span>
      </div>
      <div className="table-guests">
        {table.guests.map((g, i) => (
          <div className="guest-chip-wrap" key={i}>
            <span className="guest-chip editable" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              {g}
              <button className="chip-del" onClick={(e) => { e.stopPropagation(); onRemoveGuest(i); }}>×</button>
            </span>
            {openIdx === i && (
              <div className="move-menu">
                <div className="move-menu-title">移到：</div>
                {allTables.filter((t) => t.id !== table.id).map((t) => (
                  <div
                    key={t.id}
                    className="move-menu-item"
                    onClick={() => { onMoveGuest(i, t.id); setOpenIdx(null); }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="table-add-row">
        <input
          placeholder="+ 加一位到这桌"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button onClick={submit}>添加</button>
      </div>
    </div>
  );
}
