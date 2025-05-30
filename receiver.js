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

// Configurar el receptor para manejar screen mirroring nativo
function initializeReceiver() {
    console.log('Inicializando Mirror Cast Receiver para conexiones nativas...');
    
    // Configurar opciones del contexto para manejar screen mirroring nativo
    const contextOptions = new cast.framework.CastReceiverOptions();
    contextOptions.disableIdleTimeout = true;
    contextOptions.maxInactivity = 3600; // 1 hora
    contextOptions.supportedCommands = cast.framework.messages.Command.ALL_BASIC_MEDIA;
    
    // Configurar como Default Media Receiver para interceptar mirroring nativo
    contextOptions.customNamespaces = {
        'urn:x-cast:com.google.cast.media': 'JSON',
        'urn:x-cast:com.google.cast.tp.deviceauth': 'JSON',
        'urn:x-cast:com.google.cast.tp.heartbeat': 'JSON',
        'urn:x-cast:com.google.cast.receiver': 'JSON',
        'urn:x-cast:com.mirrorcast.config': 'JSON',
        'urn:x-cast:com.mirrorcast.mirror': 'JSON',
        'urn:x-cast:com.mirrorcast.control': 'JSON'
    };
    
    // Escuchar eventos del sistema
    context.addEventListener(cast.framework.system.EventType.READY, onReady);
    context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, onSenderConnected);
    context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, onSenderDisconnected);
    context.addEventListener(cast.framework.system.EventType.VISIBILITY_CHANGED, onVisibilityChanged);
    context.addEventListener(cast.framework.system.EventType.STANDBY_CHANGED, onStandbyChanged);
    
    // Escuchar mensajes personalizados
    context.addCustomMessageListener('urn:x-cast:com.mirrorcast.config', onConfigMessage);
    context.addCustomMessageListener('urn:x-cast:com.mirrorcast.mirror', onMirrorMessage);
    context.addCustomMessageListener('urn:x-cast:com.mirrorcast.control', onControlMessage);
    
    // Interceptar mensajes del sistema para screen mirroring
    context.addCustomMessageListener('urn:x-cast:com.google.cast.media', onMediaMessage);
    context.addCustomMessageListener('urn:x-cast:com.google.cast.receiver', onReceiverMessage);
    
    // Configurar el player manager para manejar media nativa
    playerManager.addEventListener(cast.framework.events.EventType.PLAYER_LOAD_COMPLETE, onPlayerLoadComplete);
    playerManager.addEventListener(cast.framework.events.EventType.PLAYER_LOADING, onPlayerLoading);
    playerManager.addEventListener(cast.framework.events.EventType.LOAD, onLoad);
    playerManager.addEventListener(cast.framework.events.EventType.MEDIA_STATUS_CHANGED, onMediaStatusChanged);
    
    // Configurar interceptores para LOAD requests (screen mirroring nativo)
    playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, onLoadInterceptor);
    
    // Iniciar el contexto
    context.start(contextOptions);
    
    // Mantener la aplicación siempre activa
    setInterval(() => {
        if (!isConnected) {
            console.log('Receptor activo, esperando conexiones...');
        }
    }, 30000); // Log cada 30 segundos
}

// Interceptor para capturar requests de screen mirroring
function onLoadInterceptor(loadRequestData) {
    console.log('📱 Interceptando request de carga:', loadRequestData);
    
    // Detectar si es screen mirroring nativo
    const media = loadRequestData.media;
    if (media && (
        media.contentType === 'video/mp4' ||
        media.contentType === 'application/x-mpegURL' ||
        media.streamType === cast.framework.messages.StreamType.LIVE ||
        media.contentId.includes('mirror') ||
        media.contentId.includes('screen')
    )) {
        console.log('🔄 Detectado screen mirroring nativo!');
        handleNativeScreenMirroring(loadRequestData);
    }
    
    return loadRequestData;
}

