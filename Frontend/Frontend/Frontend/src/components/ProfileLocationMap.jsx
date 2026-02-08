import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon issues in React-Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Ensure the default icon is set correctly
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map view when props change
function MapUpdater({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
}

const ProfileLocationMap = ({ lat, lng }) => {
    if (!lat || !lng) return null;

    return (
        <div className="rounded-xl overflow-hidden mt-3 border border-white/10 relative z-0" style={{ height: "150px", width: "100%" }}>
            <MapContainer
                center={[lat, lng]}
                zoom={13}
                scrollWheelZoom={false}
                zoomControl={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} />
                <MapUpdater lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
};

export default ProfileLocationMap;
