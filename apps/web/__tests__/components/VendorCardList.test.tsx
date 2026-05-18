import { render, screen, waitFor } from '@testing-library/react'
import VendorCardList, { VendorRow } from '@/components/student/VendorCardList'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ data: [] }),
    }),
  }),
}))

const makeVendor = (overrides: Partial<VendorRow> = {}): VendorRow => ({
  id: 'vendor-1',
  business_name: 'Frisby',
  description: 'Comida rápida',
  cover_image_url: null,
  rating_avg: 4.5,
  rating_count: 10,
  is_open: true,
  schedule_start: '08:00:00',
  schedule_end: '17:00:00',
  ...overrides,
})

describe('VendorCardList', () => {
  it('muestra el nombre del vendor', async () => {
    render(<VendorCardList vendors={[makeVendor()]} />)
    await waitFor(() => expect(screen.getByText('Frisby')).toBeInTheDocument())
  })

  it('muestra el badge Abierto cuando is_open es true', async () => {
    render(<VendorCardList vendors={[makeVendor({ is_open: true })]} />)
    await waitFor(() => expect(screen.getByText('Abierto')).toBeInTheDocument())
  })

  it('muestra el badge Cerrado cuando is_open es false', async () => {
    render(<VendorCardList vendors={[makeVendor({ is_open: false })]} />)
    await waitFor(() => expect(screen.getByText('Cerrado')).toBeInTheDocument())
  })

  it('muestra el rating del vendor', async () => {
    render(<VendorCardList vendors={[makeVendor({ rating_avg: 4.5 })]} />)
    await waitFor(() => expect(screen.getByText('4.5')).toBeInTheDocument())
  })

  it('muestra — cuando no hay rating', async () => {
    render(<VendorCardList vendors={[makeVendor({ rating_avg: null })]} />)
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument())
  })

  it('muestra el horario formateado', async () => {
    render(<VendorCardList vendors={[makeVendor()]} />)
    await waitFor(() => expect(screen.getByText('08:00 – 17:00')).toBeInTheDocument())
  })

  it('muestra múltiples vendors', async () => {
    const vendors = [
      makeVendor({ id: 'v1', business_name: 'Frisby' }),
      makeVendor({ id: 'v2', business_name: 'Cafecito' }),
    ]
    render(<VendorCardList vendors={vendors} />)
    await waitFor(() => {
      expect(screen.getByText('Frisby')).toBeInTheDocument()
      expect(screen.getByText('Cafecito')).toBeInTheDocument()
    })
  })

  it('no muestra vendors si la lista está vacía', async () => {
    render(<VendorCardList vendors={[]} />)
    await waitFor(() => expect(screen.queryByText('Frisby')).not.toBeInTheDocument())
  })
})