import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import {
  CATS,
  ITEMS as DEFAULT_ITEMS,
  CEREMONY as DEFAULT_CEREMONY,
  PARENTS as DEFAULT_PARENTS,
  MANAGERS as DEFAULT_MANAGERS,
  SEATING as DEFAULT_SEATING,
} from '../lib/data';

const STATUS_ORDER = ['todo', 'doing', 'done'];
const SIDE_LABEL = { groom: '新郎方', bride: '新娘方', both: '双方共同' };
const DEFAULT_FLOW = { ceremony: DEFAULT_CEREMONY, parents: DEFAULT_PARENTS, managers: DEFAULT_MANAGERS };

function computeDaysLeft() {
  const target = new Date('2026-09-12T00:00:00+10:00');
  const now = new Date();
  return Math.ceil((target - now) / 86400000);
}

// Groups a list the way the original spreadsheet did: a group label is only
// written on the FIRST row of its section, every row after it (cat/role is
// null) belongs to that same running section — not to a global "all rows
// that happen to share this exact label" bucket. This keeps e.g. 开场...退场
// together as one 仪式环节 section instead of splitting across the sheet.
function groupSequential(list, labelKey) {
  const groups = [];
  let current = null;
  list.forEach((item) => {
    const label = item[labelKey] || (current ? current.label : null);
    if (!current || current.label !== label) {
      current = { label, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  });
  return groups;
}

export default function Home() {
  const [screen, setScreen] = useState('home');
  const [currentCat, setCurrentCat] = useState(CATS[0]);
  const [currentOwner, setCurrentOwner] = useState('all');
  const [flowTab, setFlowTab] = useState('ceremony');
  const [currentUser, setCurrentUser] = useState('家人');
  const [statusStore, setStatusStore] = useState({}); // { cat: { itemId: {status, by, at} } }
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [flow, setFlow] = useState(DEFAULT_FLOW); // { ceremony, parents, managers }
  const [guests, setGuests] = useState([]);
  const [seating, setSeating] = useState(DEFAULT_SEATING);
  const [daysLeft, setDaysLeft] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const guestsRef = useRef(guests);
  const seatingRef = useRef(seating);
  const statusRef = useRef(statusStore);
  const itemsRef = useRef(items);
  const flowRef = useRef(flow);
  guestsRef.current = guests;
  seatingRef.current = seating;
  statusRef.current = statusStore;
  itemsRef.current = items;
  flowRef.current = flow;

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

  const loadItems = async () => {
    try {
      const r = await fetch('/api/items');
      const j = await r.json();
      setItems(j.items || DEFAULT_ITEMS);
    } catch {
      /* keep current items on failure */
    }
  };

  const loadFlow = async () => {
    try {
      const r = await fetch('/api/flow');
      const j = await r.json();
      setFlow(j.flow || DEFAULT_FLOW);
    } catch {
      /* keep current flow on failure */
    }
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

  const removeTable = (tableId) => {
    const table = seatingRef.current.find((t) => t.id === tableId);
    const tables = seatingRef.current.filter((t) => t.id !== tableId);
    saveSeating(tables);
    showToast(`已删除${table ? ' ' + table.label : ''}`);
  };

  const saveItems = async (next) => {
    setItems(next);
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next }),
      });
    } catch {
      showToast('同步失败，请检查网络');
    }
  };

  const addItem = (cat, form) => {
    const name = form.name.trim();
    if (!name) {
      showToast('请填写事项名称');
      return;
    }
    const newItem = {
      id: 'c' + Date.now() + Math.floor(Math.random() * 1000),
      cat,
      sub: form.sub.trim() || '其他',
      name,
      deadline: form.deadline.trim(),
      priority: form.priority || '必要',
      owner: form.owner.trim(),
      status: 'todo',
      note: form.note.trim(),
    };
    saveItems([...itemsRef.current, newItem]);
    showToast('已添加，已同步给全家');
  };

  const deleteItem = (itemId) => {
    saveItems(itemsRef.current.filter((i) => i.id !== itemId));
    showToast('已删除');
  };

  const saveFlow = async (next) => {
    setFlow(next);
    try {
      await fetch('/api/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: next }),
      });
    } catch {
      showToast('同步失败，请检查网络');
    }
  };

  const addFlowEntry = (section, entry) => {
    const withId = { ...entry, id: 'f' + Date.now() + Math.floor(Math.random() * 1000) };
    const next = { ...flowRef.current, [section]: [...flowRef.current[section], withId] };
    saveFlow(next);
    showToast('已添加，已同步给全家');
  };

  const deleteFlowEntry = (section, id) => {
    const next = { ...flowRef.current, [section]: flowRef.current[section].filter((e) => e.id !== id) };
    saveFlow(next);
    showToast('已删除');
  };

  useEffect(() => {
    setDaysLeft(computeDaysLeft());
    loadAllStatus();
    loadItems();
    loadFlow();
    loadGuests();
    loadSeating();
    const cd = setInterval(() => setDaysLeft(computeDaysLeft()), 60000);
    const poll = setInterval(() => {
      loadAllStatus();
      loadItems();
      loadFlow();
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
    const list = items.filter((i) => i.cat === cat);
    const done = list.filter((i) => effectiveStatus(i) === 'done').length;
    return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  };
  const overall = useMemo(() => {
    const done = items.filter((i) => effectiveStatus(i) === 'done').length;
    return { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }, [statusStore, items]);

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
            items={items}
            currentCat={currentCat}
            setCurrentCat={setCurrentCat}
            currentOwner={currentOwner}
            setCurrentOwner={setCurrentOwner}
            catStats={catStats}
            effectiveStatus={effectiveStatus}
            effectiveBy={effectiveBy}
            cycleStatus={cycleStatus}
            addItem={addItem}
            deleteItem={deleteItem}
          />
        </section>

        <section className={`screen ${screen === 'flow' ? 'active' : ''}`}>
          <FlowScreen
            flowTab={flowTab}
            setFlowTab={setFlowTab}
            flow={flow}
            addFlowEntry={addFlowEntry}
            deleteFlowEntry={deleteFlowEntry}
          />
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
            removeTable={removeTable}
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
        <div className="lunar-line">农历 八月初二 · 周六 · 济南</div>
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
function ChecklistScreen({ items, currentCat, setCurrentCat, currentOwner, setCurrentOwner, catStats, effectiveStatus, effectiveBy, cycleStatus, addItem, deleteItem }) {
  const s = catStats(currentCat);
  const owners = useMemo(() => {
    const set = new Set();
    items.filter((i) => i.cat === currentCat).forEach((i) => i.owner && set.add(i.owner));
    return Array.from(set);
  }, [items, currentCat]);

  let list = items.filter((i) => i.cat === currentCat);
  if (currentOwner !== 'all') list = list.filter((i) => i.owner === currentOwner);
  const subs = [];
  list.forEach((i) => { if (!subs.includes(i.sub)) subs.push(i.sub); });
  const allSubs = useMemo(() => {
    const set = new Set();
    items.filter((i) => i.cat === currentCat).forEach((i) => i.sub && set.add(i.sub));
    return Array.from(set);
  }, [items, currentCat]);

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
              <ItemRow key={item.id} item={item} status={effectiveStatus(item)} by={effectiveBy(item)} onClick={() => cycleStatus(item)} onDelete={() => deleteItem(item.id)} />
            ))}
          </div>
        ))}
        <div className="group-block">
          <AddItemPanel cat={currentCat} subs={allSubs} onAdd={(form) => addItem(currentCat, form)} />
        </div>
        <div style={{ height: 8 }} />
      </div>
    </>
  );
}

