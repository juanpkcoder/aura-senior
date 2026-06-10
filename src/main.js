import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  obtenerUsuarioActivo,
  agregarRecuerdoAlUsuarioActivo,
  eliminarRecuerdoDelUsuarioActivo
} from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos de la UI de las pantallas
  const uiOverlay = document.getElementById('ui-overlay');
  const arScene = document.getElementById('ar-scene');
  const bgMusic = document.getElementById('bg-music');
  const exitArBtn = document.getElementById('exit-ar-btn');

  // Pantallas
  const screenWelcome = document.getElementById('screen-welcome');
  const screenRegister = document.getElementById('screen-register');
  const screenRegSuccess = document.getElementById('screen-reg-success');
  const screenScanner = document.getElementById('screen-scanner');
  const screenDashboard = document.getElementById('screen-dashboard');

  // Botones de Navegación
  const btnGoToScan = document.getElementById('btn-go-to-scan');
  const btnGoToRegister = document.getElementById('btn-go-to-register');
  const btnScannerBack = document.getElementById('btn-scanner-back');
  const btnSuccessContinue = document.getElementById('btn-success-continue');
  const btnLogout = document.getElementById('btn-logout');
  const startBtn = document.getElementById('start-btn'); // Botón AR en el Dashboard

  // Formularios e Inputs
  const registerForm = document.getElementById('register-form');
  const regName = document.getElementById('reg-name');
  const regLastname = document.getElementById('reg-lastname');
  const regAge = document.getElementById('reg-age');
  const regQrCodeContainer = document.getElementById('reg-qr-code');
  const regUserInfo = document.getElementById('reg-user-info');
  const btnDownloadQr = document.getElementById('btn-download-qr');

  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const btnSelectFile = document.getElementById('btn-select-file');
  const fileStatusText = document.getElementById('file-status-text');
  const imgTitle = document.getElementById('img-title');
  const memoriesGallery = document.getElementById('memories-gallery');
  const galleryTitle = document.getElementById('gallery-title');

  // Estado del escáner y cámara AR
  let qrScanner = null;
  let activeQrDataUrl = null; // Para descargar el código QR
  let cameraStream = null; // Flujo de video para el fondo AR

  // --- 1. ENRUTADOR DE PANTALLAS ---
  function showScreen(screenId) {
    const screens = [screenWelcome, screenRegister, screenRegSuccess, screenScanner, screenDashboard];
    screens.forEach(screen => {
      if (screen) {
        screen.classList.remove('active');
        screen.classList.add('hidden');
      }
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
  }

  // --- 2. CARGA DE ARCHIVOS E IMÁGENES ---
  let selectedFileBase64 = null;

  btnSelectFile.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }
      
      // Mostrar estado de carga y cambiar estilo
      fileStatusText.textContent = "Procesando imagen...";
      btnSelectFile.classList.add('file-selected');

      resizeAndCompressImage(file)
        .then(base64 => {
          selectedFileBase64 = base64;
          fileStatusText.textContent = `✓ Foto seleccionada: ${file.name.substring(0, 15)}...`;
        })
        .catch(err => {
          console.error(err);
          alert('Hubo un error al procesar la imagen.');
          resetFileInput();
        });
    }
  });

  function resetFileInput() {
    fileInput.value = '';
    selectedFileBase64 = null;
    fileStatusText.textContent = "Seleccionar foto de mi galería";
    btnSelectFile.classList.remove('file-selected');
  }

  // Redimensionar y comprimir la imagen en un Canvas (optimización para LocalStorage)
  function resizeAndCompressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resolución amigable y rápida de cargar
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG con calidad 0.7 (excelente balance peso/calidad)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Guardar un nuevo recuerdo
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedFileBase64) {
      alert('Por favor, selecciona una foto primero pulsando en el botón blanco.');
      return;
    }
    const titulo = imgTitle.value.trim() || 'Mi Recuerdo';
    
    const nuevoRecuerdo = agregarRecuerdoAlUsuarioActivo(selectedFileBase64, titulo);
    if (nuevoRecuerdo) {
      // Limpiar formulario
      imgTitle.value = '';
      resetFileInput();

      // Recargar dashboard y actualizar escena de AR
      const user = obtenerUsuarioActivo();
      loadDashboard(user);
      actualizarEscenaAR(user);
    } else {
      alert('Error: Inicia sesión de nuevo para agregar recuerdos.');
      showScreen('screen-welcome');
    }
  });

  // --- 3. INICIO DE SESIÓN Y CARGA DE DASHBOARD ---
  function loadDashboard(user) {
    if (!user) return;
    
    // Saludo
    document.getElementById('dash-welcome').textContent = `¡Hola, ${user.nombre}!`;
    
    // Contar recuerdos
    galleryTitle.textContent = `🖼️ Mis Fotos Guardadas (${user.recuerdos.length})`;

    if (user.recuerdos.length === 0) {
      memoriesGallery.innerHTML = `
        <div class="empty-gallery-msg">
          Aún no has agregado fotos. ¡Presiona el botón de arriba para añadir tu primer recuerdo!
        </div>
      `;
    } else {
      memoriesGallery.innerHTML = '';
      user.recuerdos.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
          <button class="delete-memory-btn" data-id="${rec.id}" title="Eliminar este recuerdo">✕</button>
          <img src="${rec.imagen}" class="memory-card-img" alt="${rec.titulo}">
          <div class="memory-card-info">
            <span class="memory-card-title">${rec.titulo}</span>
            <span class="memory-card-date">${rec.fecha}</span>
          </div>
        `;

        // Acción de eliminar
        card.querySelector('.delete-memory-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          // Diálogo adaptado y claro
          if (confirm(`¿Estás seguro de que quieres borrar la foto "${rec.titulo}"?`)) {
            eliminarRecuerdoDelUsuarioActivo(rec.id);
            const u = obtenerUsuarioActivo();
            loadDashboard(u);
            actualizarEscenaAR(u);
          }
        });

        memoriesGallery.appendChild(card);
      });
    }
  }

  // Cerrar sesión
  btnLogout.addEventListener('click', () => {
    cerrarSesion();
    showScreen('screen-welcome');
  });

  // --- 4. REGISTRO DE USUARIOS Y GENERACIÓN DE QR ---
  registerForm.addEventListener('submit', () => {
    const nombre = regName.value;
    const apellido = regLastname.value;
    const edad = regAge.value;

    const nuevoUsuario = registrarUsuario(nombre, apellido, edad);
    if (nuevoUsuario) {
      // Limpiar formulario
      regName.value = '';
      regLastname.value = '';
      regAge.value = '';

      // Generar código QR
      regQrCodeContainer.innerHTML = ''; // Limpiar previo
      regUserInfo.textContent = `${nuevoUsuario.nombre} ${nuevoUsuario.apellido}`;

      // Generamos el QR codificando el ID del usuario
      QRCode.toDataURL(nuevoUsuario.id, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0A369D',  // Color azul oscuro de nuestra paleta
          light: '#FFFFFF'
        }
      })
      .then(url => {
        activeQrDataUrl = url;
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Código QR para ingresar de ${nuevoUsuario.nombre}`;
        regQrCodeContainer.appendChild(img);

        // Configurar botón de descarga
        btnDownloadQr.onclick = () => {
          const link = document.createElement('a');
          link.download = `Acceso_QR_${nuevoUsuario.nombre}.png`;
          link.href = url;
          link.click();
        };

        // Mostrar pantalla de éxito
        showScreen('screen-reg-success');
      })
      .catch(err => {
        console.error(err);
        alert('Error al generar tu código QR. Pero la cuenta fue creada.');
        iniciarSesion(nuevoUsuario.id);
        const user = obtenerUsuarioActivo();
        loadDashboard(user);
        actualizarEscenaAR(user);
        showScreen('screen-dashboard');
      });
    }
  });

  btnSuccessContinue.addEventListener('click', () => {
    const usuarios = JSON.parse(localStorage.getItem('recuerdos_ar_usuarios') || '[]');
    // Tomar el último usuario creado
    if (usuarios.length > 0) {
      const ultimo = usuarios[usuarios.length - 1];
      iniciarSesion(ultimo.id);
      const user = obtenerUsuarioActivo();
      loadDashboard(user);
      actualizarEscenaAR(user);
      showScreen('screen-dashboard');
    } else {
      showScreen('screen-welcome');
    }
  });

  // --- 5. ESCÁNER DE CÓDIGO QR ---
  btnGoToScan.addEventListener('click', () => {
    showScreen('screen-scanner');
    iniciarEscaneoQR();
  });

  btnScannerBack.addEventListener('click', () => {
    detenerEscaneoQR().then(() => {
      showScreen('screen-welcome');
    });
  });

  // Updated QR scanner init with fallback handling
