import axios from 'axios'

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

  try {
    const res = await axios.get(url)
    const result = res.data.results?.[0]

    if (!result) {
      console.warn('[GEOCODE] No se encontraron coordenadas para:', address)
      return null
    }

    const { lat, lng } = result.geometry.location
    return { lat, lng }
  } catch (err) {
    console.error('[GEOCODE ERROR]', err)
    return null
  }
}
