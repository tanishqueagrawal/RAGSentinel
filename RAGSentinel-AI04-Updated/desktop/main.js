const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path=require('path');
let tray=null,bubble=null,panel=null,quitting=false;
const iconSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="g"><stop stop-color="#55d6d2"/><stop offset="1" stop-color="#7aa2ff"/></linearGradient></defs><circle cx="32" cy="32" r="29" fill="#101a2e" stroke="url(#g)" stroke-width="4"/><path d="M19 48V16h15c10 0 15 5 15 13 0 6-3 10-9 12l10 7H38l-9-11h-1v11zM28 24v8h6c4 0 6-1 6-4s-2-4-6-4z" fill="url(#g)"/></svg>`;
const bubbleIcon=nativeImage.createFromDataURL('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(iconSvg));
function createPanel(){
 if(panel&&!panel.isDestroyed()){panel.show();panel.focus();return}
 const {workArea}=screen.getPrimaryDisplay();
 panel=new BrowserWindow({width:420,height:700,x:Math.max(0,workArea.x+workArea.width-440),y:workArea.y+90,show:false,frame:false,resizable:true,alwaysOnTop:true,skipTaskbar:true,backgroundColor:'#0b1020',
  webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 panel.loadFile(path.join(__dirname,'panel.html'));panel.once('ready-to-show',()=>panel.show());panel.on('closed',()=>panel=null);
}
function togglePanel(){if(panel&&!panel.isDestroyed()&&panel.isVisible())panel.hide();else createPanel()}
function createBubble(){
 const {workArea}=screen.getPrimaryDisplay();
 bubble=new BrowserWindow({width:62,height:62,x:workArea.x+workArea.width-90,y:workArea.y+Math.round(workArea.height*.55),show:false,frame:false,transparent:true,backgroundColor:'#00000000',resizable:false,movable:true,alwaysOnTop:true,skipTaskbar:true,hasShadow:false,
  webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 bubble.loadFile(path.join(__dirname,'bubble.html'));bubble.setAlwaysOnTop(true,'floating');bubble.show();
 bubble.on('closed',()=>bubble=null);
}
app.whenReady().then(()=>{
 app.setAppUserModelId('RAGSentinel.FloatingTool');
 tray=new Tray(bubbleIcon);tray.setToolTip('RAGSentinel — draggable bubble');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'Open / Hide panel',click:togglePanel},{type:'separator'},{label:'Quit',click:()=>{quitting=true;app.quit()}}]));
 createBubble();createPanel();
});
app.on('before-quit',()=>{quitting=true});
app.on('window-all-closed',e=>{if(!quitting)e.preventDefault()});
app.on('activate',()=>{if(!bubble||bubble.isDestroyed())createBubble();else togglePanel()});
ipcMain.handle('open-url',async(_e,url)=>{if(typeof url==='string'&&/^https?:\/\//i.test(url))await shell.openExternal(url)});
ipcMain.on('bubble-click',()=>togglePanel());
ipcMain.on('move-bubble',(_event,dx,dy)=>{
 if(bubble&&!bubble.isDestroyed()){
  const [x,y]=bubble.getPosition();
  const display=screen.getDisplayMatching({x,y,width:62,height:62});
  const a=display.workArea;
  bubble.setPosition(
   Math.max(a.x,Math.min(a.x+a.width-62,x+Math.round(dx))),
   Math.max(a.y,Math.min(a.y+a.height-62,y+Math.round(dy)))
  );
 }
});
ipcMain.on('hide-panel',()=>{if(panel&&!panel.isDestroyed())panel.hide()});
