# 🧪 PRUEBAS DE LA FASE 1: SEGURIDAD Y AUTENTICACIÓN

## ✅ CHECKLIST DE PRUEBAS

### 1️⃣ **Verificar Tokens al hacer Login**

**Pasos:**
1. Abre el navegador en `http://localhost:5173`
2. Haz login con tu usuario
3. Abre DevTools (F12) → **Application** → **Local Storage** → `http://localhost:5173`

**Verificar que existan:**
- ✅ `accessToken` (JWT largo)
- ✅ `refreshToken` (string hexadecimal largo)
- ✅ `user` (JSON con id, email, name, phone, **role**)

**Verificar en la BD (pgAdmin):**
```sql
-- Ver refresh tokens creados
SELECT * FROM refresh_tokens ORDER BY created_at DESC LIMIT 5;

-- Ver último login del usuario
SELECT email, last_login FROM users WHERE email = 'tu_email@ejemplo.com';
```

---

### 2️⃣ **Verificar Expiración del Access Token (15 minutos)**

**Opción A: Esperar 15 minutos** ⏰
- Haz login
- Espera 15 minutos sin hacer nada
- Intenta navegar a `/orders` o `/profile`
- **Resultado esperado**: La sesión se renueva automáticamente (no te saca)

**Opción B: Modificar manualmente el token** (más rápido) 🚀

1. Haz login
2. Abre DevTools → **Console**
3. Ejecuta este código:
```javascript
// Guardar un access token expirado (simulado)
localStorage.setItem('accessToken', 'token_invalido_123');
```
4. Recarga la página o navega a `/orders`
5. **Resultado esperado**:
   - Se intenta renovar el token automáticamente
   - Si el refresh token es válido → sesión continúa
   - Si no → redirige a `/login`

---

### 3️⃣ **Verificar Auto-Refresh de Tokens**

**Usando la Consola del Navegador:**

1. Haz login normalmente
2. Abre DevTools → **Console**
3. Ejecuta:
```javascript
// Ver el access token actual
console.log('Access Token:', localStorage.getItem('accessToken'));

// Hacer una petición para forzar el refresh (si el token expiró)
fetch('http://localhost:3000/api/orders', {
  headers: {
    'Authorization': `Bearer token_invalido`
  }
})
.then(res => res.json())
.then(data => console.log('Respuesta:', data))
.catch(err => console.log('Error (esperado):', err));

// Ahora hacer una petición válida (debería funcionar)
fetch('http://localhost:3000/api/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(res => res.json())
.then(data => console.log('Pedidos:', data));
```

---

### 4️⃣ **Verificar Sistema de Roles**

**En pgAdmin, actualiza tu usuario a admin:**
```sql
-- Ver tu usuario actual
SELECT id, email, role FROM users WHERE email = 'tu_email@ejemplo.com';

-- Cambiar tu rol a admin
UPDATE users SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';
```

**Luego en el navegador:**
1. Haz logout
2. Haz login de nuevo (para que el nuevo rol se cargue en el token)
3. Abre DevTools → **Application** → **Local Storage** → `user`
4. **Verificar que** `role: "admin"`

---

### 5️⃣ **Verificar Logout**

**Pasos:**
1. Haz login
2. Abre DevTools → **Network** (pestaña de red)
3. Haz logout
4. **Verificar en Network**:
   - Se hace una petición `POST /auth/logout`
   - Status: 200 OK
5. **Verificar en Local Storage**:
   - `accessToken` → eliminado ❌
   - `refreshToken` → eliminado ❌
   - `user` → eliminado ❌

**Verificar en la BD:**
```sql
-- El refresh token debería estar revocado (is_revoked = true)
SELECT token, is_revoked, created_at
FROM refresh_tokens
WHERE user_id = 'TU_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

---

### 6️⃣ **Probar Refresh Token Endpoint Manualmente**

**Usando Postman o Thunder Client:**

1. Haz login y copia el `refreshToken` del localStorage
2. Crea una petición:
   - **Método**: POST
   - **URL**: `http://localhost:3000/api/auth/refresh-token`
   - **Body** (JSON):
   ```json
   {
     "refreshToken": "PEGA_AQUI_TU_REFRESH_TOKEN"
   }
   ```
3. Envía la petición
4. **Resultado esperado**:
   ```json
   {
     "message": "Token renovado exitosamente",
     "accessToken": "nuevo_access_token_aqui...",
     "user": {
       "id": "...",
       "email": "...",
       "name": "...",
       "role": "customer"
     }
   }
   ```

---

## 🐛 PROBLEMAS COMUNES

### Error: "Refresh token inválido o revocado"
**Solución**: Haz logout y login de nuevo para generar nuevos tokens.

### Error: "Cannot read property 'role' of undefined"
**Solución**: Verifica que la tabla `users` tenga la columna `role` y que esté poblada.

### Error: CORS en el refresh token
**Solución**: Asegúrate de que el API Gateway esté corriendo en el puerto 3000.

### Los tokens no se guardan en localStorage
**Solución**: Verifica que el backend esté retornando `accessToken` y `refreshToken` (no `token`).

---

## 📊 VERIFICAR EN LA BASE DE DATOS

```sql
-- Ver todos los refresh tokens activos
SELECT
  rt.id,
  u.email,
  rt.device_info,
  rt.ip_address,
  rt.is_revoked,
  rt.expires_at,
  rt.created_at
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE rt.is_revoked = false
ORDER BY rt.created_at DESC;

-- Ver historial de tokens de un usuario específico
SELECT
  token,
  is_revoked,
  expires_at,
  created_at
FROM refresh_tokens
WHERE user_id = 'TU_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ RESULTADO ESPERADO

Si todo funciona correctamente:
- ✅ Los tokens se guardan en localStorage al hacer login/register
- ✅ El `accessToken` se renueva automáticamente cuando expira
- ✅ El sistema NO te saca de la sesión si el refresh token es válido
- ✅ Después de 7 días sin actividad, debes volver a hacer login
- ✅ El rol del usuario se guarda correctamente
- ✅ El logout revoca los tokens en la BD
