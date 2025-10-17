(function(){
  const $ = (s,ctx=document)=>ctx.querySelector(s);
  const canvas = $('#bg');
  const ctx = canvas.getContext('2d');
  let W=canvas.width=window.innerWidth, H=canvas.height=window.innerHeight;
  function onResize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  window.addEventListener('resize', onResize);

  // Soft sparkles background
  const sparks=[]; const colors=['#ffd166','#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff'];
  function addSpark(x,y){
    const n=24+Math.floor(Math.random()*16);
    for(let i=0;i<n;i++){
      const a = (Math.PI*2)*i/n + Math.random()*0.2;
      const s = 0.6+Math.random()*1.8;
      sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:60+Math.random()*60,color:colors[(Math.random()*colors.length)|0]});
    }
  }
  function tick(){
    ctx.fillStyle='rgba(10,6,30,0.2)'; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(let i=sparks.length-1;i>=0;i--){
      const p=sparks[i]; p.x+=p.vx; p.y+=p.vy; p.vx*=0.995; p.vy*=0.995; p.life-=1;
      if(p.life<=0){ sparks.splice(i,1); continue; }
      const a=Math.max(0,Math.min(1,p.life/80));
      ctx.beginPath(); ctx.fillStyle=hex(p.color,a); ctx.arc(p.x,p.y,1.8,0,Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    requestAnimationFrame(tick);
  }
  function hex(h,a){ const n=parseInt(h.slice(1),16); const r=n>>16&255,g=n>>8&255,b=n&255; return `rgba(${r},${g},${b},${a})`; }
  // idle bursts
  setInterval(()=>addSpark(Math.random()*W, H*0.25 + Math.random()*H*0.5), 1200);
  tick();

  // Name state and URL handling
  const nameSpan = $('#nameSpan');
  const overlay = $('#overlay');
  const nameInput = $('#nameInput');
  const toast = $('#toast');

  function showToast(msg){
    toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1600);
  }

  const params = new URLSearchParams(location.search);
  const initial = params.get('to') || '';
  let currentName = initial || 'Friend';
  updateName(currentName);

  function updateName(n){
    currentName = n && n.trim()? n.trim(): 'Friend';
    nameSpan.textContent = currentName;
  }

  function openDialog(){
    nameInput.value = currentName === 'Friend' ? '' : currentName;
    overlay.hidden = false; nameInput.focus();
  }
  function closeDialog(){ overlay.hidden = true; overlay.style.display = 'none'; setTimeout(()=>{ overlay.style.display = ''; }, 0); }

  // Buttons and dialog
  $('#cancelDlg').addEventListener('click', closeDialog);
  $('#saveDlg').addEventListener('click', saveName);
  nameInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); saveName(); } });

  function saveName(){
    updateName(nameInput.value);
    const url = new URL(location.href);
    if(currentName && currentName!=='Friend') url.searchParams.set('to', currentName);
    else url.searchParams.delete('to');
    history.replaceState(null,'', url.toString());
    addSpark(window.innerWidth*0.5, window.innerHeight*0.35);
    closeDialog();
    showToast('Saved');
  }

  // 3-dot menu (shown on hover via CSS); attach actions only
  document.getElementById('menuEdit').addEventListener('click', openDialog);
  document.getElementById('menuShare').addEventListener('click', doShare);
  document.getElementById('menuGame').addEventListener('click', openGame);
  document.getElementById('menuReset').addEventListener('click', resetGame);

  function resetGame() {
    localStorage.removeItem('diwali-game-completed');
    showToast('Game reset! Refresh to play again.');
  }

  // Share
  async function doShare(){
    const url = new URL(location.href);
    if(currentName && currentName!=='Friend') url.searchParams.set('to', currentName);
    else url.searchParams.delete('to');
    const text = `Happy Diwali, ${currentName}! ✨`;
    addSpark(window.innerWidth*0.5, window.innerHeight*0.35);
    if(navigator.share){
      try{ await navigator.share({title:'Happy Diwali', text, url: url.toString()}); showToast('Shared!'); }
      catch{}
    }else{
      try{ await navigator.clipboard.writeText(`${text} \n${url.toString()}`); showToast('Link copied'); }
      catch{ showToast('Copy failed'); }
    }
  }

  // Game (Scatter 7 diyas - drag lit flame to ignite others)
  const gameOverlay = document.getElementById('gameOverlay');
  const scatterEl = document.getElementById('scatter');
  const mainDiya = document.querySelector('.diya');
  const gameBgOverlay = document.getElementById('gameBgOverlay');

  const TOTAL = 7;
  let nodes = [];

  function updateLitCount(){
    const lit = nodes.filter(n=>n.lit).length;
    
    // Update background brightness based on lit diyas
    gameBgOverlay.className = 'game-bg-overlay lit-' + lit;
    
    if(lit === TOTAL) {
      // Mark game as completed and start smooth reveal transition
      localStorage.setItem('diwali-game-completed', 'true');
      startRevealTransition();
    }
  }

  function randomPositions(){
    const res=[];
    // Responsive diya size calculation
    const baseSize = Math.min(Math.max(80, window.innerWidth * 0.18), 110);
    const w = baseSize, h = baseSize;
    const minDist = baseSize * 1.5;
    const screenW = window.innerWidth, screenH = window.innerHeight;
    const margin = Math.min(100, screenW * 0.1); // Responsive margin
    let tries=0;
    
    // Always place first diya in center
    const centerX = (screenW - w) / 2;
    const centerY = (screenH - h) / 2;
    res.push({x: centerX, y: centerY, cx: centerX + w/2, cy: centerY + h/2});
    
    while(res.length<TOTAL && tries<3000){
      tries++;
      const x = margin + Math.random()*(screenW - w - margin*2);
      const y = margin + Math.random()*(screenH - h - margin*2);
      const cx = x + w/2, cy = y + h/2;
      let ok=true;
      for(const p of res){ const dx=p.cx-cx, dy=p.cy-cy; if(Math.hypot(dx,dy) < minDist){ ok=false; break; } }
      if(ok) res.push({x,y,cx,cy});
    }
    return res;
  }

  function nodeHTML(){
    return `<div class=\"bowl\"></div><div class=\"flame\"></div>`;
  }

  function makeGame(){
    scatterEl.innerHTML=''; nodes=[];
    const pos = randomPositions();
    // Fallback random positions if generator failed
    while(pos.length<TOTAL){
      pos.push({x:Math.random()*(screenW-w), y:Math.random()*(screenH-h)});
    }
    // Always light the center diya first (index 0)
    const litIndex = 0;
    for(let i=0;i<TOTAL;i++){
      const el = document.createElement('div');
      let className = 'node';
      if(i === litIndex) className += ' lit';
      if(i === 0) className += ' hero'; // Center diya is the hero
      el.className = className;
      el.innerHTML = nodeHTML();
      el.style.left = `${pos[i].x}px`; el.style.top = `${pos[i].y}px`;
      scatterEl.appendChild(el);
      nodes.push({el, lit: i===litIndex});
    }
    enableDragging();
    updateLitCount();
  }

  function enableDragging(){
    let dragging=null; let offsetX=0, offsetY=0; let bounds=null;
    function ptrDown(e){
      const el = e.currentTarget;
      const n = nodes.find(n=>n.el===el);
      if(!n || !n.lit) return;
      const r = el.getBoundingClientRect();
      bounds = {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
      offsetX = e.clientX - r.left; offsetY = e.clientY - r.top;
      dragging = n; 
      el.classList.add('dragging');
      el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }
    function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
    function flameTip(el){ const f=el.querySelector('.flame'); const fr=f.getBoundingClientRect(); return {x: fr.left + fr.width/2, y: fr.top + 4}; }
    function bowlTopCenter(el){ const br=el.getBoundingClientRect(); return {x: br.left + br.width/2, y: br.top + br.height*0.55}; }
    function maybeIgnite(tip){
      for(const n of nodes){
        if(n.lit) continue;
        const c = bowlTopCenter(n.el);
        const touchRadius = Math.min(Math.max(25, window.innerWidth * 0.06), 40);
        if(Math.hypot(c.x - tip.x, c.y - tip.y) < touchRadius){
          n.lit = true; n.el.classList.add('lit');
          // Add spark effect when diya lights up
          addSpark(c.x, c.y);
          updateLitCount();
        }
      }
    }
    function ptrMove(e){
      if(!dragging) return;
      const el = dragging.el;
      const x = clamp(e.clientX - offsetX - bounds.left, 0, bounds.width - el.offsetWidth);
      const y = clamp(e.clientY - offsetY - bounds.top, 0, bounds.height - el.offsetHeight);
      el.style.left = `${x}px`; el.style.top = `${y}px`;
      const tip = flameTip(el);
      maybeIgnite(tip);
    }
    function ptrUp(e){ 
      if(dragging) dragging.el.classList.remove('dragging');
      dragging=null; 
    }

    // Attach handlers to all nodes (drag only works when lit)
    for(const n of nodes){
      n.el.addEventListener('pointerdown', ptrDown);
    }
    scatterEl.addEventListener('pointermove', ptrMove);
    window.addEventListener('pointerup', ptrUp);
  }

  function openGame(){ 
    gameOverlay.hidden = false; 
    // Reset background overlay to darkest state
    gameBgOverlay.className = 'game-bg-overlay lit-1';
    makeGame(); 
  }
  function startRevealTransition() {
    // Simply close game and show wish immediately
    setTimeout(() => {
      closeGame();
    }, 500); // Brief pause to see completion
  }

  function closeGame(){ 
    gameOverlay.hidden = true; 
    // Show main card after game is closed with smooth transition
    const card = document.querySelector('.card');
    setTimeout(() => {
      card.classList.remove('hidden');
    }, 100);
  }

  // Auto-start game on page load
  function startGameFirst(){
    // Hide the main wish card initially
    document.querySelector('.card').classList.add('hidden');
    // Show game overlay
    setTimeout(() => openGame(), 200);
  }

  // Check if game was already completed or if this is a shared link
  const hasNameParam = new URLSearchParams(location.search).has('to');
  const gameCompleted = localStorage.getItem('diwali-game-completed');
  
  // If this is a shared link or game was completed before, show wish directly
  if (hasNameParam || gameCompleted) {
    document.querySelector('.card').classList.remove('hidden');
  } else {
    // Otherwise start with game
    window.addEventListener('load', startGameFirst);
  }

  mainDiya.addEventListener('click', openGame);
})();
