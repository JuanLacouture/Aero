## Pruebas unitarias

**Framework:** Jest + next/jest  
**Total:** 67 pruebas · 4 suites · ~2s de ejecución

Se configuró Jest con soporte nativo para Next.js (`next/jest`), incluyendo compatibilidad con aliases `@/` y transformación automática de TypeScript.  
Además, se implementaron pruebas unitarias enfocadas en los módulos de lógica de negocio más críticos de la aplicación.

### Archivos creados

| Archivo | Tests | Qué cubre |
|---|---:|---|
| `__tests__/stores/cart.test.ts` | 16 | Store Zustand: `addItem`, cambio de vendor, `updateQuantity`, `removeItem`, total, count y `clear` |
| `__tests__/validations/product.test.ts` | 17 | Schemas Zod: nombre (mín 2, máx 255), precio positivo, descripción máx 500, stock entero positivo |
| `__tests__/api/order-transitions.test.ts` | 22 | Máquina de estados del pedido, cálculo de total y validación de capacidad de franjas horarias (30%) |
| `__tests__/api/ratings-schema.test.ts` | 12 | Schema de calificaciones: UUID válido, puntuaciones enteras entre 1–5 y comentario máx 500 caracteres |

### Configuración

Archivo `jest.config.js` configurado usando `next/jest` para garantizar compatibilidad con el App Router de Next.js.

Scripts agregados en `package.json`:

```json
{
  "test": "jest",
  "test:coverage": "jest --coverage"
}