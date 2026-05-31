const { contextBridge } = require('electron')

/** Steamworks 연동 시 steamworks.js 등을 여기서 expose */
contextBridge.exposeInMainWorld('ruinsCity', {
  platform: 'electron',
  version: '0.2.0',
})