function iniciarEscaneoQR() {
  const statusText = document.getElementById('scanner-status');
  statusText.textContent = "Buscando cámara...";

  qrScanner = new Html5Qrcode("qr-reader");

  const startOptions = { facingMode: "environment" };

  qrScanner.start(
    startOptions,
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    (qrMessage) => {
      const user = iniciarSesion(qrMessage);
      if (user) {
        statusText.textContent = `¡Código reconocido! Bienvenido ${user.nombre}...`;
        statusText.style.color = '#4ade80';
        detenerEscaneoQR().then(() => {
          setTimeout(() => {
            loadDashboard(user);
            actualizarEscenaAR(user);
            showScreen('screen-dashboard');
            statusText.style.color = 'white';
          }, 800);
        });
      } else {
        statusText.textContent = "El código escaneado no pertenece a ningún usuario.";
        statusText.style.color = '#ef4444';
        setTimeout(() => {
          statusText.textContent = "Centra tu código QR frente a la cámara.";
          statusText.style.color = 'white';
        }, 3000);
      }
    },
    (errorMessage) => {
      // Ignorar errores de escaneo normales
    }
  ).catch(err => {
    console.error(err);
    // Fallback: intentar cámara sin "environment" o informar al usuario
    statusText.textContent = "No se pudo acceder a la cámara trasera. Intentando cámara predeterminada...";
    qrScanner.start({ videoConstraints: {} }, { fps: 10, qrbox: { width: 250, height: 250 } })
      .catch(err2 => {
        console.error('Fallback error:', err2);
        statusText.textContent = "Error al iniciar cámara. Por favor, sube una foto manualmente.";
      });
  });
}

