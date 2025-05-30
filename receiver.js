// Mirror Cast - Receptor personalizado para screen mirroring nativo
const cast = window.cast;
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

console.log('🎯 Mirror Cast iniciando - App ID: 499DD855');

// Estado de la aplicación
let isConnected = false;
let isMirroring = false;

// Elementos DOM
const statusEl = document.getElementById('status');
const connectionStatusEl = document.getElementById('connection-status');
const idleContent = document.getElementById('idle-content');
const videoContainer = document.getElementById('video-container');
const mirrorVideo = document.getElementById('mirror-video');

// Configuración del receptor
const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true;
options.maxInactivity = 3600; // 1 hora

// Configurar para interceptar screen mirroring nativo
options.supportedCommands = cast.framework.messages.Command.ALL_BASIC_MEDIA;

// Eventos del sistema
context.addEventListener(cast.framework.system.EventType.READY, onReady);
context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, onSenderConnected);
context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, onSenderDisconnected);

// Eventos del player para detectar mirroring
playerManager.addEventListener(cast.framework.events.EventType.LOAD, onLoad);
playerManager.addEventListener(cast.framework.events.EventType.MEDIA_STATUS_CHANGED, onMediaStatusChanged);

// Interceptor para capturar requests de screen mirroring
playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, onLoadInterceptor);

function onReady() {
    console.log('✅ Mirror Cast activo - Visible para Android');
    updateStatus('Receptor activo y listo');
    updateConnectionStatus('Activo en ChromeCast');
    
    // Mantener la aplicación siempre visible
    setInterval(keepAlive, 30000); // Ping cada 30 segundos
}

function onSenderConnected(event) {
    console.log('📱 Dispositivo Android conectado:', event.senderId);
    isConnected = true;
    updateStatus('Dispositivo conectado');
    updateConnectionStatus('Android conectado');
}

function onSenderDisconnected(event) {
    console.log('📱 Dispositivo Android desconectado:', event.senderId);
    
    // Verificar si quedan dispositivos conectados
    const senders = context.getSenders();
    if (senders.length === 0) {
        isConnected = false;
        isMirroring = false;
        updateStatus('Receptor activo y listo');
        updateConnectionStatus('Activo en ChromeCast');
        showIdleScreen();
    }
}

function onLoadInterceptor(loadRequestData) {
    console.log('🔍 Interceptando request de carga:', loadRequestData);
    
    const media = loadRequestData.media;
    if (media) {
        console.log('📺 Media detectada:', {
            contentType: media.contentType,
            streamType: media.streamType,
            contentId: media.contentId
        });
        
        // Detectar screen mirroring por características del stream
        if (isScreenMirroring(media)) {
            console.log('🎬 Screen mirroring nativo detectado!');
            handleScreenMirroring(loadRequestData);
        }
    }
    
    return loadRequestData;
}

function onLoad(event) {
    console.log('📺 Cargando contenido:', event);
    const media = event.data.media;
    
    if (media && isScreenMirroring(media)) {
        console.log('🔄 Confirmando screen mirroring');
        startMirroring();
    }
}

function onMediaStatusChanged(event) {
    const mediaStatus = event.mediaStatus;
    if (!mediaStatus) return;
    
    const playerState = mediaStatus.playerState;
    console.log('🎮 Estado del player:', playerState);
    
    if (playerState === cast.framework.messages.PlayerState.PLAYING) {
        if (!isMirroring) {
            console.log('▶️ Reproducción iniciada - posible screen mirroring');
            startMirroring();
        }
    } else if (playerState === cast.framework.messages.PlayerState.IDLE) {
        if (isMirroring) {
            console.log('⏹️ Reproducción detenida');
            stopMirroring();
        }
    }
}

function isScreenMirroring(media) {
    // Detectar screen mirroring por características del contenido
    return (
        media.streamType === cast.framework.messages.StreamType.LIVE ||
        media.contentType === 'application/x-mpegURL' ||
        media.contentType === 'video/mp4' ||
        !media.duration || // Streams en vivo no tienen duración
        media.contentId.includes('mirror') ||
        media.contentId.includes('screen') ||
        media.contentId.includes('rtmp://') ||
        media.contentId.includes('udp://')
    );
}

function handleScreenMirroring(loadRequestData) {
    console.log('🎯 Configurando screen mirroring personalizado');
    
    // Personalizar metadatos
    const media = loadRequestData.media;
    if (media) {
        media.metadata = media.metadata || {};
        media.metadata.title = 'Mirror Cast';
        media.metadata.subtitle = 'Transmisión de pantalla en vivo';
        media.metadata.images = [{
            url: 'https://via.placeholder.com/480x270/4285F4/FFFFFF?text=Mirror+Cast'
        }];
    }
    
    startMirroring();
}

function startMirroring() {
    console.log('🎬 Iniciando screen mirroring');
    isMirroring = true;
    
    hideIdleScreen();
    showVideoContainer();
    updateStatus('📱 Transmitiendo pantalla desde Android');
    updateConnectionStatus('Screen mirroring activo');
}

function stopMirroring() {
    console.log('⏹️ Deteniendo screen mirroring');
    isMirroring = false;
    
    hideVideoContainer();
    showIdleScreen();
    updateStatus('Receptor activo y listo');
    updateConnectionStatus(isConnected ? 'Android conectado' : 'Activo en ChromeCast');
}

function showIdleScreen() {
    idleContent.classList.remove('hidden');
}

function hideIdleScreen() {
    idleContent.classList.add('hidden');
}

function showVideoContainer() {
    videoContainer.classList.remove('hidden');
}

function hideVideoContainer() {
    videoContainer.classList.add('hidden');
}

function updateStatus(status) {
    statusEl.textContent = status;
    console.log('📊 Status:', status);
}

function updateConnectionStatus(status) {
    connectionStatusEl.textContent = status;
}

function keepAlive() {
    // Mantener la aplicación activa para que aparezca en la lista de Android
    if (!isConnected && !isMirroring) {
        console.log('💓 Keep alive - Manteniendo receptor visible');
        updateConnectionStatus('Activo en ChromeCast');
    }
}

// Iniciar el receptor
context.start(options);

console.log('🚀 Mirror Cast configurado y listo para screen mirroring nativo'); 