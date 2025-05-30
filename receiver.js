const cast = window.cast;
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

// Configuración por defecto
let config = {
    deviceName: 'Mirror Cast',
    idleVideoUrl: '',
    idleImageUrl: '',
    backgroundType: 'gradient' // 'gradient', 'video', 'image'
};

// Elementos DOM
const videoContainer = document.getElementById('video-container');
const mirrorVideo = document.getElementById('mirror-video');
const idleContent = document.getElementById('idle-content');
const idleVideo = document.getElementById('idle-video');
const deviceNameEl = document.getElementById('device-name');
const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');

// Estado de la aplicación
let isConnected = false;
let isMirroring = false;

// Configurar el receptor
function initializeReceiver() {
    console.log('Inicializando Mirror Cast Receiver...');
    
    // Configurar opciones del contexto
    const contextOptions = new cast.framework.CastReceiverOptions();
    contextOptions.disableIdleTimeout = true;
    contextOptions.maxInactivity = 3600; // 1 hora
    
    // Escuchar eventos de conexión
    context.addEventListener(cast.framework.system.EventType.READY, onReady);
    context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, onSenderConnected);
    context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, onSenderDisconnected);
    
    // Escuchar mensajes personalizados
    context.addCustomMessageListener('urn:x-cast:com.mirrorcast.config', onConfigMessage);
    context.addCustomMessageListener('urn:x-cast:com.mirrorcast.mirror', onMirrorMessage);
    context.addCustomMessageListener('urn:x-cast:com.mirrorcast.control', onControlMessage);
    
    // Configurar el player manager
    playerManager.addEventListener(cast.framework.events.EventType.PLAYER_LOAD_COMPLETE, onPlayerLoadComplete);
    playerManager.addEventListener(cast.framework.events.EventType.PLAYER_LOADING, onPlayerLoading);
    
    // Iniciar el contexto
    context.start(contextOptions);
}

function onReady() {
    console.log('Receiver listo');
    updateDeviceName();
    showIdleScreen();
}

function onSenderConnected(event) {
    console.log('Dispositivo conectado:', event.senderId);
    isConnected = true;
    updateStatus('Dispositivo conectado');
    showLoading();
}

function onSenderDisconnected(event) {
    console.log('Dispositivo desconectado:', event.senderId);
    isConnected = false;
    isMirroring = false;
    updateStatus('Listo para conectar');
    showIdleScreen();
}

function onConfigMessage(event) {
    console.log('Mensaje de configuración recibido:', event.data);
    
    try {
        const newConfig = JSON.parse(event.data);
        config = { ...config, ...newConfig };
        
        // Aplicar configuración
        if (newConfig.deviceName) {
            updateDeviceName();
        }
        
        if (newConfig.idleVideoUrl || newConfig.idleImageUrl || newConfig.backgroundType) {
            if (!isMirroring) {
                showIdleScreen();
            }
        }
        
        // Responder confirmación
        const response = {
            type: 'config_updated',
            config: config
        };
        context.sendCustomMessage('urn:x-cast:com.mirrorcast.config', event.senderId, response);
        
    } catch (error) {
        console.error('Error procesando configuración:', error);
    }
}

function onMirrorMessage(event) {
    console.log('Mensaje de mirror recibido:', event.data);
    
    try {
        const data = JSON.parse(event.data);
        
        switch (data.action) {
            case 'start_mirror':
                startMirroring(data);
                break;
            case 'stop_mirror':
                stopMirroring();
                break;
            case 'update_stream':
                updateMirrorStream(data);
                break;
        }
        
    } catch (error) {
        console.error('Error procesando mensaje de mirror:', error);
    }
}

function onControlMessage(event) {
    console.log('Mensaje de control recibido:', event.data);
    
    try {
        const data = JSON.parse(event.data);
        
        switch (data.action) {
            case 'ping':
                context.sendCustomMessage('urn:x-cast:com.mirrorcast.control', event.senderId, { type: 'pong' });
                break;
            case 'get_status':
                const status = {
                    type: 'status',
                    connected: isConnected,
                    mirroring: isMirroring,
                    config: config
                };
                context.sendCustomMessage('urn:x-cast:com.mirrorcast.control', event.senderId, status);
                break;
        }
        
    } catch (error) {
        console.error('Error procesando mensaje de control:', error);
    }
}

