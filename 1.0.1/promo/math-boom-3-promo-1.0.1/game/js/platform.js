/* МАТ-БУМ! 3 «Побег из сферы» — адаптер игровой платформы (по образцу 1.0.21).
   SDK подключается с относительного пути /sdk.js (его отдаёт сама платформа) —
   в архив игры он НЕ вкладывается. Локально/офлайн всё молча деградирует до
   гостевого режима: игра работает без SDK полностью. */
'use strict';
const PLAT={ysdk:null,player:null,lang:'ru',ready:false};
let gameplayWanted=false,gameplayMarked=false,paused=false;

function plDeadline(p,ms,msg){let t;return Promise.race([p,new Promise((_,r)=>{t=setTimeout(()=>r(new Error(msg)),ms);})]).finally(()=>clearTimeout(t));}
function loadSdk(ms){
 if(window.YaGames&&typeof window.YaGames.init==='function')return Promise.resolve(window.YaGames);
 return new Promise((res,rej)=>{const s=document.createElement('script');s.src='/sdk.js';s.async=true;
  const t=setTimeout(()=>rej(new Error('sdk timeout')),ms||6000);
  s.onload=()=>{clearTimeout(t);window.YaGames?res(window.YaGames):rej(new Error('no YaGames'));};
  s.onerror=()=>{clearTimeout(t);rej(new Error('sdk load failed'));};
  document.head.appendChild(s);});}
function syncGameplay(){const api=PLAT.ysdk&&PLAT.ysdk.features&&PLAT.ysdk.features.GameplayAPI;if(!api)return;
 const should=gameplayWanted&&!paused;
 try{if(should&&!gameplayMarked){api.start();gameplayMarked=true;}
 else if(!should&&gameplayMarked){api.stop();gameplayMarked=false;}}catch(e){}}
function gameReady(){try{PLAT.ysdk&&PLAT.ysdk.features&&PLAT.ysdk.features.LoadingAPI&&PLAT.ysdk.features.LoadingAPI.ready();}catch(e){}}
async function initPlatform(){
 try{
  if(location.protocol==='file:')return PLAT;           // двойной клик по файлу: гостевой режим
  await loadSdk();
  PLAT.ysdk=await plDeadline(window.YaGames.init(),8000,'SDK init timeout');
  const y=PLAT.ysdk;
  if(y.on){
   y.on('game_api_pause',()=>{paused=true;syncGameplay();window.dispatchEvent(new Event('mb:pause'));});
   y.on('game_api_resume',()=>{paused=false;syncGameplay();window.dispatchEvent(new Event('mb:resume'));});
  }
  const env=(y.environment&&y.environment.i18n)||{};
  PLAT.lang=(String(env.lang||'ru').toLowerCase().startsWith('ru'))?'ru':'en';
  try{PLAT.player=await plDeadline(y.getPlayer({scopes:false}),4000,'player timeout');}catch(e){PLAT.player=null;}
 }catch(e){PLAT.ysdk=null;PLAT.player=null;}
 try{window.dispatchEvent(new Event('mb:platready'));}catch(e){}
 // правила портала: без контекстного меню и выделения внутри игры
 try{document.addEventListener('contextmenu',e=>{e.preventDefault();return false;},{passive:false});}catch(e){}
 try{document.body.style.userSelect='none';document.body.style.webkitUserSelect='none';document.body.style.webkitTouchCallout='none';}catch(e){}
 return PLAT;
}
function gameplayStart(){gameplayWanted=true;syncGameplay();}
function gameplayStop(){gameplayWanted=false;gameplayMarked=false;
 try{PLAT.ysdk&&PLAT.ysdk.features&&PLAT.ysdk.features.GameplayAPI&&PLAT.ysdk.features.GameplayAPI.stop();}catch(e){}}
/* полноэкранная реклама в естественной паузе (звук приглушаем на время показа) */
function showInterstitial(){
 if(!PLAT.ysdk||!PLAT.ysdk.adv)return Promise.resolve(false);
 pauseForAd();
 return new Promise(res=>{try{
  PLAT.ysdk.adv.showFullscreenAdv({callbacks:{onClose:()=>{resumeForAd();res(true);},
   onError:()=>{resumeForAd();res(false);},onOffline:()=>{resumeForAd();res(false);}}});
 }catch(e){resumeForAd();res(false);}});}
/* реклама за награду: покупка автосборки слоя на портале */
function showRewarded(){
 if(!PLAT.ysdk||!PLAT.ysdk.adv||!PLAT.ysdk.adv.showRewardedVideo)return Promise.resolve(false);
 pauseForAd();
 return new Promise(res=>{let reward=false;try{
  PLAT.ysdk.adv.showRewardedVideo({callbacks:{
   onRewarded:()=>{reward=true;},
   onClosed:()=>{resumeForAd();res(reward);},
   onError:()=>{resumeForAd();res(false);},
   onOffline:()=>{resumeForAd();res(false);}}});
 }catch(e){resumeForAd();res(false);}});}
window.showRewarded=showRewarded;
/* облачные сохранения прогресса (работают и для гостей) */
async function cloudSave(obj){
 if(!PLAT.player)return false;
 try{await PLAT.player.setData({matbum3:obj},true);return true;}catch(e){return false;}
}
async function cloudLoad(){
 if(!PLAT.player)return null;
 try{const d=await plDeadline(PLAT.player.getData(),5000,'cloud timeout');
  return d&&d.matbum3?d.matbum3:null;}catch(e){return null;}
}
/* лидерборды: создайте в черновике таблицу с техническим именем 'main',
   сортировкой «по убыванию» и показом никнеймов */
async function lbSubmit(score,board){
 if(!PLAT.ysdk||!PLAT.ysdk.getLeaderboards)return;
 try{const lb=await PLAT.ysdk.getLeaderboards();await lb.setLeaderboardScore(board||'main',score);}catch(e){}
}
async function lbTop(n){
 if(!PLAT.ysdk||!PLAT.ysdk.getLeaderboards)return null;
 try{const lb=await PLAT.ysdk.getLeaderboards();
  const r=await lb.getLeaderboardEntries('main',{quantityTop:n||5,includeUser:true,quantityAround:2});
  return r.entries.map(e=>({name:(e.player&&e.player.publicName)||'?',score:e.score}));
 }catch(e){return null;}
}
window.PLAT=PLAT;window.initPlatform=initPlatform;window.gameReady=gameReady;
window.gameplayStart=gameplayStart;window.gameplayStop=gameplayStop;
window.showInterstitial=showInterstitial;window.cloudSave=cloudSave;window.cloudLoad=cloudLoad;
window.lbSubmit=lbSubmit;window.lbTop=lbTop;