// Remove rotation animation from AR memories container (fixed spatial point)
// Update index.html: <a-entity id="memories-container" position="0 1.6 -2">
// In actualizarEscenaAR, fix entity rotation to zero
function actualizarEscenaAR(user) {
  const container = document.getElementById('memories-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  const recuerdos = user && user.recuerdos && user.recuerdos.length > 0
    ? user.recuerdos
    : obtenerRecuerdosPorDefecto();

  recuerdos.forEach((rec, index) => {
    const total = recuerdos.length;
    const maxRange = 90;
    const angle = total === 1 ? 0 : ((index / (total - 1)) - 0.5) * maxRange;
    const angleRad = (angle * Math.PI) / 180;
    const radius = 2.3;
    const x = radius * Math.sin(angleRad);
    const z = -radius * Math.cos(angleRad);
    const y = (index % 2 === 0 ? 0.15 : -0.15) + (index * 0.02);

    const memoryEntity = document.createElement('a-entity');
    memoryEntity.setAttribute('position', `${x} ${y} ${z}`);
    // Fixed orientation (no rotation towards camera)
    memoryEntity.setAttribute('rotation', `0 0 0`);

    // ... rest of entity creation unchanged ...
    const targetY = y + 0.12;
    const animDuration = 3000 + (index * 300);
    memoryEntity.setAttribute('animation', `
      property: position; 
      dir: alternate; 
      dur: ${animDuration}; 
      to: ${x} ${targetY} ${z}; 
      loop: true; 
      easing: easeInOutSine
    `);
    // Photo plane
    const photoPlane = document.createElement('a-plane');
    photoPlane.setAttribute('src', rec.imagen);
    photoPlane.setAttribute('width', '1.1');
    photoPlane.setAttribute('height', '0.85');
    photoPlane.setAttribute('position', '0 0.1 0.01');
    photoPlane.setAttribute('material', 'shader: flat; side: double;');
    // Frame
    const framePlane = document.createElement('a-plane');
    framePlane.setAttribute('color', '#ffffff');
    framePlane.setAttribute('width', '1.2');
    framePlane.setAttribute('height', '1.2');
    framePlane.setAttribute('position', '0 -0.05 0');
    framePlane.setAttribute('material', 'side: double;');
    // Label
    const labelText = document.createElement('a-text');
    labelText.setAttribute('value', rec.titulo);
    labelText.setAttribute('color', '#0A369D');
    labelText.setAttribute('align', 'center');
    labelText.setAttribute('width', '1.6');
    labelText.setAttribute('position', '0 -0.45 0.02');
    labelText.setAttribute('font', 'kashida');
    memoryEntity.appendChild(photoPlane);
    memoryEntity.appendChild(framePlane);
    memoryEntity.appendChild(labelText);
    container.appendChild(memoryEntity);
  });
}

  function detenerEscaneoQR() {
    if (qrScanner && qrScanner.isScanning) {
      return qrScanner.stop().then(() => {
        qrScanner = null;
      }).catch(err => {
        console.error("Error al apagar el escáner:", err);
      });
    }
    return Promise.resolve();
  }

  // --- 6. FLUX INTEGRADO DE REALIDAD AUMENTADA (A-FRAME) ---
  function obtenerRecuerdosPorDefecto() {
    return [
      {
        id: 'def_1',
        imagen: '/assets/memory1.png',
        titulo: 'Mis Recuerdos (Foto de ejemplo 1)',
        fecha: '2026'
      },
      {
        id: 'def_2',
        imagen: '/assets/memory2.png',
        titulo: 'Mis Recuerdos (Foto de ejemplo 2)',
        fecha: '2026'
      }
    ];
  }

  function actualizarEscenaAR(user) {
    const container = document.getElementById('memories-container');
    if (!container) return;

    // Limpiar contenedor 3D actual
    container.innerHTML = '';

    const recuerdos = user && user.recuerdos && user.recuerdos.length > 0
      ? user.recuerdos
      : obtenerRecuerdosPorDefecto();

    // Organizar los recuerdos en un semicírculo/abanico en frente
    recuerdos.forEach((rec, index) => {
      const total = recuerdos.length;
      
      // Ángulo en grados. Si es 1, centrado (0).
      // Si son varios, repartidos en un rango de 90 grados en frente
      const maxRange = 90;
      const angle = total === 1 ? 0 : ((index / (total - 1)) - 0.5) * maxRange;
      const angleRad = (angle * Math.PI) / 180;

      // Distancia (Radio) al usuario
      const radius = 2.3;
      const x = radius * Math.sin(angleRad);
      const z = -radius * Math.cos(angleRad);
      
      // Altura del plano (se alterna levemente para que no se traslapen y sea dinámico)
      const y = (index % 2 === 0 ? 0.15 : -0.15) + (index * 0.02);

      // Rotación orientada hacia el jugador en el centro
      const rotY = -angle;

      // Entidad de A-Frame para agrupar el cuadro, imagen y descripción
      const memoryEntity = document.createElement('a-entity');
      memoryEntity.setAttribute('position', `${x} ${y} ${z}`);
              memoryEntity.setAttribute('rotation', `0 0 0`);

      // Micro-animación suave de flotación
      const targetY = y + 0.12;
      const animDuration = 3000 + (index * 300);
      memoryEntity.setAttribute('animation', `
        property: position; 
        dir: alternate; 
        dur: ${animDuration}; 
        to: ${x} ${targetY} ${z}; 
        loop: true; 
        easing: easeInOutSine
      `);

      // 1. Plano de la Foto
      const photoPlane = document.createElement('a-plane');
      photoPlane.setAttribute('src', rec.imagen);
      photoPlane.setAttribute('width', '1.1');
      photoPlane.setAttribute('height', '0.85');
      photoPlane.setAttribute('position', '0 0.1 0.01');
      photoPlane.setAttribute('material', 'shader: flat; side: double;');

      // 2. Marco de la Foto (Blanco clásico de marco fotográfico)
      const framePlane = document.createElement('a-plane');
      framePlane.setAttribute('color', '#ffffff');
      framePlane.setAttribute('width', '1.2');
      framePlane.setAttribute('height', '1.2');
      framePlane.setAttribute('position', '0 -0.05 0');
      framePlane.setAttribute('material', 'side: double;');

      // 3. Etiqueta de Texto con el Título del Recuerdo (Accesible, abajo de la foto)
      const labelText = document.createElement('a-text');
      labelText.setAttribute('value', rec.titulo);
      labelText.setAttribute('color', '#0A369D'); // Azul primario para coherencia
      labelText.setAttribute('align', 'center');
      labelText.setAttribute('width', '1.6');
      labelText.setAttribute('position', '0 -0.45 0.02');
      labelText.setAttribute('font', 'kashida'); // Un font predeterminado legible de A-Frame

      // Ensamblar
      memoryEntity.appendChild(photoPlane);
      memoryEntity.appendChild(framePlane);
      memoryEntity.appendChild(labelText);

      container.appendChild(memoryEntity);
    });
  }

  // --- 7. CONTROL DE INGRESO Y SALIDA DE AR ---

  // Solicitar permiso de cámara con múltiples intentos y feedback visible
  async function startCameraAR() {
    const videoBg = document.getElementById('ar-video-background');
    if (!videoBg) return false;

    // Verificar que la API de cámara esté disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback para navegadores antiguos o contextos inseguros (HTTP)
      if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
        return new Promise((resolve) => {
          const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          getUserMedia.call(navigator,
            { video: { facingMode: 'environment' }, audio: false },
            (stream) => {
              cameraStream = stream;
              videoBg.srcObject = stream;
              videoBg.classList.remove('hidden');
              document.body.classList.add('ar-active');
              resolve(true);
            },
            (err) => {
              console.warn('Cámara no disponible (legacy API):', err);
              alert('No se pudo acceder a la cámara.\n\nSi estás en un celular, intenta:\n1. Abrir la app desde Chrome\n2. Permitir el acceso a la cámara cuando se solicite\n3. Verificar que ninguna otra app esté usando la cámara');
              resolve(false);
            }
          );
        });
      }

      alert('Tu navegador no soporta acceso a la cámara en este modo.\n\nIntenta:\n1. Usar Google Chrome\n2. Si estás en un celular, abre esta página directamente en Chrome');
      return false;
    }

    // Intento 1: cámara trasera (environment)
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      videoBg.srcObject = cameraStream;
      videoBg.classList.remove('hidden');
      document.body.classList.add('ar-active');
      return true;
    } catch (err1) {
      console.warn('Cámara trasera no disponible, intentando cualquier cámara...', err1);
    }

    // Intento 2: cualquier cámara disponible
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      videoBg.srcObject = cameraStream;
      videoBg.classList.remove('hidden');
      document.body.classList.add('ar-active');
      return true;
    } catch (err2) {
      console.warn('Ninguna cámara disponible:', err2);

      let mensaje = 'No se pudo abrir la cámara.\n\n';
      if (err2.name === 'NotAllowedError') {
        mensaje += 'Parece que el permiso de cámara fue denegado.\nPor favor, permite el acceso a la cámara en los ajustes de tu navegador e intenta de nuevo.';
      } else if (err2.name === 'NotFoundError') {
        mensaje += 'No se encontró ninguna cámara en este dispositivo.';
      } else if (err2.name === 'NotReadableError') {
        mensaje += 'La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo.';
      } else {
        mensaje += 'Asegúrate de:\n1. Permitir el acceso a la cámara\n2. Usar Google Chrome\n3. Que ninguna otra app esté usando la cámara';
      }
      alert(mensaje);
      return false;
    }
  }

  function stopCameraAR() {
    const videoBg = document.getElementById('ar-video-background');
    if (videoBg) {
      videoBg.classList.add('hidden');
      videoBg.srcObject = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    document.body.classList.remove('ar-active');
  }

  async function enterARMode() {
    // Solicitar cámara ANTES de ocultar la UI (para que el usuario vea el prompt de permiso)
    const cameraOk = await startCameraAR();

    if (!cameraOk) {
      // Si la cámara falló, no entramos al modo AR
      return;
    }

    // Cámara obtenida con éxito → entrar al modo AR
    uiOverlay.classList.add('hidden');
    exitArBtn.classList.remove('hidden');

    if (bgMusic) {
      bgMusic.volume = 0.4;
      bgMusic.play().catch(err => console.warn('Audio falló:', err));
    }

    if (arScene && arScene.sceneEl) {
      if (navigator.xr) {
        arScene.sceneEl.enterVR();
      }
    }
  }

  function exitARMode() {
    exitArBtn.classList.add('hidden');
    uiOverlay.classList.remove('hidden');
    
    // Detener la cámara de fondo
    stopCameraAR();

    if (bgMusic) {
      bgMusic.pause();
    }

    if (arScene && arScene.sceneEl && arScene.sceneEl.is('vr-mode')) {
      arScene.sceneEl.exitVR();
    }
  }

  // Vinculación de eventos de A-Frame para inicio y salida nativos
  if (arScene) {
    arScene.addEventListener('enter-vr', () => {
      console.log('Modo AR Iniciado');
      uiOverlay.classList.add('hidden');
      exitArBtn.classList.remove('hidden');
    });

    arScene.addEventListener('exit-vr', () => {
      console.log('Modo AR Terminado');
      exitARMode();
    });
  }

  // Vinculación de clics
  startBtn.addEventListener('click', enterARMode);
  exitArBtn.addEventListener('click', exitARMode);

  // --- 8. ARRANCAR AL CARGAR ---
  const activeUser = obtenerUsuarioActivo();
  if (activeUser) {
    loadDashboard(activeUser);
    actualizarEscenaAR(activeUser);
    showScreen('screen-dashboard');
  } else {
    actualizarEscenaAR(null); // Renderizar por defecto en el fondo
    showScreen('screen-welcome');
  }

  // Enlazar los botones para retroceder genéricos
  document.querySelectorAll('.back-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetScreen = btn.getAttribute('data-target');
      showScreen(targetScreen);
    });
  });

  btnGoToRegister.addEventListener('click', () => {
    showScreen('screen-register');
  });

});