function ItemRow({ item, status, by, onClick, onDelete }) {
  return (
    <div className={`item-row ${status === 'done' ? 'done' : ''} ${status === 'doing' ? 'doing' : ''}`} onClick={onClick}>
      <div className="check-box">
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3.2L13 4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="item-main">
        <div className="item-top-row">
          <div className="item-name">{item.name}</div>
          <button className="row-del" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="删除">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
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

function AddItemPanel({ cat, subs, onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [sub, setSub] = useState('');
  const [owner, setOwner] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('必要');
  const [note, setNote] = useState('');

  const reset = () => { setName(''); setSub(''); setOwner(''); setDeadline(''); setPriority('必要'); setNote(''); };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name, sub, owner, deadline, priority, note });
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="add-entry-row" onClick={() => setOpen(true)}>
        <span>+ 添加事项（{cat}）</span>
      </div>
    );
  }

  return (
    <div className="add-entry-form">
      <div className="gf-row">
        <input placeholder="事项名称" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="gf-row">
        <input placeholder="分组（如：新郎，可自定义）" list="checklist-subs" value={sub} onChange={(e) => setSub(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="必要">必要</option>
          <option value="重要">重要</option>
          <option value="非必要">非必要</option>
        </select>
      </div>
      <datalist id="checklist-subs">
        {subs.map((s) => <option key={s} value={s} />)}
      </datalist>
      <div className="gf-row">
        <input placeholder="负责人（选填）" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <input placeholder="截止时间（选填）" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <div className="gf-row">
        <input placeholder="备注（选填）" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="gf-row gf-row-actions">
        <button className="gf-cancel" onClick={() => { reset(); setOpen(false); }}>取消</button>
        <button className="gf-submit" onClick={submit}>添加</button>
      </div>
    </div>
  );
}

/* ============================= FLOW ============================= */
function FlowScreen({ flowTab, setFlowTab, flow, addFlowEntry, deleteFlowEntry }) {
  const { ceremony, parents, managers } = flow;
  const ceremonyGroups = useMemo(() => groupSequential(ceremony, 'cat'), [ceremony]);
  const parentGroups = useMemo(() => groupSequential(parents, 'role'), [parents]);
  const ceremonyLabels = useMemo(() => Array.from(new Set(ceremony.map((c) => c.cat).filter(Boolean))), [ceremony]);
  const parentRoles = useMemo(() => Array.from(new Set(parents.map((p) => p.role).filter(Boolean))), [parents]);

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
          {ceremonyGroups.map((g, gi) => (
            <div key={gi}>
              {g.label && <div className="tl-group-label">{g.label}</div>}
              {g.items.map((c) => (
                <div className="tl-item" key={c.id}>
                  <button className="row-del tl-del" onClick={() => deleteFlowEntry('ceremony', c.id)} aria-label="删除">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                  <div className="tl-name">{c.name}{c.dur && <span className="tl-dur">{c.dur}</span>}</div>
                  {c.desc && <div className="tl-desc">{c.desc}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <AddCeremonyForm groups={ceremonyLabels} onAdd={(entry) => addFlowEntry('ceremony', entry)} />
      </div>

      <div className={`flow-panel ${flowTab === 'parents' ? 'active' : ''}`}>
        <div className="parent-cols">
          {parentGroups.map((g, gi) => (
            <div key={gi}>
              {g.label && <div className="parent-col-title">{g.label}</div>}
              {g.items.map((s, idx) => (
                <div className="p-step" key={s.id}>
                  <div className="p-step-num">{idx + 1}</div>
                  <div className="p-step-body">
                    <div className="p-step-top">
                      <div><b>{s.step}</b><span className="p-step-time">{s.time}</span></div>
                      <button className="row-del" onClick={() => deleteFlowEntry('parents', s.id)} aria-label="删除">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                    {s.note && <div className="p-step-note">{s.note}</div>}
                  </div>
                </div>
              ))}
              <AddParentStepForm role={g.label} onAdd={(entry) => addFlowEntry('parents', entry)} />
            </div>
          ))}
          {!parentRoles.length && <AddParentStepForm role="" onAdd={(entry) => addFlowEntry('parents', entry)} />}
        </div>
      </div>

      <div className={`flow-panel ${flowTab === 'managers' ? 'active' : ''}`}>
        {managers.map((m) => (
          <div className="mgr-card" key={m.id}>
            <div className="mgr-top">
              <span className="mgr-role">{m.role}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mgr-num">建议 {m.num}</span>
                <button className="row-del" onClick={() => deleteFlowEntry('managers', m.id)} aria-label="删除">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
            <div className="mgr-time">执行时间：{m.time}</div>
            <div className="mgr-duty">{m.duty}</div>
          </div>
        ))}
        <AddManagerForm onAdd={(entry) => addFlowEntry('managers', entry)} />
      </div>
    </>
  );
}

function AddCeremonyForm({ groups, onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [dur, setDur] = useState('');
  const [cat, setCat] = useState('');
  const [desc, setDesc] = useState('');

  const reset = () => { setName(''); setDur(''); setCat(''); setDesc(''); };
  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), dur: dur.trim(), cat: cat.trim() || null, desc: desc.trim() });
    reset();
    setOpen(false);
  };

  if (!open) return <div className="add-entry-row" onClick={() => setOpen(true)}><span>+ 添加环节</span></div>;

  return (
    <div className="add-entry-form">
      <div className="gf-row"><input placeholder="环节名称，如：起床" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
      <div className="gf-row">
        <input placeholder="时间，如：7:00 或 20分钟" value={dur} onChange={(e) => setDur(e.target.value)} />
        <input placeholder="分组（选填，不填则接在上一条后面）" list="ceremony-groups" value={cat} onChange={(e) => setCat(e.target.value)} />
      </div>
      <datalist id="ceremony-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
      <div className="gf-row"><input placeholder="说明（选填）" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      <div className="gf-row gf-row-actions">
        <button className="gf-cancel" onClick={() => { reset(); setOpen(false); }}>取消</button>
        <button className="gf-submit" onClick={submit}>添加</button>
      </div>
    </div>
  );
}

function AddParentStepForm({ role, onAdd }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const reset = () => { setStep(''); setTime(''); setNote(''); };
  const submit = () => {
    if (!step.trim()) return;
    onAdd({ role: role || null, step: step.trim(), time: time.trim(), note: note.trim() });
    reset();
    setOpen(false);
  };

  if (!open) return <div className="add-entry-row" onClick={() => setOpen(true)}><span>+ 添加步骤{role ? `（${role}）` : ''}</span></div>;

  return (
    <div className="add-entry-form">
      <div className="gf-row">
        <input placeholder="步骤，如：起床" value={step} onChange={(e) => setStep(e.target.value)} autoFocus />
        <input placeholder="时间，如：7:00" value={time} onChange={(e) => setTime(e.target.value)} style={{ maxWidth: 100 }} />
      </div>
      <div className="gf-row"><input placeholder="备注（选填）" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <div className="gf-row gf-row-actions">
        <button className="gf-cancel" onClick={() => { reset(); setOpen(false); }}>取消</button>
        <button className="gf-submit" onClick={submit}>添加</button>
      </div>
    </div>
  );
}

function AddManagerForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [num, setNum] = useState('');
  const [time, setTime] = useState('');
  const [duty, setDuty] = useState('');

  const reset = () => { setRole(''); setNum(''); setTime(''); setDuty(''); };
  const submit = () => {
    if (!role.trim()) return;
    onAdd({ role: role.trim(), num: num.trim(), time: time.trim(), duty: duty.trim() });
    reset();
    setOpen(false);
  };

  if (!open) return <div className="add-entry-row" onClick={() => setOpen(true)}><span>+ 添加岗位</span></div>;

  return (
    <div className="add-entry-form">
      <div className="gf-row">
        <input placeholder="岗位名称，如：摄影统筹" value={role} onChange={(e) => setRole(e.target.value)} autoFocus />
        <input placeholder="建议人数" value={num} onChange={(e) => setNum(e.target.value)} style={{ maxWidth: 90 }} />
      </div>
      <div className="gf-row"><input placeholder="执行时间" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <div className="gf-row"><input placeholder="核心职责" value={duty} onChange={(e) => setDuty(e.target.value)} /></div>
      <div className="gf-row gf-row-actions">
        <button className="gf-cancel" onClick={() => { reset(); setOpen(false); }}>取消</button>
        <button className="gf-submit" onClick={submit}>添加</button>
      </div>
    </div>
  );
}

/* ============================= GUESTS ============================= */
function GuestsScreen({ guests, addGuest, deleteGuest, seating, addGuestToTable, removeGuestFromTable, moveGuestToTable, addTable, removeTable, assignPendingToTable }) {
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
                onRemoveTable={() => removeTable(t.id)}
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

function TableCard({ table, allTables, onAddGuest, onRemoveGuest, onMoveGuest, onRemoveTable }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="table-cap">{table.capacity ? `${table.capacity} · ` : ''}{table.guests.length} 人</span>
          <button className="row-del" onClick={onRemoveTable} aria-label="删除整桌">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
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