function handleNativeScreenMirroring(loadRequestData) {
    console.log('🎯 Manejando screen mirroring nativo...');
    
    isMirroring = true;
    hideIdleScreen();
    showVideoContainer();
    updateStatus('📱 Transmisión de pantalla activa');
    
    // Personalizar la experiencia de mirroring
    const media = loadRequestData.media;
    if (media) {
        // Configurar metadatos personalizados
        media.metadata = media.metadata || {};
        media.metadata.title = config.deviceName;
        media.metadata.subtitle = 'Transmisión de pantalla en vivo';
        media.metadata.images = [{
            url: 'https://via.placeholder.com/480x270/4285F4/FFFFFF?text=' + encodeURIComponent(config.deviceName)
        }];
    }
    
    // Enviar notificación a dispositivos conectados
    broadcastMirrorStatus(true);
}

function onLoad(event) {
    console.log('📺 Media cargada:', event);
    const media = event.data.media;
    
    if (media) {
        // Detectar screen mirroring por características del stream
        if (media.streamType === cast.framework.messages.StreamType.LIVE ||
            media.contentId.includes('rtmp://') ||
            media.contentId.includes('udp://') ||
            media.duration === null) {
            
            console.log('🔄 Stream de mirroring detectado');
            handleNativeScreenMirroring({ media: media });
        }
    }
}

function onMediaStatusChanged(event) {
    const mediaStatus = event.mediaStatus;
    if (mediaStatus) {
        const playerState = mediaStatus.playerState;
        
        if (playerState === cast.framework.messages.PlayerState.PLAYING) {
            if (!isMirroring) {
                console.log('🎬 Reproducción iniciada - posible screen mirroring');
                isMirroring = true;
                hideIdleScreen();
                showVideoContainer();
                updateStatus('📱 Transmitiendo...');
                broadcastMirrorStatus(true);
            }
        } else if (playerState === cast.framework.messages.PlayerState.IDLE) {
            if (isMirroring) {
                console.log('⏹️ Reproducción detenida - fin del mirroring');
                stopMirroring();
            }
        }
    }
}

function onMediaMessage(event) {
    console.log('📨 Mensaje de media recibido:', event.data);
    // Procesar mensajes específicos de screen mirroring
}

function onReceiverMessage(event) {
    console.log('📨 Mensaje de receiver recibido:', event.data);
    // Procesar mensajes del receiver
}

function onReady() {
    console.log('✅ Receiver listo para conexiones nativas');
    updateDeviceName();
    showIdleScreen();
    
    // Anunciar disponibilidad para screen mirroring
    console.log('📡 Receptor Mirror Cast activo - ID: 499DD855');
    console.log('🔗 URL: https://jgenovardine.github.io/mirror-cast-receiver/');
}

function onSenderConnected(event) {
    console.log('📱 Dispositivo conectado:', event.senderId);
    isConnected = true;
    updateStatus('Dispositivo conectado - ' + config.deviceName);
    showLoading();
    
    // Enviar configuración de bienvenida
    setTimeout(() => {
        sendWelcomeMessage(event.senderId);
    }, 1000);
}

function onSenderDisconnected(event) {
    console.log('📱 Dispositivo desconectado:', event.senderId);
    
    // Verificar si quedan dispositivos conectados
    const senders = context.getSenders();
    if (senders.length === 0) {
        isConnected = false;
        isMirroring = false;
        updateStatus('Listo para conectar - ' + config.deviceName);
        showIdleScreen();
    }
}

function onVisibilityChanged(event) {
    console.log('👁️ Visibilidad cambiada:', event.isVisible);
    if (!event.isVisible && !isMirroring) {
        // Optimizar cuando no es visible
        if (idleVideo && config.backgroundType === 'video') {
            idleVideo.pause();
        }
    } else if (event.isVisible && !isMirroring && config.backgroundType === 'video') {
        if (idleVideo) {
            idleVideo.play().catch(console.error);
        }
    }
}

function onStandbyChanged(event) {
    console.log('😴 Standby cambiado:', event.isStandby);
}

function sendWelcomeMessage(senderId) {
    const welcomeMessage = {
        type: 'welcome',
        deviceName: config.deviceName,
        receiverVersion: '1.0.0',
        capabilities: ['screen_mirror', 'media_playback', 'custom_idle'],
        instructions: 'Para hacer screen mirroring, usa la función nativa de tu dispositivo'
    };
    
    context.sendCustomMessage('urn:x-cast:com.mirrorcast.control', senderId, welcomeMessage);
}

