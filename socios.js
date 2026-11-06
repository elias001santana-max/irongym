// ========== ELEMENTOS DEL DOM ==========
// Variables para almacenar las referencias a los elementos del DOM
let loginForm = null;
let socioForm = null;
let panel = null;
let tabla = null;
let cerrarSesion = null;

// Elementos innovación
let inputBusqueda = null;
let contadorTotal = null;
let contadorVigentes = null;
let contadorVencidos = null;
let btnExportar = null;

// Clave para persistencia local
const STORAGE_KEY = "iron_gym_lista_socios";

// ========== SIMULACIÓN (ESPACIO PARA PHP: SOLO COMENTARIO) ==========
/*
AQUÍ IRÍA LA CONEXIÓN CON PHP (NO IMPLEMENTAMOS NINGÚN FETCH NI API)
- sesion.php
- login.php
- registrar_socio.php
- listar_socios.php
- logout.php
*/

// Cargar socios desde LocalStorage o usar los datos simulados por defecto
function cargarSociosIniciales() {
    try {
        const guardados = localStorage.getItem(STORAGE_KEY);
        if (guardados) {
            const parseados = JSON.parse(guardados);
            if (Array.isArray(parseados) && parseados.length > 0) {
                return parseados;
            }
        }
    } catch (e) {
        console.warn("No se pudo leer localStorage, cargando datos por defecto:", e);
    }
    // Datos simulados iniciales (con guiones estándar ASCII YYYY-MM-DD)
    return [
        { nombre: "Carlos", telefono: "5512345678", fecha_inicio: "2026-01-01", fecha_vencimiento: "2026-12-31" },
        { nombre: "María", telefono: "5587654321", fecha_inicio: "2026-02-01", fecha_vencimiento: "2026-10-01" }
    ];
}

// Guardar socios en LocalStorage para no perder registros al recargar
function guardarSociosEnStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(listaCompletaSocios));
    } catch (e) {
        console.warn("No se pudo guardar en localStorage:", e);
    }
}

// Datos simulados (esto es la base local para la innovación)
let listaCompletaSocios = cargarSociosIniciales();
let usuarioActual = null;

// Normaliza fechas eliminando posibles guiones no estándar (como U+2011)
function normalizarFecha(strFecha) {
    if (!strFecha) return "";
    return String(strFecha).replace(/\u2011/g, "-").trim();
}

// ========== FUNCIONES DE INNOVACIÓN ==========
// Aplicar búsqueda + colores + contadores
function aplicarBusqueda() {
    const textoBusqueda = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : "";

    const filtrados = listaCompletaSocios.filter(socio => {
        const nombre = (socio.nombre || "").toLowerCase();
        const telefono = String(socio.telefono || "");
        return nombre.includes(textoBusqueda) || telefono.includes(textoBusqueda);
    });

    let vigentes = 0;
    let vencidos = 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (tabla) {
        // Limpiar tabla de forma segura y compatible
        if (typeof tabla.replaceChildren === "function") {
            tabla.replaceChildren();
        } else {
            tabla.innerHTML = "";
        }

        filtrados.forEach((socio, index) => {
            const fila = document.createElement("tr");

            // Validar fecha de vencimiento
            const fechaVenc = normalizarFecha(socio.fecha_vencimiento);
            const vencimiento = new Date(fechaVenc + "T00:00:00");
            const esFechaValida = !isNaN(vencimiento.getTime());

            let estado = "Vencida";
            if (esFechaValida && vencimiento >= hoy) {
                estado = "Vigente";
            }

            // Aplicar colores con buen contraste de texto y fondo
            if (estado === "Vigente") {
                fila.style.backgroundColor = "#d4edda";
                fila.style.color = "#155724";
                fila.style.fontWeight = "500";
                vigentes++;
            } else {
                fila.style.backgroundColor = "#f8d7da";
                fila.style.color = "#721c24";
                fila.style.fontWeight = "500";
                vencidos++;
            }

            const celdasValores = [
                socio.nombre,
                socio.telefono,
                normalizarFecha(socio.fecha_inicio),
                fechaVenc,
                estado
            ];

            celdasValores.forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = valor ?? "";
                celda.style.padding = "10px 14px";
                celda.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
                fila.appendChild(celda);
            });

            tabla.appendChild(fila);
        });
    } else {
        // Si no hay tabla en el DOM, aún calculamos los contadores
        filtrados.forEach(socio => {
            const fechaVenc = normalizarFecha(socio.fecha_vencimiento);
            const vencimiento = new Date(fechaVenc + "T00:00:00");
            if (!isNaN(vencimiento.getTime()) && vencimiento >= hoy) {
                vigentes++;
            } else {
                vencidos++;
            }
        });
    }

    if (contadorTotal) contadorTotal.textContent = filtrados.length;
    if (contadorVigentes) contadorVigentes.textContent = vigentes;
    if (contadorVencidos) contadorVencidos.textContent = vencidos;
}

// Función auxiliar para copiar al portapapeles con respaldo
function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto)
            .then(() => alert("Lista copiada al portapapeles correctamente."))
            .catch(() => fallbackCopiar(texto));
    } else {
        fallbackCopiar(texto);
    }
}

function fallbackCopiar(texto) {
    try {
        const area = document.createElement("textarea");
        area.value = texto;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.top = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        const exito = document.execCommand("copy");
        document.body.removeChild(area);
        if (exito) {
            alert("Lista copiada al portapapeles correctamente.");
        } else {
            prompt("Copia manualmente la lista:", texto);
        }
    } catch (e) {
        prompt("Copia manualmente la lista:", texto);
    }
}

