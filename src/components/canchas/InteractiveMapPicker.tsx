import * as React from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Configuración de iconos de Leaflet para evitar problemas de rutas de Vite
const customMarkerIcon = L.divIcon({
  className: "custom-map-pin",
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 14px;
        height: 14px;
        background: rgba(37, 99, 235, 0.35);
        border-radius: 50%;
        bottom: 2px;
        filter: blur(2px);
      "></div>
      <div style="
        width: 28px;
        height: 28px;
        background: #2563eb;
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 30],
  popupAnchor: [0, -30],
})

interface InteractiveMapPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
  onAddressLookup?: (lat: number, lng: number) => void
  height?: string | number
  className?: string
  readOnly?: boolean
}

function MapEventsHandler({
  onChange,
  onAddressLookup,
  readOnly,
}: {
  onChange: (lat: number, lng: number) => void
  onAddressLookup?: (lat: number, lng: number) => void
  readOnly?: boolean
}) {
  useMapEvents({
    click(e) {
      if (readOnly) return
      const { lat, lng } = e.latlng
      const roundLat = Number(lat.toFixed(6))
      const roundLng = Number(lng.toFixed(6))
      onChange(roundLat, roundLng)
      if (onAddressLookup) {
        onAddressLookup(roundLat, roundLng)
      }
    },
  })
  return null
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap()
  React.useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export function InteractiveMapPicker({
  lat,
  lng,
  onChange,
  onAddressLookup,
  height = 240,
  className = "",
  readOnly = false,
}: InteractiveMapPickerProps) {
  const validLat = typeof lat === "number" && !isNaN(lat) ? lat : 9.9333
  const validLng = typeof lng === "number" && !isNaN(lng) ? lng : -84.0722
  const position: [number, number] = [validLat, validLng]

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-border shadow-inner isolate ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position} />
        <MapEventsHandler
          onChange={onChange}
          onAddressLookup={onAddressLookup}
          readOnly={readOnly}
        />
        <Marker
          position={position}
          icon={customMarkerIcon}
          draggable={!readOnly}
          eventHandlers={{
            dragend(e) {
              if (readOnly) return
              const marker = e.target
              const pos = marker.getLatLng()
              const roundLat = Number(pos.lat.toFixed(6))
              const roundLng = Number(pos.lng.toFixed(6))
              onChange(roundLat, roundLng)
              if (onAddressLookup) {
                onAddressLookup(roundLat, roundLng)
              }
            },
          }}
        />
      </MapContainer>

      {!readOnly && (
        <div className="absolute top-2 right-2 z-[1000] bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-medium border border-border text-foreground shadow-xs pointer-events-none">
          📍 Haz clic o arrastra el marcador para fijar la ubicación
        </div>
      )}
    </div>
  )
}
