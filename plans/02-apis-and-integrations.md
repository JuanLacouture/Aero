# Plan #02 — APIs e Integraciones AERO

**Proyecto**: AERO · Capstone 2026-1 · Universidad de La Sabana
**Supabase project ref**: `vtngzjobuhqjnckuyrsx`

---

## Índice

- [A. Supabase](#a-supabase)
- [B. Google OAuth](#b-google-oauth)
- [C. Microsoft OAuth](#c-microsoft-oauth)
- [D. Apple Sign In](#d-apple-sign-in)
- [E. Google Maps JS API](#e-google-maps-js-api)
- [F. Kushki](#f-kushki)
- [G. Nequi](#g-nequi)
- [H. Daviplata](#h-daviplata)
- [I. Web Push (VAPID)](#i-web-push-vapid)
- [J. Supabase Storage](#j-supabase-storage)

---

## A. Supabase

### Credenciales
| Variable | Descripción | Dónde obtener |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vtngzjobuhqjnckuyrsx.supabase.co` | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (safe para cliente) | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (NUNCA al cliente) | Dashboard → Settings → API |

### Browser Client (componentes React)
```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (Server Components, API Routes)
```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}
```

### Realtime — Suscripciones
```ts
// Estado del pedido (estudiante)
const supabase = createClient()
supabase
  .channel('order-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `student_id=eq.${userId}`
  }, (payload) => updateOrderStatus(payload.new))
  .subscribe()

// Nuevo pedido (vendedor)
supabase
  .channel('new-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `vendor_id=eq.${vendorId}`
  }, (payload) => addOrderToPanel(payload.new))
  .subscribe()

// Disponibilidad vendedor (favoritos)
supabase
  .channel('vendor-availability')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'vendors',
    filter: `id=eq.${vendorId}`
  }, (payload) => notifyVendorOpen(payload.new))
  .subscribe()
```

### Habilitar Realtime en Supabase Dashboard
1. Dashboard → Database → Replication
2. Habilitar para tablas: `orders`, `vendors`, `delivery_points`

---

## B. Google OAuth

### Configuración en Google Cloud Console
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto o seleccionar existente
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs:
   - `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (desarrollo)
6. Copiar **Client ID** y **Client Secret**

### Configuración en Supabase Dashboard
1. Authentication → Providers → Google
2. Pegar Client ID y Client Secret
3. Habilitar

### Scopes requeridos
```
email
profile
openid
```

### Uso en el frontend
```tsx
const supabase = createClient()

async function loginWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

---

## C. Microsoft OAuth (Azure AD)

### Configuración en Azure Portal
1. Ir a [portal.azure.com](https://portal.azure.com)
2. Azure Active Directory → App Registrations → New Registration
3. Name: `AERO`
4. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Usar `common` tenant para aceptar cuentas `@unisabana.edu.co` y personales
5. Redirect URI (Web): `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
6. Certificates & Secrets → New client secret → copiar valor inmediatamente
7. Overview → copiar **Application (client) ID**

### Configuración en Supabase Dashboard
1. Authentication → Providers → Azure
2. Client ID: Application (client) ID de Azure
3. Client Secret: el secret creado
4. Azure Tenant: `common`

### Uso en el frontend
```tsx
async function loginWithMicrosoft() {
  await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile',
    },
  })
}
```

---

## D. Apple Sign In

### Configuración en Apple Developer Console
1. Ir a [developer.apple.com](https://developer.apple.com)
2. Certificates, IDs & Profiles → Identifiers → Register App ID
3. Habilitar **Sign In with Apple**
4. Crear **Services ID**:
   - Description: `AERO`
   - Identifier: `co.aero.web` (ejemplo)
   - Configurar Sign In with Apple → Domains: `vtngzjobuhqjnckuyrsx.supabase.co`
   - Return URLs: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
5. Keys → Create a Key → habilitar Sign In with Apple
6. Descargar `.p8` key (solo se puede descargar una vez)

### Configuración en Supabase Dashboard
1. Authentication → Providers → Apple
2. Services ID: el identifier del paso 4
3. Secret Key: contenido del `.p8`
4. Key ID: ID de la clave del paso 5
5. Team ID: tu Apple Team ID (perfil de desarrollador)

### Uso en el frontend
```tsx
async function loginWithApple() {
  await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

---

## E. Google Maps JS API

### Credenciales
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API Key desde Google Cloud Console |

### Configuración en Google Cloud Console
1. APIs & Services → Library → Habilitar:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
2. Credentials → API Key → Restricciones:
   - HTTP referrers: `localhost:3000/*`, `*.vercel.app/*`, tu dominio
   - API restrictions: Maps JavaScript API, Places API, Geocoding API

### Uso en Next.js
```tsx
// app/(student)/map/page.tsx
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'

export default function DeliveryMapPage() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={{ lat: 4.8615, lng: -74.0317 }}
        defaultZoom={16}
        style={{ width: '100%', height: '100vh' }}
        gestureHandling="greedy"
        disableDefaultUI
      >
        {deliveryPoints.map((point) => (
          <Marker
            key={point.id}
            position={{ lat: point.lat, lng: point.lng }}
            title={point.name}
          />
        ))}
      </Map>
    </APIProvider>
  )
}
```

### Coordenadas Universidad de La Sabana
```ts
const CAMPUS_CENTER = { lat: 4.8615, lng: -74.0317 }
const DEFAULT_ZOOM = 16
```

---

## F. Kushki

### Credenciales
| Variable | Descripción |
|---|---|
| `KUSHKI_PUBLIC_KEY` | Clave pública (cliente) |
| `KUSHKI_PRIVATE_KEY` | Clave privada (SOLO servidor) |

### Modos
- **Sandbox**: `https://api-uat.kushkipagos.com` — para POC
- **Producción**: `https://api.kushkipagos.com` — para MVP

### Flujo de pago con tarjeta
```ts
// 1. Frontend: tokenizar tarjeta con Kushki.js
// Incluir en layout: <Script src="https://cdn.kushkipagos.com/kushki.min.js" />

// 2. API Route: crear cargo
// app/api/payments/intent/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { token, amount, orderId } = await request.json()

  const response = await fetch('https://api-uat.kushkipagos.com/charges/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Private-Merchant-Id': process.env.KUSHKI_PRIVATE_KEY!,
    },
    body: JSON.stringify({
      token,
      amount: { subtotalIva: 0, subtotalIva0: amount, iva: 0, currency: 'COP' },
      metadata: { orderId },
    }),
  })

  const result = await response.json()
  return NextResponse.json(result)
}
```

### Webhook de confirmación
```ts
// app/api/webhooks/kushki/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-kushki-signature') ?? ''

  // Verificar firma HMAC
  const expected = crypto
    .createHmac('sha256', process.env.KUSHKI_PRIVATE_KEY!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (payload.transactionStatus === 'APPROVAL') {
    await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', payload.metadata?.orderId)
  }

  return NextResponse.json({ received: true })
}
```

---

## G. Nequi

### Credenciales
| Variable | Descripción |
|---|---|
| `NEQUI_API_KEY` | API Key de Nequi |
| `NEQUI_API_URL` | `https://api.sandbox.connect.nequi.com` (sandbox) |

### Flujo de cobro push
```ts
// app/api/payments/intent/route.ts — sección Nequi
const nequiResponse = await fetch(`${process.env.NEQUI_API_URL}/payments/v2/-services-paymentservice-unregisteredpayment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEQUI_API_KEY}`,
    'x-api-key': process.env.NEQUI_API_KEY!,
  },
  body: JSON.stringify({
    RequestMessage: {
      RequestHeader: {
        Channel: 'APP',
        RequestDate: new Date().toISOString(),
        MessageID: crypto.randomUUID(),
        ClientID: 'AERO',
        Destination: { ServiceName: 'PaymentsService', ServiceOperation: 'unregisteredPayment' },
      },
      RequestBody: {
        any: {
          phoneNumber: phoneNumber, // número del estudiante
          code: 'NIT_NEQUI',
          value: amount.toString(),
        }
      }
    }
  })
})
```

### Estados del pago Nequi
| Estado | Descripción |
|---|---|
| `PENDING` | Esperando aprobación del usuario |
| `SUCCESS` | Pago aprobado |
| `FAILED` | Pago rechazado |

### Webhook Nequi
```ts
// app/api/webhooks/nequi/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.json()
  const status = payload?.ResponseMessage?.ResponseBody?.any?.transactionStatus

  if (status === 'SUCCESS') {
    // Actualizar pedido a paid
  }

  return NextResponse.json({ received: true })
}
```

---

## H. Daviplata

### Credenciales
| Variable | Descripción |
|---|---|
| `DAVIPLATA_API_KEY` | API Key de Daviplata |
| `DAVIPLATA_API_URL` | URL base de la API |

### Diferencias clave vs Nequi
- Daviplata requiere número de celular con prefijo `+57`
- El flujo es similar: push charge → usuario aprueba en app → webhook de confirmación
- Endpoint: `/v1/charges` (verificar documentación oficial de Davivienda)

### Webhook Daviplata
```ts
// app/api/webhooks/daviplata/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.json()
  // Verificar firma y actualizar payment_status
  return NextResponse.json({ received: true })
}
```

---

## I. Web Push (VAPID)

### Credenciales
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública VAPID |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (solo servidor) |
| `VAPID_SUBJECT` | `mailto:admin@aero.app` |

### Generar claves VAPID
```bash
npx web-push generate-vapid-keys
# Copiar las claves a .env.local
```

### Service Worker (`public/sw.js`)
```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'AERO', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'))
})
```

### Registrar suscripción (frontend)
```ts
// lib/hooks/usePushNotifications.ts
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.register('/sw.js')
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  })

  // Guardar suscripción en backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
}
```

### Enviar notificación (API Route)
```ts
// app/api/push/send/route.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  const { subscription, title, body, url } = await request.json()

  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body, url })
  )

  return NextResponse.json({ sent: true })
}
```

### Casos de uso de notificaciones
| Evento | Destinatario | Mensaje |
|---|---|---|
| `orders.status = 'ready'` | Estudiante | "Tu pedido está listo para recoger" |
| `vendors.is_open = true` | Estudiante (favoritos) | "{vendedor} acaba de abrir" |
| `orders` INSERT | Vendedor | "Nuevo pedido recibido" |

---

## J. Supabase Storage

### Buckets creados

| Bucket | Público | Límite | Tipos MIME |
|---|---|---|---|
| `product-images` | Sí | 5 MB | `image/jpeg`, `image/png`, `image/webp` |
| `avatars` | Sí | 2 MB | `image/jpeg`, `image/png`, `image/webp` |
| `covers` | Sí | 5 MB | `image/jpeg`, `image/png`, `image/webp` |
| `reports` | No | 10 MB | `application/pdf`, `text/csv` |

### Comprimir imágenes antes de subir
```ts
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'

export async function uploadProductImage(file: File, productId: string, index: number) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,        // 200 KB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  })

  const supabase = createClient()
  const path = `${productId}/${index}.webp`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(path, compressed, { upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)

  return publicUrl
}
```

### URL pública de imagen
```ts
const supabase = createClient()
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl('product-uuid/0.webp')
// → https://vtngzjobuhqjnckuyrsx.supabase.co/storage/v1/object/public/product-images/product-uuid/0.webp
```

### URL firmada (bucket privado `reports`)
```ts
// Solo desde servidor con service role
const supabase = createClient() // server client con service role
const { data } = await supabase.storage
  .from('reports')
  .createSignedUrl(`${vendorId}/weekly-2026-05-04.pdf`, 3600) // 1 hora
```

### next.config.ts — remotePatterns ya configurado
```ts
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: 'vtngzjobuhqjnckuyrsx.supabase.co',
    pathname: '/storage/v1/object/public/**',
  }],
}
```

---

*Documento generado: 2026-05-05 | Proyecto AERO | Universidad de La Sabana*
