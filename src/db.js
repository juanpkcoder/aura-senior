// Manejador de Base de Datos Local en LocalStorage para Recuerdos AR

const USERS_KEY = 'recuerdos_ar_usuarios';
const ACTIVE_USER_KEY = 'recuerdos_ar_usuario_activo';

// Obtener la lista completa de usuarios
export function obtenerUsuarios() {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

// Guardar la lista de usuarios
function guardarUsuarios(usuarios) {
  localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
}

// Registrar un nuevo usuario
export function registrarUsuario(nombre, apellido, edad, genero = '') {
  const usuarios = obtenerUsuarios();
  
  // Generar ID único
  const id = 'usr_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  
  const nuevoUsuario = {
    id,
    nombre: nombre.trim(),
    apellido: apellido ? apellido.trim() : '',
    edad: parseInt(edad, 10),
    genero: genero,
    fechaRegistro: new Date().toLocaleDateString(),
    recuerdos: [] // Lista de imágenes/recuerdos
  };
  
  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);
  
  return nuevoUsuario;
}

// Obtener un usuario por su ID (contenido en el código QR)
export function obtenerUsuarioPorId(id) {
  const usuarios = obtenerUsuarios();
  return usuarios.find(u => u.id === id) || null;
}

// Guardar/actualizar datos de un usuario existente
export function actualizarUsuario(usuarioActualizado) {
  const usuarios = obtenerUsuarios();
  const index = usuarios.findIndex(u => u.id === usuarioActualizado.id);
  if (index !== -1) {
    usuarios[index] = usuarioActualizado;
    guardarUsuarios(usuarios);
    
    // Si es el usuario activo actual, también actualizamos su sesión activa
    const activo = obtenerUsuarioActivo();
    if (activo && activo.id === usuarioActualizado.id) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(usuarioActualizado));
    }
    return true;
  }
  return false;
}

// Iniciar sesión (establecer usuario activo)
export function iniciarSesion(id) {
  const usuario = obtenerUsuarioPorId(id);
  if (usuario) {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(usuario));
    return usuario;
  }
  return null;
}

// Cerrar sesión
export function cerrarSesion() {
  localStorage.removeItem(ACTIVE_USER_KEY);
}

// Obtener el usuario activo actual
export function obtenerUsuarioActivo() {
  const activeJson = localStorage.getItem(ACTIVE_USER_KEY);
  if (!activeJson) return null;
  
  // Para estar seguros de tener los datos sincronizados, los jalamos por ID de la base principal
  const parsed = JSON.parse(activeJson);
  const sincronizado = obtenerUsuarioPorId(parsed.id);
  if (sincronizado) {
    return sincronizado;
  }
  return parsed;
}

// Agregar una nueva imagen/recuerdo al usuario activo
export function agregarRecuerdoAlUsuarioActivo(imagenBase64, titulo) {
  const usuario = obtenerUsuarioActivo();
  if (!usuario) return null;
  
  const nuevoRecuerdo = {
    id: 'rec_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
    imagen: imagenBase64,
    titulo: titulo.trim() || 'Recuerdo',
    fecha: new Date().toLocaleDateString()
  };
  
  usuario.recuerdos.unshift(nuevoRecuerdo); // Insertar al inicio para que se vea de primero
  actualizarUsuario(usuario);
  
  return nuevoRecuerdo;
}

// Eliminar un recuerdo del usuario activo
export function eliminarRecuerdoDelUsuarioActivo(recuerdoId) {
  const usuario = obtenerUsuarioActivo();
  if (!usuario) return false;
  
  const longitudOriginal = usuario.recuerdos.length;
  usuario.recuerdos = usuario.recuerdos.filter(r => r.id !== recuerdoId);
  
  if (usuario.recuerdos.length !== longitudOriginal) {
    actualizarUsuario(usuario);
    return true;
  }
  return false;
}
