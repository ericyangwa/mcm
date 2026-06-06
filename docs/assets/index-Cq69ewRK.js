(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();let u=20;const v=["top","jungle","mid","bot","support"],m={top:"Top",jungle:"Jungle",mid:"Mid",bot:"Bot",support:"Support",flex:"Flex"},w={top:"🛡️",jungle:"🌿",mid:"⚡",bot:"🏹",support:"💙",flex:"🔀"},L={IRON:"#6a6a6a",BRONZE:"#a05000",SILVER:"#6a7f9a",GOLD:"#e5a330",PLATINUM:"#00b4b4",EMERALD:"#00c080",DIAMOND:"#576bce",MASTER:"#9d4dc6",GRANDMASTER:"#e84057",CHALLENGER:"#f4c874"},O={1:"I",2:"II",3:"III",4:"IV"},S={na1:"na",euw1:"euw",eune1:"eune",kr:"kr",br1:"br",la1:"lan",la2:"las",oc1:"oce",tr1:"tr",ru:"ru",jp1:"jp"};function I(e){return`https://www.op.gg/summoners/${S[e.region]??e.region.toLowerCase()}/${encodeURIComponent(e.gameName)}-${e.tagLine}`}function E(e){const t=O[e.division]??"";return`${e.tier.charAt(0)+e.tier.slice(1).toLowerCase()}${t?` ${t}`:""}`}function R(e){const t=e.wins+e.losses;return t?`${Math.round(e.wins/t*100)}%`:"0%"}function g(e){return e>=7?"#f4c874":e>=6?"#00c080":e>=5?"#4a9eff":e>=4?"#e5a330":"#e84057"}function b(e){const t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t}m ago`;const n=Math.floor(t/60);return n<24?`${n}h ago`:`${Math.floor(n/24)}d ago`}function M(e){if(e.opScore==null)return"";const t=e.result==="WIN",n=e.result==="WIN"?"win":e.result==="LOSE"?"loss":"",s=g(e.opScore),o=e.champion??"?",a=e.createdAt?new Date(e.createdAt).toLocaleDateString(void 0,{month:"short",day:"numeric"}):"";return`
    <div class="game-row ${n}">
      <span class="game-result-dot" title="${e.result??""}">${t?"▲":"▼"}</span>
      <span class="game-champion">${o}</span>
      <span class="game-score" style="color:${s}">${e.opScore.toFixed(2)}</span>
      <span class="game-date">${a}</span>
    </div>`}function N(e,t,n){const s=e.rank?L[e.rank.tier]??"#888":"#555",o=g(n.avgOpScore),a=e.rank?`<div class="rank" style="color:${s}">
         ${E(e.rank)}<span class="lp">${e.rank.lp} LP</span>
       </div>
       <div class="winrate">${R(e.rank)} WR · ${e.rank.wins}W ${e.rank.losses}L</div>`:'<div class="rank unranked">Unranked</div>',c=e.recentGames.slice(0,u).filter(d=>d.position===t),i=c.length?`<div class="games-list">${c.map(M).join("")}</div>`:"",r=`${e.gameName}-${e.tagLine}-${t}`.replace(/[^a-zA-Z0-9-]/g,"_");return`
    <div class="card" id="card-${r}">
      <div class="card-header">
        <a class="player-name" href="${I(e)}" target="_blank" rel="noopener">
          ${e.gameName}<span class="tag">#${e.tagLine}</span>
        </a>
        <button class="toggle-btn" data-card="${r}" title="Show games">
          <span class="toggle-icon">▾</span>
        </button>
      </div>

      <div class="op-score" style="color:${o}">
        ${n.avgOpScore.toFixed(2)}
        <span class="op-label">OP Score</span>
      </div>
      <span class="sample-size">${n.games} game${n.games!==1?"s":""} as ${m[t]}</span>

      ${a}
      ${i}
    </div>`}function k(e,t){const n=[...t].sort((s,o)=>o.score.avgOpScore-s.score.avgOpScore);return`
    <div class="column">
      <div class="column-header">
        <span class="role-icon">${w[e]}</span>
        ${m[e]}
        <span class="player-count">${t.length}</span>
      </div>
      ${n.length?n.map(({player:s,score:o})=>N(s,e,o)).join(""):'<div class="empty">No players</div>'}
    </div>`}function y(e){const t={};for(const s of e)!s.position||s.opScore==null||(t[s.position]||(t[s.position]=[]),t[s.position].push(s.opScore));const n={};for(const[s,o]of Object.entries(t)){const a=o.reduce((c,i)=>c+i,0)/o.length;n[s]={avgOpScore:Math.round(a*100)/100,games:o.length}}return n}function $(e){var i;const t={};for(const r of e.players){const d=r.recentGames.slice(0,u),f=y(d);for(const[l,p]of Object.entries(f))t[l]||(t[l]=[]),t[l].push({player:r,score:p})}const n=[...v];(i=t.flex)!=null&&i.length&&n.push("flex");const s=Math.max(...e.players.map(r=>r.recentGames.length),20),o=[5,10,20,50,100,200].filter(r=>r<=s||r===20).map(r=>`<option value="${r}" ${r===u?"selected":""}>${r} games</option>`).join(""),a=document.getElementById("app");a.innerHTML=`
    <header>
      <h1>MCM League Tracker</h1>
      <div class="meta">
        Updated ${b(e.lastUpdated)} · ${e.players.length} players tracked
      </div>
      <div class="controls">
        <label for="window-select">Look back</label>
        <select id="window-select">${o}</select>
      </div>
    </header>
    <div class="grid">
      ${n.map(r=>k(r,t[r]??[])).join("")}
    </div>`,a.querySelectorAll(".toggle-btn").forEach(r=>{r.addEventListener("click",()=>{const d=r.dataset.card,l=document.getElementById(`card-${d}`).querySelector(".games-list"),p=r.querySelector(".toggle-icon");if(!l)return;const h=l.classList.toggle("open");p.textContent=h?"▴":"▾"})});const c=document.getElementById("window-select");c==null||c.addEventListener("change",()=>{u=parseInt(c.value,10),$(e)})}async function A(){try{const e=await fetch("./data/cache.json");if(!e.ok)throw new Error(`HTTP ${e.status}`);const t=await e.json();$(t)}catch(e){document.getElementById("app").innerHTML=`
      <div class="error">
        Failed to load data. Run <code>npm run refresh</code> then <code>npm run build</code>.
      </div>`,console.error(e)}}A();
