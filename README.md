# 🎯 Mirror Cast

Una aplicación completa para ChromeCast que permite compartir dispositivos Android e iOS de forma nativa con funcionalidades avanzadas de personalización.

## ✨ Características

- **📱 Soporte Nativo**: Compartir pantalla desde Android e iOS usando los protocolos nativos del sistema
- **🎨 Personalización**: Cambiar nombres de dispositivos y pantallas de inicio personalizadas
- **🎬 Pantalla de Inicio**: Configurar videos o imágenes como fondo cuando no hay dispositivos conectados
- **🔄 Segundo Plano**: Funciona con la aplicación en segundo plano
- **🌐 Panel Web**: Dashboard web para configuración remota
- **⚡ Tiempo Real**: Actualizaciones en tiempo real del estado de conexión

## 🏗️ Estructura del Proyecto

```
Mirror_Cast/
├── index.html              # ChromeCast Receiver App
├── receiver.js             # JavaScript del receptor
├── android/                # Aplicación Android
│   ├── build.gradle
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/mirrorcast/android/
│   │   │   ├── MainActivity.kt
│   │   │   ├── utils/
│   │   │   └── services/
│   │   └── res/layout/
│   │       └── activity_main.xml
├── ios/                    # Aplicación iOS
│   ├── MirrorCast.xcodeproj/
│   └── MirrorCast/
│       ├── ViewController.swift
│       ├── AppDelegate.swift
│       └── Info.plist
├── web-dashboard/          # Panel de control web
│   ├── index.html
│   └── dashboard.js
└── README.md
```

## 🚀 Instalación y Configuración

### ChromeCast Receiver

1. **Subir el Receiver**: Sube los archivos `index.html` y `receiver.js` a un servidor web con HTTPS
2. **Registrar la App**: Ve a [Google Cast SDK Developer Console](https://cast.google.com/publish)
3. **Crear nueva aplicación**: 
   - Tipo: "Custom Receiver"
   - URL: Tu URL donde alojaste los archivos
   - Nombre: "Mirror Cast"
4. **Obtener App ID**: Guarda el Application ID generado

### Aplicación Android

1. **Configurar Android Studio**:
   ```bash
   cd android/
   # Actualizar el Application ID en build.gradle
   # Añadir tu Cast App ID en CastOptionsProvider.kt
   ```

2. **Dependencias**:
   ```gradle
   implementation 'com.google.android.gms:play-services-cast-framework:21.4.0'
   implementation 'androidx.mediarouter:mediarouter:1.6.0'
   ```

3. **Permisos requeridos**:
   - `INTERNET`
   - `ACCESS_NETWORK_STATE`
   - `ACCESS_WIFI_STATE`
   - `RECORD_AUDIO`
   - `FOREGROUND_SERVICE_MEDIA_PROJECTION` (Android 14+)

### Aplicación iOS

1. **Configurar Xcode**:
   ```bash
   cd ios/
   # Abrir MirrorCast.xcodeproj
   # Actualizar el Bundle Identifier
   # Añadir tu Cast App ID en ViewController.swift
   ```

2. **Frameworks requeridos**:
   - GoogleCast.framework
   - ReplayKit.framework

3. **Permisos**:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Para compartir pantalla</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>Para compartir audio</string>
   ```

### Panel Web (Opcional)

1. **Configurar Dashboard**:
   ```bash
   cd web-dashboard/
   # Actualizar YOUR_RECEIVER_APP_ID en dashboard.js
   # Servir desde un servidor web con HTTPS
   ```

## 📱 Uso

### Android

1. **Instalar la aplicación** en tu dispositivo Android
2. **Conectar al ChromeCast**:
   - Abre la app
   - Toca el botón Cast en el menú superior
   - Selecciona tu dispositivo ChromeCast
3. **Iniciar Mirror**:
   - Toca "Iniciar Mirror"
   - Acepta los permisos de captura de pantalla
   - Tu pantalla se mostrará en el ChromeCast

### iOS

1. **Instalar la aplicación** en tu dispositivo iOS
2. **Conectar al ChromeCast**:
   - Abre la app
   - Toca el botón Cast en la barra de navegación
   - Selecciona tu dispositivo ChromeCast
3. **Iniciar Mirror**:
   - Toca "Iniciar Mirror"
   - Acepta los permisos de grabación de pantalla
   - Tu pantalla se transmitirá al ChromeCast

### Configuración Avanzada

#### Cambiar Nombre del Dispositivo

**Desde las Apps Móviles**:
1. Ve a "Configuración Avanzada"
2. Cambia el "Nombre del dispositivo"
3. Guarda los cambios

**Desde el Dashboard Web**:
1. Abre el dashboard en tu navegador
2. Ve a "Configuración del Dispositivo"
3. Modifica el nombre y guarda

#### Configurar Pantalla de Inicio

**Video de Fondo**:
```javascript
// Desde el dashboard web
idleVideoUrl: "https://ejemplo.com/video.mp4"
backgroundType: "video"
```

**Imagen de Fondo**:
```javascript
// Desde el dashboard web
idleImageUrl: "https://ejemplo.com/imagen.jpg"
backgroundType: "image"
```

## 🛠️ Desarrollo

### Estructura del Código

#### ChromeCast Receiver (`receiver.js`)

```javascript
// Configuración inicial
let config = {
    deviceName: 'Mirror Cast',
    idleVideoUrl: '',
    backgroundType: 'gradient'
};

// Manejo de conexiones
context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, onSenderConnected);
context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, onSenderDisconnected);

