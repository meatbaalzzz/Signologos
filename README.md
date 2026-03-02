<h1 align="center">Signologos</h1>

<p align="center">
  <img src="logo.png" width="200" />
</p>


La palabra hecha signo, **Signologos** es un traductor web **potenciado con IA** que tiene como objetivo mejorar la comunicación entre personas a través de un **lenguaje universal** como lo es el lenguaje de signos.

<p align="center">
  <img src="https://img.shields.io/github/last-commit/meatbaalzzz/signologos" />
  <img src="https://img.shields.io/badge/typescript-83.7%25-blue" />
  <img src="https://img.shields.io/badge/languages-4-brightgreen" />
</p>

---


  *Construido con*
  <p align="center">

![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Autoprefixer](https://img.shields.io/badge/Autoprefixer-DD3735?style=for-the-badge&logo=autoprefixer&logoColor=white)
![PostCSS](https://img.shields.io/badge/PostCSS-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Cypress](https://img.shields.io/badge/Cypress-17202C?style=for-the-badge&logo=cypress&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

</p>

## 🚀 Características Principales

- **Videollamadas WebRTC**: Comunicación en tiempo real entre dos usuarios
- **Traducción de Señas a Texto**: CNN InceptionV3 entrenado con dataset ASL
- **Reconocimiento de Voz**: Vosk API para convertir voz a texto
- **Síntesis de Voz**: Text-to-Speech para pronunciar traducciones
- **Roles Diferenciados**: Usuario que habla vs usuario que usa señas
- **Interfaz Futurista**: Diseño oscuro con animaciones GSAP
- **Sin Autenticación**: Acceso directo y simple

## 📋 Requisitos Previos

- Python 3.8+
- Node.js 16+ (opcional, para desarrollo)
- Cámara web y micrófono
- Navegador moderno con soporte WebRTC

## 🛠️ Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/signologos.git
cd signologos
```

### 2. Instalar Dependencias de Python

```bash
# Crear entorno virtual (recomendado)
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Descargar Modelo Vosk

```bash
# Descargar modelo pequeño de Vosk
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip -d models/
rm vosk-model-small-en-us-0.15.zip
```

### 4. Preparar Dataset de Señas

El proyecto ya incluye el dataset ASL en `dataset/asl_alphabet_train/`. 
Para entrenar el modelo desde cero:

```bash
# El modelo se entrenará automáticamente al iniciar
# o puedes ejecutar el script de entrenamiento manualmente
python src/train_sign_model.py
```

## 🚀 Ejecutar la Aplicación

### Opción 1: Ejecutar Directamente

```bash
# Iniciar servidor
python main.py

# La aplicación estará disponible en:
# http://localhost:8000
```

### Opción 2: Con Auto-reload (Desarrollo)

```bash
# Ejecutar con recarga automática
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📖 Cómo Usar

### 1. Crear una Reunión

1. Abre http://localhost:8000 en tu navegador
2. Haz clic en "Crear Reunión"
3. Se generará un código único de 8 caracteres
4. Comparte el código con la otra persona

### 2. Unirse a una Reunión

1. Abre http://localhost:8000
2. Haz clic en "Unirse a Reunión"
3. Ingresa el código de reunión
4. Haz clic en "Continuar"

### 3. Seleccionar Rol

**Usuario que Habla (Lenguaje Natural):**
- Usa tu voz normalmente
- El sistema convertirá tu voz a texto
- El texto aparecerá en el panel lateral

**Usuario de Señas (Lenguaje de Señas):**
- Coloca tus manos frente a la cámara
- El sistema detectará las letras del alfabeto ASL
- Las letras se convertirán en palabras y luego a voz

### 4. Controles Durante la Videollamada

- **Micrófono**: Activar/desactivar audio
- **Cámara**: Activar/desactivar video
- **Compartir Pantalla**: Compartir tu pantalla (opcional)
- **Salir**: Finalizar la llamada

## 🏗️ Arquitectura Técnica

### Backend (Python/FastAPI)
- **FastAPI**: Framework web moderno y rápido
- **WebSockets**: Señalización en tiempo real
- **TensorFlow**: Modelo CNN InceptionV3 para señas
- **Vosk**: Reconocimiento de voz offline
- **OpenCV**: Procesamiento de imágenes

### Frontend (JavaScript/HTML/CSS)
- **WebRTC**: Comunicación peer-to-peer
- **Web Speech API**: Reconocimiento y síntesis de voz
- **GSAP**: Animaciones fluidas y futuristas
- **Canvas API**: Captura y procesamiento de video

### Flujo de Datos

```
Usuario Señas → Cámara → Frame → CNN → Letra → Texto → Voz → Usuario Habla
Usuario Habla → Micrófono → Vosk → Texto → UI → Usuario Señas
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
# Puerto del servidor
PORT=8000

# Configuración de modelos
SIGN_MODEL_PATH=models/sign_language_model.h5
VOICE_MODEL_PATH=models/vosk-model-small-en-us-0.15

# Configuración de WebRTC
STUN_SERVER=stun:stun.l.google.com:19302

# Configuración de procesamiento
SIGN_DETECTION_INTERVAL=100
VOICE_SILENCE_THRESHOLD=2000
SEQUENCE_TIMEOUT=2000
```

### Entrenar Modelo de Señas

```bash
# Script de entrenamiento incluido
python src/train_sign_model.py \
  --data_path dataset/asl_alphabet_train/ \
  --epochs 50 \
  --batch_size 32 \
  --learning_rate 0.001
```

### Optimizar para Producción

```bash
# Usar Uvicorn con workers para producción
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000

# O usar Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🐛 Solución de Problemas

### Error: "No se puede acceder a la cámara"
- Asegúrate de dar permisos de cámara al navegador
- Verifica que no haya otra aplicación usando la cámara
- Prueba con un navegador diferente

### Error: "Modelo Vosk no encontrado"
- Descarga el modelo manualmente desde: https://alphacephei.com/vosk/models
- Extrae en la carpeta `models/`

### Error: "WebRTC no conecta"
- Verifica tu conexión a internet
- Prueba desactivando el firewall temporalmente
- Usa un servidor STUN/TURN diferente

### Rendimiento Lento
- Reduce la resolución del video en `webrtc.js`
- Aumenta el intervalo de detección de señas
- Usa un modelo Vosk más pequeño

## 📝 Notas de Desarrollo

### Estructura de Carpetas

```
signologos/
├── main.py                 # Servidor FastAPI principal
├── requirements.txt        # Dependencias Python
├── src/                    # Código fuente backend
│   ├── models/            # Modelos de IA
│   └── utils/             # Utilidades
├── static/                 # Archivos frontend
│   ├── css/               # Estilos
│   ├── js/                # JavaScript
│   └── index.html         # Página principal
├── dataset/                # Dataset ASL
└── models/                 # Modelos entrenados
```

### API Endpoints

- `GET /` - Página principal
- `POST /api/create-room` - Crear nueva sala
- `GET /api/room/{room_id}/info` - Información de sala
- `WS /ws/{room_id}/{user_id}` - WebSocket para señalización

### Mensajes WebSocket

```javascript
// Oferta WebRTC
{type: "webrtc_offer", offer: RTCSessionDescription, target_user_id: string}

// Respuesta WebRTC
{type: "webrtc_answer", answer: RTCSessionDescription, target_user_id: string}

// Candidato ICE
{type: "webrtc_ice_candidate", candidate: RTCIceCandidate, target_user_id: string}

// Frame de señas
{type: "sign_frame", frame_data: base64}

// Audio de voz
{type: "voice_audio", audio_data: base64}

// Traducción de señas
{type: "sign_translation", user_id: string, letter: string}

// Traducción de voz
{type: "voice_translation", user_id: string, text: string}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un issue con:
- Descripción detallada del problema
- Pasos para reproducir
- Navegador y sistema operativo
- Capturas de pantalla si es posible

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Dataset ASL: [Kaggle ASL Alphabet](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)
- Vosk API: [Alphacephei](https://alphacephei.com/vosk/)
- GSAP: [GreenSock](https://greensock.com/gsap/)
- WebRTC: [WebRTC.org](https://webrtc.org/)

## 📞 Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter) - email@ejemplo.com

Link del Proyecto: [https://github.com/tu-usuario/signologos](https://github.com/tu-usuario/signologos)

---

**Nota**: Este es un prototipo funcional. Para producción, considera:
- Implementar autenticación
- Agregar servidor TURN para WebRTC
- Optimizar modelos de IA
- Implementar cifrado end-to-end
- Agregar tests automatizados
- Configurar CI/CD
