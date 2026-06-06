(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();let g=20,u="stats";const m=["top","jungle","mid","bot","support"],b={top:"Top",jungle:"Jungle",mid:"Mid",bot:"Bot",support:"Support",flex:"Flex"},$={top:"🛡️",jungle:"🌿",mid:"⚡",bot:"🏹",support:"💙",flex:"🔀"},S={IRON:"#6a6a6a",BRONZE:"#a05000",SILVER:"#6a7f9a",GOLD:"#e5a330",PLATINUM:"#00b4b4",EMERALD:"#00c080",DIAMOND:"#576bce",MASTER:"#9d4dc6",GRANDMASTER:"#e84057",CHALLENGER:"#f4c874"},O={1:"I",2:"II",3:"III",4:"IV"},E={na1:"na",euw1:"euw",eune1:"eune",kr:"kr",br1:"br",la1:"lan",la2:"las",oc1:"oce",tr1:"tr",ru:"ru",jp1:"jp"};function w(e){return`https://www.op.gg/summoners/${E[e.region]??e.region.toLowerCase()}/${encodeURIComponent(e.gameName)}-${e.tagLine}`}function I(e){const t=O[e.division]??"";return`${e.tier.charAt(0)+e.tier.slice(1).toLowerCase()}${t?` ${t}`:""}`}function k(e){const t=e.wins+e.losses;return t?`${Math.round(e.wins/t*100)}%`:"0%"}function v(e){return e>=7?"#f4c874":e>=6?"#00c080":e>=5?"#4a9eff":e>=4?"#e5a330":"#e84057"}function M(e){const t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t}m ago`;const o=Math.floor(t/60);return o<24?`${o}h ago`:`${Math.floor(o/24)}d ago`}function y(e){const t={};for(const r of e)!r.position||r.opScore==null||(t[r.position]||(t[r.position]=[]),t[r.position].push(r.opScore));const o={};for(const[r,n]of Object.entries(t)){const s=n.reduce((a,l)=>a+l,0)/n.length;o[r]={avgOpScore:Math.round(s*100)/100,games:n.length}}return o}function R(e){if(e.opScore==null)return"";const t=e.result==="WIN",o=e.result==="WIN"?"win":e.result==="LOSE"?"loss":"",r=v(e.opScore),n=e.champion??"?",s=e.createdAt?new Date(e.createdAt).toLocaleDateString(void 0,{month:"short",day:"numeric"}):"";return`
    <div class="game-row ${o}">
      <span class="game-result-dot" title="${e.result??""}">${t?"▲":"▼"}</span>
      <span class="game-champion">${n}</span>
      <span class="game-score" style="color:${r}">${e.opScore.toFixed(2)}</span>
      <span class="game-date">${s}</span>
    </div>`}function N(e,t,o){const r=e.rank?S[e.rank.tier]??"#888":"#555",n=v(o.avgOpScore),s=e.rank?`<div class="rank" style="color:${r}">
         ${I(e.rank)}<span class="lp">${e.rank.lp} LP</span>
       </div>
       <div class="winrate">${k(e.rank)} WR · ${e.rank.wins}W ${e.rank.losses}L</div>`:'<div class="rank unranked">Unranked</div>',a=e.recentGames.slice(0,g).filter(c=>c.position===t),l=a.length?`<div class="games-list">${a.map(R).join("")}</div>`:"",i=`${e.gameName}-${e.tagLine}-${t}`.replace(/[^a-zA-Z0-9-]/g,"_");return`
    <div class="card" id="card-${i}">
      <div class="card-header">
        <a class="player-name" href="${w(e)}" target="_blank" rel="noopener">
          ${e.gameName}<span class="tag">#${e.tagLine}</span>
        </a>
        <button class="toggle-btn" data-card="${i}" title="Show games">
          <span class="toggle-icon">▾</span>
        </button>
      </div>

      <div class="op-score" style="color:${n}">
        ${o.avgOpScore.toFixed(2)}
        <span class="op-label">OP Score</span>
      </div>
      <span class="sample-size">${o.games} game${o.games!==1?"s":""} as ${b[t]}</span>

      ${s}
      ${l}
    </div>`}function C(e,t){const o=[...t].sort((r,n)=>n.score.avgOpScore-r.score.avgOpScore);return`
    <div class="column">
      <div class="column-header">
        <span class="role-icon">${$[e]}</span>
        ${b[e]}
        <span class="player-count">${t.length}</span>
      </div>
      ${o.length?o.map(({player:r,score:n})=>N(r,e,n)).join(""):'<div class="empty">No players</div>'}
    </div>`}function A(e,t){const o=e.map(a=>{const l=y(a.recentGames.slice(0,g));return m.flatMap(i=>{const c=l[i];return!c||c.games<t?[]:[{role:i,avgOpScore:c.avgOpScore,games:c.games}]})});let r=-1/0,n=new Map;function s(a,l,i,c){if(a===m.length){c>r&&(r=c,n=new Map(i));return}const d=m[a];s(a+1,l,i,c);for(let p=0;p<e.length;p++){if(l.has(p))continue;const f=o[p].find(L=>L.role===d);f&&(i.set(d,{player:e[p],score:f.avgOpScore,games:f.games}),l.add(p),s(a+1,l,i,c+f.avgOpScore),l.delete(p),i.delete(d))}}return s(0,new Set,new Map,0),m.map(a=>{const l=n.get(a);return l?{role:a,player:l.player,score:l.score,games:l.games}:{role:a,player:null,score:null,games:0}})}function B(e){return`
    <div class="tb-wrapper">
      <div class="tb-controls">
        <div class="tb-section-label">Players</div>
        <div class="tb-players">${e.players.map((o,r)=>`
    <label class="tb-player-check">
      <input type="checkbox" class="tb-player-cb" data-idx="${r}" checked />
      <span class="tb-player-label">${o.gameName}<span class="tag">#${o.tagLine}</span></span>
    </label>`).join("")}</div>

        <div class="tb-row">
          <label class="tb-section-label" for="tb-min-games">Min games per role</label>
          <input id="tb-min-games" type="number" class="tb-number-input" value="3" min="1" max="200" />
        </div>

        <button id="tb-solve-btn" class="tb-btn">⚡ Find Best Lineup</button>
      </div>

      <div id="tb-result" class="tb-result-area"></div>
    </div>`}function j(e,t){const o=e.filter(s=>s.player).length,r=o?v(t/o):"#888",n=e.map(s=>{if(!s.player||s.score==null)return`
        <div class="lineup-row lineup-empty">
          <span class="lineup-role-icon">${$[s.role]}</span>
          <span class="lineup-role-name">${b[s.role]}</span>
          <span class="lineup-player muted">— No eligible player</span>
          <span></span>
        </div>`;const a=v(s.score);return`
      <div class="lineup-row">
        <span class="lineup-role-icon">${$[s.role]}</span>
        <span class="lineup-role-name">${b[s.role]}</span>
        <a class="lineup-player player-name" href="${w(s.player)}" target="_blank" rel="noopener">
          ${s.player.gameName}<span class="tag">#${s.player.tagLine}</span>
        </a>
        <span class="lineup-score" style="color:${a}">
          ${s.score.toFixed(2)}
          <span class="lineup-games">${s.games}g</span>
        </span>
      </div>`}).join("");return`
    <div class="lineup-card">
      <div class="lineup-header">
        Best lineup &mdash;
        <span style="color:${r}">${t.toFixed(2)}</span>
        <span class="muted"> total · ${o} role${o!==1?"s":""} filled</span>
      </div>
      ${n}
    </div>`}function T(e){var s;const t={};for(const a of e.players){const l=a.recentGames.slice(0,g),i=y(l);for(const[c,d]of Object.entries(i))t[c]||(t[c]=[]),t[c].push({player:a,score:d})}const o=[...m];(s=t.flex)!=null&&s.length&&o.push("flex");const r=Math.max(...e.players.map(a=>a.recentGames.length),20);return`
    <div class="controls">
      <label for="window-select">Look back</label>
      <select id="window-select">${[5,10,20,50,100,200].filter(a=>a<=r||a===20).map(a=>`<option value="${a}" ${a===g?"selected":""}>${a} games</option>`).join("")}</select>
    </div>
    <div class="grid">
      ${o.map(a=>C(a,t[a]??[])).join("")}
    </div>`}function h(e){var r;const t=document.getElementById("app");t.innerHTML=`
    <header>
      <h1>MCM League Tracker</h1>
      <div class="meta">
        Updated ${M(e.lastUpdated)} · ${e.players.length} players tracked
      </div>
      <div class="tabs">
        <button class="tab-btn ${u==="stats"?"active":""}" data-tab="stats">📊 Stats</button>
        <button class="tab-btn ${u==="builder"?"active":""}" data-tab="builder">⚙️ Team Builder</button>
      </div>
    </header>

    <div id="tab-stats"   class="tab-panel ${u==="stats"?"":"hidden"}">
      ${T(e)}
    </div>
    <div id="tab-builder" class="tab-panel ${u==="builder"?"":"hidden"}">
      ${B(e)}
    </div>`,t.querySelectorAll(".tab-btn").forEach(n=>{n.addEventListener("click",()=>{u=n.dataset.tab,h(e)})});const o=document.getElementById("window-select");o==null||o.addEventListener("change",()=>{g=parseInt(o.value,10),h(e)}),t.querySelectorAll(".toggle-btn").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.card,l=document.getElementById(`card-${s}`).querySelector(".games-list"),i=n.querySelector(".toggle-icon");if(!l)return;const c=l.classList.toggle("open");i.textContent=c?"▴":"▾"})}),(r=document.getElementById("tb-solve-btn"))==null||r.addEventListener("click",()=>{const n=[...document.querySelectorAll(".tb-player-cb:checked")].map(c=>parseInt(c.dataset.idx,10)),s=parseInt(document.getElementById("tb-min-games").value,10)||1,a=n.map(c=>e.players[c]).filter(Boolean);if(a.length===0){document.getElementById("tb-result").innerHTML='<div class="tb-msg">Select at least one player.</div>';return}const l=A(a,s),i=l.reduce((c,d)=>c+(d.score??0),0);document.getElementById("tb-result").innerHTML=j(l,i)})}async function x(){try{const e=await fetch("./data/cache.json");if(!e.ok)throw new Error(`HTTP ${e.status}`);const t=await e.json();h(t)}catch(e){document.getElementById("app").innerHTML=`
      <div class="error">
        Failed to load data. Run <code>npm run refresh</code> then <code>npm run build</code>.
      </div>`,console.error(e)}}x();