// Mensajes personalizados
context.addCustomMessageListener('urn:x-cast:com.mirrorcast.config', onConfigMessage);
context.addCustomMessageListener('urn:x-cast:com.mirrorcast.mirror', onMirrorMessage);
```

#### Android (`MainActivity.kt`)

```kotlin
// Inicializar Cast
castContext = CastContext.getSharedInstance(this)
castManager = CastManager(this)

// Screen Mirroring
private fun startScreenMirror() {
    if (checkPermissions()) {
        requestScreenCapturePermission()
    }
}
```

#### iOS (`ViewController.swift`)

```swift
// Configurar Cast
sessionManager = GCKCastContext.sharedInstance().sessionManager

// Screen Recording
private func requestScreenMirroringPermission() {
    screenRecorder.startCapture { [weak self] (sampleBuffer, type, error) in
        self?.processSampleBuffer(sampleBuffer, type: type)
    }
}
```

### APIs y Protocolos

#### Mensajes del Receiver

```javascript
// Configuración
'urn:x-cast:com.mirrorcast.config'
{
    "deviceName": "TV Salon",
    "backgroundType": "video",
    "idleVideoUrl": "https://..."
}

// Control de Mirror
'urn:x-cast:com.mirrorcast.mirror'
{
    "action": "start_mirror",
    "streamUrl": "...",
    "mediaInfo": {...}
}

// Control del sistema
'urn:x-cast:com.mirrorcast.control'
{
    "action": "ping" | "get_status"
}
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# ChromeCast Receiver
CAST_APP_ID=your_app_id_here
RECEIVER_URL=https://your-domain.com/

# Android
PACKAGE_NAME=com.mirrorcast.android
MIN_SDK_VERSION=21
TARGET_SDK_VERSION=34

# iOS  
BUNDLE_ID=com.mirrorcast.ios
DEPLOYMENT_TARGET=12.0
```

### Personalización del UI

#### ChromeCast Receiver

```css
/* Personalizar el logo */
.logo {
    font-size: 4rem;
    color: #your-color;
}

/* Personalizar el fondo */
#idle-content {
    background: linear-gradient(135deg, #color1, #color2);
}
```

#### Android

```xml
<!-- Personalizar colores en colors.xml -->
<color name="colorPrimary">#667eea</color>
<color name="colorPrimaryDark">#764ba2</color>
<color name="colorAccent">#FF4081</color>
```

#### iOS

```swift
// Personalizar colores
castButton.tintColor = UIColor.systemBlue
startMirrorButton.backgroundColor = UIColor.systemBlue
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Android no encuentra dispositivos ChromeCast
```kotlin
// Verificar permisos de red
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

// Verificar configuración de Cast
val criteria = GCKDiscoveryCriteria(applicationID: "YOUR_APP_ID")
```

#### iOS no puede iniciar screen recording
```swift
// Verificar disponibilidad
if !screenRecorder.isAvailable {
    // Screen recording no disponible
}

// Verificar permisos
screenRecorder.startCapture { (sampleBuffer, type, error) in
    if let error = error {
        print("Error: \(error.localizedDescription)")
    }
}
```

#### ChromeCast no responde
```javascript
// Verificar configuración del receiver
const contextOptions = new cast.framework.CastReceiverOptions();
contextOptions.disableIdleTimeout = true;
context.start(contextOptions);
```

### Logs y Debugging

#### ChromeCast Receiver
```javascript
// Habilitar logs detallados
console.log('Receiver iniciado');
context.addEventListener('ready', () => {
    console.log('Context ready');
});
```

#### Android
```kotlin
// Logs de Cast
Log.d("MirrorCast", "Cast session started: ${session.sessionId}")

// Logs de Screen Recording
Log.d("ScreenMirror", "MediaProjection started")
```

