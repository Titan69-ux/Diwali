(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const canvas = document.getElementById('fireworks');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

  // Particles for fireworks
  const particles = [];
  const colors = ['#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff','#ffd166'];
  function rnd(min, max){ return Math.random()*(max-min)+min; }
  function Firework(x, y){
    const count = Math.floor(rnd(36, 72));
    for(let i=0;i<count;i++){
      const angle = (Math.PI*2)*i/count + rnd(-0.05,0.05);
      const speed = rnd(1.5, 4.2);
      particles.push({
        x, y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        life: rnd(40, 80),
        color: colors[(Math.random()*colors.length)|0],
        size: rnd(1.3, 2.6)
      });
    }
  }
  function loop(){
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(10,6,30,0.25)';
    ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation = 'lighter';

    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; // gravity
      p.vx *= 0.995; p.vy *= 0.995; // drag
      p.life -= 1;
      if(p.life <= 0){ particles.splice(i,1); continue; }
      const alpha = Math.max(0, Math.min(1, p.life/60));
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  function hexToRgba(hex, a){
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
  loop();

  // Burst some fireworks on load
  function randomBursts(n=3){
    for(let i=0;i<n;i++){
      setTimeout(()=>{
        Firework(rnd(w*0.2,w*0.8), rnd(h*0.2,h*0.6));
      }, i*300 + rnd(0,200));
    }
  }
  randomBursts(6);

  // UI wiring
  const nameInput = $('#name');
  const lightBtn = $('#lightBtn');
  const sparkleBtn = $('#sparkleBtn');
  const shareBtn = $('#shareBtn');
  const wishText = $('#wishText');
  const toast = $('#toast');

  const params = new URLSearchParams(location.search);
  const nameParam = params.get('to');
  if(nameParam){ nameInput.value = decodeURIComponent(nameParam); }

  function updateWish(){
    const name = nameInput.value.trim();
    wishText.textContent = name
      ? `Happy Diwali, ${name}! May your year glow with health, happiness, and sweet surprises!`
      : `Wishing you a bright and joyous Diwali!`;
  }
  updateWish();
  nameInput.addEventListener('input', updateWish);

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 1800);
  }

  lightBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('lit');
    randomBursts(5);
    showToast(document.body.classList.contains('lit') ? 'The diyas are glowing ✨' : 'Diyas dimmed');
  });

  sparkleBtn.addEventListener('click', ()=>{
    for(let i=0;i<4;i++) Firework(rnd(w*0.15,w*0.85), rnd(h*0.15,h*0.75));
  });

  shareBtn.addEventListener('click', async ()=>{
    const name = nameInput.value.trim();
    const shareUrl = new URL(location.href);
    if(name) shareUrl.searchParams.set('to', encodeURIComponent(name)); else shareUrl.searchParams.delete('to');
    const text = name ? `Happy Diwali, ${name}! ✨🎆` : 'Happy Diwali! ✨🎆';

    if(navigator.share){
      try{
        await navigator.share({ title: 'Happy Diwali', text, url: shareUrl.toString() });
        showToast('Shared!');
      }catch{}
    }else{
      try{
        await navigator.clipboard.writeText(`${text} \n${shareUrl.toString()}`);
        showToast('Link copied to clipboard');
      }catch{
        showToast('Copy failed — select URL manually');
      }
    }
  });

  // Click to add a firework burst
  canvas.addEventListener('pointerdown', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (w/rect.width);
    const y = (e.clientY - rect.top) * (h/rect.height);
    for(let i=0;i<2;i++) Firework(x + rnd(-10,10), y + rnd(-10,10));
  });
})();
