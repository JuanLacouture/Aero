import { render, screen } from '@testing-library/react'
import VendorUnavailable from '@/components/student/VendorUnavailable'

const makeVendor = (overrides = {}) => ({
  business_name: 'Cafetería Central',
  description: 'La mejor comida del campus',
  cover_image_url: null,
  schedule_start: null,
  schedule_end: null,
  ...overrides,
})

describe('VendorUnavailable', () => {
  it('muestra el nombre del negocio', () => {
    render(<VendorUnavailable vendor={makeVendor()} />)
    expect(screen.getByText('Cafetería Central')).toBeInTheDocument()
  })

  it('muestra la descripción del negocio', () => {
    render(<VendorUnavailable vendor={makeVendor()} />)
    expect(screen.getByText('La mejor comida del campus')).toBeInTheDocument()
  })

  it('muestra el mensaje de cerrado', () => {
    render(<VendorUnavailable vendor={makeVendor()} />)
    expect(screen.getByText('Cerrado en este momento')).toBeInTheDocument()
  })

  it('muestra el horario cuando está disponible', () => {
    render(<VendorUnavailable vendor={makeVendor({ schedule_start: '08:00:00', schedule_end: '17:00:00' })} />)
    expect(screen.getByText('Horario: 08:00 – 17:00')).toBeInTheDocument()
  })

  it('no muestra horario si no está definido', () => {
    render(<VendorUnavailable vendor={makeVendor()} />)
    expect(screen.queryByText(/Horario:/)).not.toBeInTheDocument()
  })

  it('no muestra descripción si es null', () => {
    render(<VendorUnavailable vendor={makeVendor({ description: null })} />)
    expect(screen.queryByText('La mejor comida del campus')).not.toBeInTheDocument()
  })

  it('muestra el botón para volver a inicio', () => {
    render(<VendorUnavailable vendor={makeVendor()} />)
    expect(screen.getByText('Explorar otros negocios')).toBeInTheDocument()
  })
})