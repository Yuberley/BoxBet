# 🎮 BoxBet - Inicio Rápido

## Para ejecutar el juego:

### 1. Instalar dependencias (solo la primera vez)
```bash
npm install
```

### 2. Ejecutar el juego
```bash
npm run dev:all
```

Este comando inicia:
- ✅ Servidor backend en http://localhost:3001
- ✅ Cliente frontend en http://localhost:5173

### 3. Jugar

**Jugador 1:**
1. Abre http://localhost:5173
2. Crea una sala
3. Comparte el código de 4 dígitos

**Jugador 2:**
1. Abre http://localhost:5173 (en otra ventana/pestaña/navegador)
2. Únete con el código

---

## Comandos alternativos

Si prefieres ejecutar servidor y cliente por separado:

**Terminal 1 - Servidor:**
```bash
npm run server
```

**Terminal 2 - Cliente:**
```bash
npm run dev
```

---

## 🎲 Cómo jugar

1. **Tira el dado** para saber cuántas aristas colocar
2. **Haz clic en las líneas** alrededor de las monedas
3. **Completa los 4 lados** de una moneda para capturarla
4. **Gana dinero** capturando las monedas de mayor valor
5. **El jugador con más dinero gana**

---

## ⚠️ Solución de problemas

**No se conectan los jugadores:**
- Verifica que ambos comandos estén ejecutándose
- Asegúrate de usar el código correcto de 4 dígitos

**Puerto en uso:**
- Si el puerto 3001 o 5173 está ocupado, cierra otras aplicaciones

**Error de compilación:**
- Elimina la carpeta `node_modules` y ejecuta `npm install` de nuevo
