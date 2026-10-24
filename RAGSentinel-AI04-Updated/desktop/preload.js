const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sentinel',{
 apiBase:'http://127.0.0.1:8765',
 openUrl:url=>ipcRenderer.invoke('open-url',url),
 bubbleClick:()=>ipcRenderer.send('bubble-click'),
 moveBubble:(dx,dy)=>ipcRenderer.send('move-bubble',dx,dy),
 hidePanel:()=>ipcRenderer.send('hide-panel')
});
