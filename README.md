# 💸 Remesador App

Sistema web de gestión de remesas para operadores. Profesionaliza y automatiza la gestión de movimientos diarios, control de clientes, wallets, tasas de cambio, cuentas bancarias y generación de reportes.

## 🛠 Tecnologías utilizadas

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Base de Datos:** PostgreSQL
- **ORM:** (por ahora conexión directa con `pg`, se puede migrar a Sequelize o Prisma luego)

---

## 🚀 ¿Qué puedes hacer?

✅ Registrar movimientos de remesas  
✅ Ver listado de remesas registradas  
✅ Guardar nombre del beneficiario, monto, tasa y comisión  
✅ Ver totales y estados  
✅ Controlar clientes, wallets, países, tasas, cuentas bancarias (en desarrollo)  

---

## 📦 Estructura del proyecto

```
remesador/
├── backend/         → Servidor Node.js (Express)
├── frontend/        → Aplicación React
└── database/        → Script SQL con estructura + datos de prueba
```

---

## 🧑‍💻 Cómo levantar el proyecto localmente

### 🔹 1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/remesador.git
cd remesador
```

### 🔹 2. Configura la base de datos

1. Asegúrate de tener PostgreSQL corriendo.
2. Crea la base de datos llamada `remesador_db`.
3. Ejecuta el script SQL en `database/remesador_schema.sql`.

### 🔹 3. Levanta el backend

```bash
cd backend
npm install
node index.js
```

Servidor corriendo en `http://localhost:4000`

### 🔹 4. Levanta el frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend corriendo en `http://localhost:5173`

---

## 📌 Notas

- Este proyecto aún está en fase inicial (MVP).
- Se planea agregar autenticación de usuarios, reportes avanzados, exportaciones y más.
- Si quieres contribuir, ¡eres bienvenido!

---

## 🧠 Autor

Desarrollado por Angel E Juarez Castellon – Fullstack Developer  
🧑‍💻 GitHub: [@Tennshi10](https://github.com/Tennshi10)