function startMirroring(data) {
    console.log('Iniciando mirroring...', data);
    
    isMirroring = true;
    hideIdleScreen();
    showVideoContainer();
    updateStatus('Transmitiendo...');
    
    // Si hay una URL de stream, configurar el video
    if (data.streamUrl) {
        mirrorVideo.src = data.streamUrl;
        mirrorVideo.play().catch(console.error);
    }
    
    // Para mirroring nativo de Android/iOS, el stream se maneja a través del framework
    if (data.mediaInfo) {
        const mediaInfo = new cast.framework.messages.MediaInformation();
        mediaInfo.contentId = data.mediaInfo.contentId || data.streamUrl;
        mediaInfo.contentType = data.mediaInfo.contentType || 'video/mp4';
        mediaInfo.streamType = cast.framework.messages.StreamType.LIVE;
        
        const request = new cast.framework.messages.LoadRequestData();
        request.media = mediaInfo;
        request.autoplay = true;
        
        playerManager.load(request);
    }
}

function stopMirroring() {
    console.log('Deteniendo mirroring...');
    
    isMirroring = false;
    mirrorVideo.pause();
    mirrorVideo.src = '';
    
    hideVideoContainer();
    showIdleScreen();
    updateStatus('Listo para conectar');
    
    // Detener el player si está activo
    playerManager.stop();
}

function updateMirrorStream(data) {
    if (isMirroring && data.streamUrl) {
        mirrorVideo.src = data.streamUrl;
        mirrorVideo.play().catch(console.error);
    }
}

function onPlayerLoadComplete() {
    console.log('Player cargado completamente');
    hideLoading();
}

function onPlayerLoading() {
    console.log('Player cargando...');
    showLoading();
}

function updateDeviceName() {
    deviceNameEl.textContent = config.deviceName;
}

function updateStatus(status) {
    statusEl.textContent = status;
}

function showIdleScreen() {
    idleContent.classList.remove('hidden');
    
    // Configurar background según tipo
    if (config.backgroundType === 'video' && config.idleVideoUrl) {
        idleVideo.src = config.idleVideoUrl;
        idleVideo.classList.remove('hidden');
        idleVideo.play().catch(console.error);
    } else {
        idleVideo.classList.add('hidden');
        idleVideo.pause();
    }
    
    hideLoading();
}

function hideIdleScreen() {
    idleContent.classList.add('hidden');
    idleVideo.pause();
}

function showVideoContainer() {
    videoContainer.classList.remove('hidden');
}

function hideVideoContainer() {
    videoContainer.classList.add('hidden');
}

function showLoading() {
    loadingEl.classList.remove('hidden');
    statusEl.classList.add('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
    statusEl.classList.remove('hidden');
}

// Funciones para compatibilidad con dispositivos Android/iOS
function enableNativeScreenMirroring() {
    // Android utiliza el protocolo DIAL/Cast nativo
    // iOS utiliza AirPlay que puede ser interceptado por el receiver
    
    // Registrar el receptor para protocolo de screen mirroring
    if (window.chrome && window.chrome.cast) {
        const sessionRequest = new chrome.cast.SessionRequest('CC1AD845'); // Media Router App ID
        const apiConfig = new chrome.cast.ApiConfig(sessionRequest, () => {}, () => {});
        chrome.cast.initialize(apiConfig);
    }
}

// Manejar eventos de visibilidad para optimizar rendimiento
document.addEventListener('visibilitychange', () => {
    if (document.hidden && !isMirroring) {
        // Pausar video idle si la página no es visible
        idleVideo.pause();
    } else if (!document.hidden && !isMirroring && config.backgroundType === 'video') {
        // Reanudar video idle
        idleVideo.play().catch(console.error);
    }
});

// Manejar errores de video
mirrorVideo.addEventListener('error', (e) => {
    console.error('Error en video de mirroring:', e);
    updateStatus('Error de conexión');
    setTimeout(() => {
        if (isMirroring) {
            updateStatus('Transmitiendo...');
        }
    }, 3000);
});

idleVideo.addEventListener('error', (e) => {
    console.error('Error en video idle:', e);
    idleVideo.classList.add('hidden');
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReceiver);
} else {
    initializeReceiver();
}

// Habilitar screen mirroring nativo
enableNativeScreenMirroring(); 