function broadcastMirrorStatus(mirroring) {
    const statusMessage = {
        type: 'mirror_status',
        mirroring: mirroring,
        deviceName: config.deviceName,
        timestamp: Date.now()
    };
    
    // Enviar a todos los senders conectados
    const senders = context.getSenders();
    senders.forEach(sender => {
        context.sendCustomMessage('urn:x-cast:com.mirrorcast.control', sender.id, statusMessage);
    });
}

function onConfigMessage(event) {
    console.log('⚙️ Configuración recibida:', event.data);
    
    try {
        const newConfig = JSON.parse(event.data);
        config = { ...config, ...newConfig };
        
        if (newConfig.deviceName) {
            updateDeviceName();
        }
        
        if (newConfig.idleVideoUrl || newConfig.idleImageUrl || newConfig.backgroundType) {
            if (!isMirroring) {
                showIdleScreen();
            }
        }
        
        const response = {
            type: 'config_updated',
            config: config
        };
        context.sendCustomMessage('urn:x-cast:com.mirrorcast.config', event.senderId, response);
        
    } catch (error) {
        console.error('❌ Error procesando configuración:', error);
    }
}

function onMirrorMessage(event) {
    console.log('🔄 Mensaje de mirror recibido:', event.data);
    
    try {
        const data = JSON.parse(event.data);
        
        switch (data.action) {
            case 'start_mirror':
                if (!isMirroring) {
                    startMirroring(data);
                }
                break;
            case 'stop_mirror':
                stopMirroring();
                break;
            case 'update_stream':
                updateMirrorStream(data);
                break;
        }
        
    } catch (error) {
        console.error('❌ Error procesando mensaje de mirror:', error);
    }
}

function onControlMessage(event) {
    console.log('🎮 Mensaje de control recibido:', event.data);
    
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
                    config: config,
                    receiverVersion: '1.0.0'
                };
                context.sendCustomMessage('urn:x-cast:com.mirrorcast.control', event.senderId, status);
                break;
        }
        
    } catch (error) {
        console.error('❌ Error procesando mensaje de control:', error);
    }
}

function startMirroring(data) {
    console.log('🎬 Iniciando mirroring...', data);
    
    isMirroring = true;
    hideIdleScreen();
    showVideoContainer();
    updateStatus('📱 Transmitiendo pantalla...');
    
    broadcastMirrorStatus(true);
}

function stopMirroring() {
    console.log('⏹️ Deteniendo mirroring...');
    
    isMirroring = false;
    mirrorVideo.pause();
    mirrorVideo.src = '';
    
    hideVideoContainer();
    showIdleScreen();
    updateStatus('Listo para conectar - ' + config.deviceName);
    
    playerManager.stop();
    broadcastMirrorStatus(false);
}

function updateMirrorStream(data) {
    if (isMirroring && data.streamUrl) {
        mirrorVideo.src = data.streamUrl;
        mirrorVideo.play().catch(console.error);
    }
}

function onPlayerLoadComplete() {
    console.log('✅ Player cargado completamente');
    hideLoading();
}

function onPlayerLoading() {
    console.log('⏳ Player cargando...');
    showLoading();
}

function updateDeviceName() {
    deviceNameEl.textContent = config.deviceName;
    document.title = config.deviceName + ' - Mirror Cast';
}

function updateStatus(status) {
    statusEl.textContent = status;
    console.log('📊 Status:', status);
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

// Manejar errores de video
mirrorVideo.addEventListener('error', (e) => {
    console.error('❌ Error en video de mirroring:', e);
    updateStatus('Error de conexión - reintentando...');
    setTimeout(() => {
        if (isMirroring) {
            updateStatus('📱 Transmitiendo pantalla...');
        }
    }, 3000);
});

idleVideo.addEventListener('error', (e) => {
    console.error('❌ Error en video idle:', e);
    idleVideo.classList.add('hidden');
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReceiver);
} else {
    initializeReceiver();
}

console.log('🚀 Mirror Cast Receiver v1.0.0 - Listo para conexiones nativas'); 