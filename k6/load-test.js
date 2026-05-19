import http from 'k6/http'
import { sleep, check } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const BASE_URL = 'https://aero-teal-three.vercel.app'

// Métricas personalizadas
const homeDuration    = new Trend('home_duration')
const vendorsDuration = new Trend('vendors_duration')
const errorRate       = new Rate('error_rate')

export const options = {
  scenarios: {
    // Escenario 1: 50 usuarios → página principal (p95 < 3s)
    home_page: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      tags: { scenario: 'home' },
    },

    // Escenario 2: 20 usuarios → API de vendors
    vendors_api: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      startTime: '35s',
      tags: { scenario: 'vendors' },
    },

    // Escenario 3: 100 usuarios → página de login (ruta pública más visitada)
    login_page: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      startTime: '70s',
      tags: { scenario: 'login' },
    },
  },

  thresholds: {
    // p95 de la home debe ser menor a 3 segundos
    home_duration:    ['p(95)<3000'],
    // p95 de vendors debe ser menor a 2 segundos
    vendors_duration: ['p(95)<2000'],
    // Tasa de errores menor al 5%
    error_rate:       ['rate<0.05'],
    // HTTP failures globales menores al 5%
    http_req_failed:  ['rate<0.05'],
  },
}

export default function () {
  const scenario = __ENV.K6_SCENARIO_NAME || ''

  if (scenario === 'home_page' || scenario === '') {
    // Escenario 1 — Página principal
    const res = http.get(`${BASE_URL}/student/home`, {
      tags: { name: 'home' },
    })
    homeDuration.add(res.timings.duration)
    const ok = check(res, {
      'home: status 200 o 307': (r) => r.status === 200 || r.status === 307 || r.status === 308,
      'home: responde en menos de 3s': (r) => r.timings.duration < 3000,
    })
    errorRate.add(!ok)
    sleep(1)
  }

  if (scenario === 'vendors_api') {
    // Escenario 2 — API de timeslots (endpoint público)
    const res = http.get(`${BASE_URL}/api/timeslots`, {
      tags: { name: 'timeslots' },
    })
    vendorsDuration.add(res.timings.duration)
    const ok = check(res, {
      'vendors: status 200 o 401': (r) => r.status === 200 || r.status === 401,
      'vendors: responde en menos de 2s': (r) => r.timings.duration < 2000,
    })
    errorRate.add(!ok)
    sleep(1)
  }

  if (scenario === 'login_page') {
    // Escenario 3 — Página de login (100 usuarios simultáneos)
    const res = http.get(`${BASE_URL}/login`, {
      tags: { name: 'login' },
    })
    const ok = check(res, {
      'login: status 200': (r) => r.status === 200,
      'login: responde en menos de 3s': (r) => r.timings.duration < 3000,
    })
    errorRate.add(!ok)
    sleep(1)
  }
}