#### iOS
```swift
// Logs de Cast
print("Cast session started: \(session.sessionID)")

// Logs de Screen Recording  
print("Screen recording started")
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas, puedes:

1. Abrir un [Issue](https://github.com/tu-usuario/mirror-cast/issues)
2. Consultar la [documentación](https://developers.google.com/cast)
3. Revisar los logs de debugging

## 🚀 Roadmap

- [ ] Soporte para múltiples dispositivos simultáneos
- [ ] Integración con servicios de streaming
- [ ] Grabación de sesiones
- [ ] Control por voz
- [ ] Soporte para Windows/macOS

---

**Mirror Cast** - Simplificando el screen mirroring para ChromeCast 🎯 

# 📱➡️📺 Mirror Cast - Solución Universal

**Compatible con Miracast Y Google Cast** - Funciona con cualquier Android

## 🎯 **¿Qué tipo de Android tienes?**

### **📱 Android solo Miracast (como Xiaomi)**
Tu dispositivo dice "Miracast" en Configuración → Pantalla → Transmitir
- ✅ **Solución**: Usar aplicación puente
- 🔗 **URL**: https://jgenovardine.github.io/mirror-cast-receiver/miracast-bridge.html

### **📱 Android con Google Cast**
Tu dispositivo muestra ChromeCast en la lista nativa
- ✅ **Solución**: Auto-launcher directo  
- 🔗 **URL**: https://jgenovardine.github.io/mirror-cast-receiver/auto-launcher.html

---

## 🚀 **Guía Rápida por Tipo de Dispositivo**

### **Tipo 1: Solo Miracast (Xiaomi, Huawei, etc.)**

1. **Abre el puente**: https://jgenovardine.github.io/mirror-cast-receiver/miracast-bridge.html
2. **Elige tu método**:
   - 🌐 **Captura Web**: Comparte pantalla desde navegador
   - 📱 **App Bridge**: Descargar AllCast o LocalCast  
   - ⚙️ **Habilitar Google Cast**: En configuración Android

### **Tipo 2: Google Cast Nativo**

1. **Auto-launcher**: https://jgenovardine.github.io/mirror-cast-receiver/auto-launcher.html
2. **Activar Mirror Cast** en ChromeCast
3. **Usar función nativa** de Android

---

## 📱 **Métodos de Conexión**

### **🌐 Método Web (Funciona en cualquier Android)**
```
1. Abrir: miracast-bridge.html en el navegador del móvil
2. Permitir captura de pantalla
3. Conectar con ChromeCast
4. ✅ Stream activo
```

### **📦 Método App (Recomendado para Miracast)**
**Apps compatibles:**
- **AllCast** - Bridge Miracast→Google Cast
- **LocalCast** - Soporte universal
- **Google Home** - Habilitar Google Cast
- **Screen Stream Mirroring** - Stream directo

### **⚙️ Método Nativo (Android con Google Cast)**
```
1. Activar auto-launcher
2. Android detecta "Mirror Cast" automáticamente  
3. Seleccionar en menú "Transmitir"
4. ✅ Screen mirroring directo
```

---

## 🔗 **URLs Disponibles**

| Función | URL | Para |
|---------|-----|------|
| **Puente Miracast** | `/miracast-bridge.html` | Android solo Miracast |
| **Auto Launcher** | `/auto-launcher.html` | Android con Google Cast |
| **Receptor Principal** | `/index.html` | ChromeCast |
| **PC Launcher** | `/launcher.html` | Control desde PC |
| **Móvil Optimizado** | `/mirror-connect.html` | Smartphones |

---

## 🛠️ **Resolución de Problemas**

### **❓ "No encuentro ChromeCast en mi lista"**
- Tu Android usa **solo Miracast**
- **Solución**: Usar puente en `miracast-bridge.html`

### **❓ "Aparece ChromeCast pero no Mirror Cast"**  
- Necesitas **activar el auto-launcher** primero
- **Solución**: Ir a `auto-launcher.html`

### **❓ "Error de permisos al capturar pantalla"**
- Navegador necesita **permisos de captura**
- **Solución**: Permitir cuando pregunte el navegador

### **❓ "ChromeCast no responde"**
- Verificar **misma red WiFi**  
- **Resetear** ChromeCast si es necesario

---

## 🎯 **Configuración Técnica**

### **Google Cast Application ID**: `499DD855`
### **Protocolos Soportados**: 
- ✅ Google Cast (Nativo)
- ✅ Miracast (Via Bridge)  
- ✅ WebRTC Screen Capture
- ✅ DLNA (Via Apps)

### **Compatibilidad**:
- 📱 **Android**: Cualquier versión (Miracast/Google Cast)
- 🌐 **Navegadores**: Chrome, Firefox, Edge (mobile)
- 📺 **Receptores**: ChromeCast, Android TV, Smart TV con Cast

---

## 🎬 **Demo y Pruebas**

1. **Test Miracast**: https://jgenovardine.github.io/mirror-cast-receiver/miracast-bridge.html
2. **Test Google Cast**: https://jgenovardine.github.io/mirror-cast-receiver/auto-launcher.html  
3. **Receptor**: https://jgenovardine.github.io/mirror-cast-receiver/

---

## 📞 **Soporte**

**¿Problemas?** Dime:
1. **Modelo de tu Android** (ej: Xiaomi Redmi)
2. **Qué ves en Configuración → Transmitir** (Miracast/Google Cast)
3. **Error específico** que aparece

**Mirror Cast funciona con CUALQUIER Android** - solo necesitas el método correcto 🎯 