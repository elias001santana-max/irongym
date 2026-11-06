const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");

// ====== CONFIGURACIÓN (valores por defecto de XAMPP) ======
const CONFIG_MYSQL = {
    host: "localhost",
    user: "root",
    password: ""
};
const NOMBRE_BD = process.env.DB_NAME || "iron_gym";
const PUERTO = 3000;
// ===========================================================

const app = express();
app.use(express.json());
// Las páginas están en la misma carpeta que este archivo
app.use(express.static(__dirname));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "INDEC.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "INDEC.html")));
app.get("/LOGIN.html", (req, res) => res.sendFile(path.join(__dirname, "LOGIN.html")));
app.get("/registro.html", (req, res) => res.sendFile(path.join(__dirname, "registro.html")));
app.get("/INDEC.html", (req, res) => res.sendFile(path.join(__dirname, "INDEC.html")));
app.get("/socios.html", (req, res) => res.sendFile(path.join(__dirname, "socios.html")));
app.get("/socios", (req, res) => res.sendFile(path.join(__dirname, "socios.html")));
app.get("/ESTILOC.css", (req, res) => res.sendFile(path.join(__dirname, "ESTILOC.css")));

let pool;

// Crea la base de datos y la tabla si no existen
async function iniciarBaseDeDatos() {
    const conexion = await mysql.createConnection(CONFIG_MYSQL);
    await conexion.query(
        "CREATE DATABASE IF NOT EXISTS `" + NOMBRE_BD + "` " +
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
    );
    await conexion.end();

    pool = mysql.createPool({ ...CONFIG_MYSQL, database: NOMBRE_BD });

    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(50) NOT NULL UNIQUE,
            contrasena VARCHAR(255) NOT NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// ---------- REGISTRO ----------
app.post("/api/registro", async (req, res) => {
    try {
        const usuario = String(req.body.usuario || "").trim();
        const contrasena = String(req.body.contrasena || "");

        if (usuario === "" || contrasena === "") {
            return res.json({ ok: false, mensaje: "Completa todos los campos." });
        }

        if (usuario.length > 50) {
            return res.json({ ok: false, mensaje: "El usuario es demasiado largo (máximo 50)." });
        }

        const [existe] = await pool.query(
            "SELECT id FROM usuarios WHERE usuario = ?", [usuario]
        );

        if (existe.length > 0) {
            return res.json({ ok: false, mensaje: "Este usuario ya está registrado." });
        }

        const hash = await bcrypt.hash(contrasena, 10);

        await pool.query(
            "INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)",
            [usuario, hash]
        );

        res.json({ ok: true, mensaje: "Registro exitoso." });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.json({ ok: false, mensaje: "Este usuario ya está registrado." });
        }
        console.error(error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
    try {
        const usuario = String(req.body.usuario || "").trim();
        const contrasena = String(req.body.contrasena || "");

        const [filas] = await pool.query(
            "SELECT usuario, contrasena FROM usuarios WHERE usuario = ?", [usuario]
        );

        if (filas.length === 0) {
            return res.json({ ok: false, mensaje: "Usuario o contraseña incorrectos." });
        }

        const correcta = await bcrypt.compare(contrasena, filas[0].contrasena);

        if (!correcta) {
            return res.json({ ok: false, mensaje: "Usuario o contraseña incorrectos." });
        }

        res.json({ ok: true, usuario: filas[0].usuario });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});

// ---------- ARRANQUE ----------
iniciarBaseDeDatos()
    .then(() => {
        app.listen(PUERTO, () => {
            console.log("Base de datos lista: " + NOMBRE_BD);
            console.log("Abre en tu navegador: http://localhost:" + PUERTO);
        });
    })
    .catch((error) => {
        console.error("No se pudo conectar a MySQL. ¿Está encendido en XAMPP?");
        console.error(error.message);
        process.exit(1);
    });
