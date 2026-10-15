# Cuentas de tecnología

Solo `admin` puede consultar o modificar el inventario. Las cuentas existentes
mantienen el día antiguo y una fecha completa vacía hasta que un administrador
la complete. No se calculan cobros ni renovaciones automáticas.

## Sesión y desbloqueo

`AuthProvider` comparte usuario y rol entre pantallas. Reconfirmar la misma
sesión no vuelve a activar la carga inicial ni desmonta los formularios. Las
comprobaciones de rol posteriores se realizan en segundo plano; una interrupción
de red no se interpreta como un cierre de sesión. Los permisos reales siguen
validándose en Supabase.

`CredencialesProvider` conserva una autorización aleatoria solo en memoria,
vinculada al usuario y al `session_id`. Se conserva al navegar y cambiar de
pestaña. Una recarga, pestaña nueva, cierre de sesión o «Bloquear ahora» exige
confirmar otra vez la contraseña del portal. Al ocultar la pestaña se oculta el
texto revelado, pero no se pierde el desbloqueo. Una contraseña mostrada se
oculta a los treinta segundos. La copia al portapapeles requiere una acción
explícita; el portapapeles lo gestiona el sistema operativo.

## Backend y datos

- El listado de `cuentas_tecnologia` contiene metadata y `tiene_contrasena`,
  nunca un secreto ni su representación cifrada.
- La Edge Function `cuentas-tecnologia` admite `guardar`, `eliminar`,
  `desbloquear`, `bloquear` y `revelar`. Devuelve errores sin datos sensibles y
  respuestas `Cache-Control: no-store`.
- La función autentica el JWT mediante Auth y obtiene el usuario de ese token,
  nunca del cuerpo. Cada llamada verifica sesión activa y rol en la base.
- Reconfirmar la contraseña utiliza un cliente Auth independiente. Solo se
  revoca su sesión temporal; la sesión original del navegador no se reemplaza.
  Si una política de sesión única invalidase la original, la bóveda rechaza el
  desbloqueo. No se relajan las políticas de Auth para resolverlo.
- La autorización de desbloqueo tiene 256 bits aleatorios. La base guarda solo
  su SHA-256, vinculado a usuario y sesión. Cinco intentos de contraseña fallidos
  bloquean la comprobación durante la ventana de quince minutos. Los permisos
  se revocan al retirar el rol admin, incluso si se vuelve a otorgar después.
- `tecnologia_privada` contiene credenciales, autorizaciones, intentos y
  auditoría, con RLS habilitado y sin políticas para usuarios. El acceso cerrado
  es intencional. El puente público `tecnologia_operar` es SECURITY INVOKER y
  solo `service_role` puede ejecutarlo; la implementación privilegiada permanece
  en el esquema privado con `search_path` fijo.
- AES-256-GCM usa un nonce nuevo de 96 bits y autentica también el identificador
  de cuenta y la versión. Intercambiar un cifrado entre cuentas o alterarlo
  impide descifrarlo. La contraseña personal del portal no es la clave de cifrado.
- Metadata y modificaciones del secreto se guardan en una misma transacción.
  Un campo de contraseña vacío conserva la existente. Eliminarla exige una
  acción explícita y desbloqueo. Eliminar una cuenta con secreto también lo exige.
- Usuarios admin antiguos pueden seguir editando metadata, pero no modificar
  `tiene_contrasena` ni borrar directamente una cuenta que tenga credenciales.

## Clave, recuperación y despliegue

`TECH_ACCOUNTS_KEY_V1` es una clave aleatoria de 32 bytes en Supabase Secrets.
Nunca debe incluirse en variables `VITE_*`, respuestas, logs o commits.

`node scripts/configurar-clave-tecnologia.mjs` configura la clave solo si no
existe. En Windows conserva un respaldo cifrado con DPAPI en
`supabase/.temp/tech-accounts-key-v1.dpapi`, excluido de Git. No imprime la clave.
Si se elimina accidentalmente el secreto remoto, el mismo comando recupera el
valor de ese respaldo utilizando la misma cuenta de Windows. No perder el
respaldo ni borrar el secreto: sin la clave original las contraseñas cifradas
no se pueden recuperar. Conservar también una copia de recuperación bajo la
custodia habitual del propietario; DPAPI no es portable a otra cuenta de Windows.

No reemplazar V1 con un valor nuevo. Una futura rotación requiere conservar V1,
crear V2, admitir la nueva versión en la función y la base, volver a cifrar los
registros y verificar su lectura antes de retirar la versión antigua. Los
backups históricos requieren conservar las claves de sus versiones.

Aplicar únicamente la migración nueva al proyecto vinculado y registrar su
versión. Este repositorio conserva diferencias históricas entre migraciones
locales y remotas; no ejecutar un `db push` indiscriminado para corregirlas.
Después configurar el secreto y desplegar:

```bash
supabase functions deploy cuentas-tecnologia --project-ref crxtzmykprgbgkdbqccd --use-api
```

El backend se publica antes del frontend. El push de Git no reemplaza la
publicación del frontend en SiteGround. Las migraciones de esta entrega son
aditivas y permiten mantener el frontend anterior mientras se publica el nuevo.

## Comprobaciones

```bash
npm run test:cuentas
node scripts/probar-cuentas-tecnologia.mjs --browser
npm run build
```

Las pruebas de integración requieren un CLI de Supabase autenticado y acceso
al proyecto. Obtienen las claves solo en memoria, crean usuarios y cuentas
temporales, prueban el backend real y limpian los registros al finalizar. Nunca
usan contraseñas de personas del equipo ni imprimen claves. Tras una interrupción:

```bash
node scripts/probar-cuentas-tecnologia.mjs --limpiar
```

El escenario de navegador reproduce la pérdida de formulario de la versión
`13c0172`, comprueba que no reaparece con el proveedor compartido y prueba
desbloqueo, copia, ocultado, renovación JWT, navegación, pestañas nuevas,
recarga, cierre entre pestañas y móvil. Las capturas de QA se generan en
`supabase/.temp`, fuera del commit.

El asesor de Supabase puede informar «RLS Enabled No Policy» para las tablas
privadas: aquí significa denegación por defecto, no falta de protección. Las
advertencias históricas sobre funciones públicas de otros módulos, protección
de contraseñas filtradas y actualización de Postgres no se modifican como parte
de esta entrega. Se pueden revisar en el [asesor de seguridad](https://supabase.com/dashboard/project/crxtzmykprgbgkdbqccd/advisors/security).