// Exportar lista a texto formateado
function exportarListaSocios() {
    let contenido = "Lista de Socios - Iron Gym\n=====================================\n";
    listaCompletaSocios.forEach(s => {
        contenido += `Nombre: ${s.nombre} | Teléfono: ${s.telefono} | Inicio: ${normalizarFecha(s.fecha_inicio)} | Vencimiento: ${normalizarFecha(s.fecha_vencimiento)}\n`;
    });
    copiarAlPortapapeles(contenido);
}

// ========== FUNCIONES ORIGINALES (SOLO SIMULACIÓN SIN PHP) ==========
function mostrarPanel(usuario) {
    if (loginForm) loginForm.style.display = "none";
    if (panel) panel.style.display = "block";

    const elemNombre = document.getElementById("nombreUsuario");
    const elemRol = document.getElementById("rolUsuario");
    if (elemNombre && usuario) elemNombre.textContent = usuario.nombre || "";
    if (elemRol && usuario) elemRol.textContent = usuario.rol || "";

    if (usuario && usuario.rol) {
        document.querySelectorAll("[data-roles]").forEach(elemento => {
            const roles = (elemento.dataset.roles || "").split(",").map(r => r.trim());
            elemento.hidden = !roles.includes(usuario.rol);
        });
    }
    aplicarBusqueda();
}

function mostrarLogin() {
    if (loginForm) loginForm.style.display = "block";
    if (panel) panel.style.display = "none";
}

// Inicialización de elementos y eventos del DOM
function inicializarSistemaSocios() {
    loginForm = document.getElementById("formLogin");
    socioForm = document.getElementById("formSocio");
    panel = document.getElementById("panelSocios");
    tabla = document.getElementById("listaSocios");
    cerrarSesion = document.getElementById("btnCerrarSesion");

    inputBusqueda = document.getElementById("buscarSocio");
    contadorTotal = document.getElementById("contadorTotal");
    contadorVigentes = document.getElementById("contadorVigentes");
    contadorVencidos = document.getElementById("contadorVencidos");
    btnExportar = document.getElementById("btnExportar");

    // Búsqueda en tiempo real
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", aplicarBusqueda);
    }

    // Botón exportar
    if (btnExportar) {
        btnExportar.addEventListener("click", exportarListaSocios);
    }

    // Simulación iniciar sesión
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const inputUsuario = document.getElementById("usuario");
            const inputContrasena = document.getElementById("contrasena");

            const usuario = inputUsuario ? inputUsuario.value.trim() : "";
            const contrasena = inputContrasena ? inputContrasena.value : "";

            // SIMULACIÓN (sin php ni api)
            if (usuario && contrasena) {
                usuarioActual = { nombre: usuario, rol: "admin" };
                mostrarPanel(usuarioActual);
            } else {
                alert("Por favor ingresa usuario y contraseña.");
            }
        });
    }

    // Simulación registrar socio
    if (socioForm) {
        socioForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const inputNombre = document.getElementById("nombreSocio");
            const inputTelefono = document.getElementById("telefonoSocio");
            const inputFechaInicio = document.getElementById("fechaInicio");
            const inputFechaVencimiento = document.getElementById("fechaVencimiento");

            const nombre = inputNombre ? inputNombre.value.trim() : "";
            const telefono = inputTelefono ? inputTelefono.value.trim() : "";
            const fechaInicio = inputFechaInicio ? inputFechaInicio.value.trim() : "";
            const fechaVencimiento = inputFechaVencimiento ? inputFechaVencimiento.value.trim() : "";

            if (!nombre) {
                alert("El nombre del socio es obligatorio.");
                if (inputNombre) inputNombre.focus();
                return;
            }

            if (!telefono) {
                alert("El teléfono es obligatorio.");
                if (inputTelefono) inputTelefono.focus();
                return;
            }

            if (!/^[0-9]+$/.test(telefono)) {
                alert("El teléfono solo debe contener números.");
                if (inputTelefono) inputTelefono.focus();
                return;
            }

            if (telefono.length < 7 || telefono.length > 15) {
                alert("El teléfono debe tener entre 7 y 15 dígitos.");
                if (inputTelefono) inputTelefono.focus();
                return;
            }

            if (!fechaInicio || !fechaVencimiento) {
                alert("Por favor selecciona las fechas de inicio y vencimiento.");
                return;
            }

            const dInicio = new Date(fechaInicio + "T00:00:00");
            const dVenc = new Date(fechaVencimiento + "T00:00:00");

            if (isNaN(dInicio.getTime()) || isNaN(dVenc.getTime())) {
                alert("Una de las fechas ingresadas no es válida.");
                return;
            }

            if (dVenc < dInicio) {
                alert("La fecha de vencimiento no puede ser anterior a la fecha de inicio.");
                return;
            }

            const nuevoSocio = {
                nombre: nombre,
                telefono: telefono,
                fecha_inicio: fechaInicio,
                fecha_vencimiento: fechaVencimiento
            };

            listaCompletaSocios.push(nuevoSocio);
            guardarSociosEnStorage();
            alert("Socio registrado correctamente (simulación).");
            socioForm.reset();
            aplicarBusqueda();
        });
    }

    // Simulación cerrar sesión
    if (cerrarSesion) {
        cerrarSesion.addEventListener("click", function() {
            usuarioActual = null;
            mostrarLogin();
            if (loginForm) loginForm.reset();
        });
    }

    // Ejecutar al abrir:
    // Si hay formulario de login, se muestra el login primero;
    // Si no hay formulario de login pero sí panel, se muestra directamente el panel
    if (loginForm) {
        mostrarLogin();
    } else if (panel) {
        mostrarPanel({ nombre: "Administrador", rol: "admin" });
    } else {
        // Si solo se carga la tabla directamente
        aplicarBusqueda();
    }
}

// Iniciar de forma segura según el estado de carga del documento
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarSistemaSocios);
} else {
    inicializarSistemaSocios();
}
