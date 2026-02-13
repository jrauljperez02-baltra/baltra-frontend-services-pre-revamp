'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY as apiKey } from '@/config/env';

export type MapsLinkJson = {
    queryLink: string;
    latLngLink: string;
};

export type InterviewAddressJson = {
    place_id?: string;
    formatted_address?: string;
    components: {
        street_number?: string;
        route?: string;
        neighborhood?: string;
        locality?: string;
        admin_area_level_1?: string;
        country?: string;
        postal_code?: string;
    };
};

export type GoogleMapsAddressValue = {
    latitude: number;
    longitude: number;
    address: string;
    interview_address_json: InterviewAddressJson;
    maps_link_json: MapsLinkJson;
};

interface Props {
    label: string;
    value?: Partial<GoogleMapsAddressValue>;
    onChange: (val: GoogleMapsAddressValue) => void;
    required?: boolean;
    mapHeight?: number;
    zoom?: number;
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 19.432608, lng: -99.133209 };

export default function GoogleMapsInput({
    label,
    value,
    onChange,
    required,
    mapHeight = 260,
    zoom = 15,
}: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mapRef = useRef<HTMLDivElement | null>(null);

    const mapInstance = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const [ready, setReady] = useState(false);

    const currentCenter = useMemo<google.maps.LatLngLiteral>(() => {
        if (value?.latitude && value?.longitude) return { lat: value.latitude, lng: value.longitude };
        return DEFAULT_CENTER;
    }, [value?.latitude, value?.longitude]);

    useEffect(() => {
        if (!apiKey) {
            console.warn('Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
            return;
        }

        const loader = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['places'],
        });

        (async () => {
            const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary;
            const { Marker } = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary;
            const { Geocoder } = (await loader.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
            const { Autocomplete } = (await loader.importLibrary('places')) as google.maps.PlacesLibrary;

            if (mapRef.current) {
                mapInstance.current = new Map(mapRef.current, {
                    center: currentCenter,
                    zoom,
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                });

                markerRef.current = new Marker({
                    position: currentCenter,
                    map: mapInstance.current,
                    draggable: true,
                });

                geocoderRef.current = new Geocoder();

                markerRef.current.addListener('dragend', async () => {
                    const pos = markerRef.current!.getPosition();
                    if (!pos) return;
                    const lat = pos.lat();
                    const lng = pos.lng();
                    const addr = await reverseGeocode(lat, lng);
                    commitChange(lat, lng, addr);
                });
            }

            if (inputRef.current) {
                autocompleteRef.current = new Autocomplete(inputRef.current, {
                    fields: ['formatted_address', 'geometry', 'address_components', 'place_id', 'name'],
                });

                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current!.getPlace();
                    if (!place || !place.geometry || !place.geometry.location) return;

                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    mapInstance.current?.panTo({ lat, lng });
                    mapInstance.current?.setZoom(zoom);
                    markerRef.current?.setPosition({ lat, lng });

                    const addr = place.formatted_address || place.name || '';
                    commitChange(lat, lng, addr, place);
                });
            }

            setReady(true);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (!ready) return;
            if (value?.address && (!value.latitude || !value.longitude)) {
                const coords = await forwardGeocode(value.address);
                if (coords) {
                    mapInstance.current?.panTo(coords);
                    mapInstance.current?.setZoom(zoom);
                    markerRef.current?.setPosition(coords);
                    const addr = await reverseGeocode(coords.lat, coords.lng);
                    commitChange(coords.lat, coords.lng, addr);
                }
            } else if (value?.latitude && value?.longitude) {
                const coords = { lat: value.latitude, lng: value.longitude };
                mapInstance.current?.panTo(coords);
                mapInstance.current?.setZoom(zoom);
                markerRef.current?.setPosition(coords);
            }
        })();
    }, [ready]);

    function parseAddressComponents(components?: google.maps.GeocoderAddressComponent[]): InterviewAddressJson['components'] {
        const find = (type: string) => components?.find(c => c.types.includes(type))?.long_name;
        return {
            street_number: find('street_number'),
            route: find('route'),
            neighborhood: find('sublocality') || find('neighborhood'),
            locality: find('locality') || find('postal_town'),
            admin_area_level_1: find('administrative_area_level_1'),
            country: find('country'),
            postal_code: find('postal_code'),
        };
    }

    function formatCoord(n: number) {
        return Number(n.toFixed(6));
    }

    function makeMapsLinks(lat: number, lng: number, place_id?: string): MapsLinkJson {
        const shortLat = formatCoord(lat);
        const shortLng = formatCoord(lng);

        if (place_id) {
            const queryLink = `https://maps.google.com/?q=place_id:${place_id}`;
            const latLngLink = `https://maps.google.com/?q=${shortLat},${shortLng}`;
            return { queryLink, latLngLink };
        }

        const url = `https://maps.google.com/?q=${shortLat},${shortLng}`;
        return { queryLink: url, latLngLink: url };
    }

    function commitChange(
        lat: number,
        lng: number,
        formattedAddress: string,
        place?: google.maps.places.PlaceResult | google.maps.GeocoderResult
    ) {
        const place_id =
            (place as google.maps.places.PlaceResult)?.place_id ||
            (place as google.maps.GeocoderResult)?.place_id;

        const address_components =
            (place as google.maps.places.PlaceResult)?.address_components ||
            (place as google.maps.GeocoderResult)?.address_components ||
            [];

        const interview_address_json: InterviewAddressJson = {
            place_id,
            formatted_address: formattedAddress,
            components: parseAddressComponents(address_components),
        };

        const maps_link_json = makeMapsLinks(lat, lng, place_id);

        onChange({
            latitude: lat,
            longitude: lng,
            address: formattedAddress,
            interview_address_json,
            maps_link_json,
        });
    }

    async function reverseGeocode(lat: number, lng: number): Promise<string> {
        if (!geocoderRef.current) return '';
        const res = await geocoderRef.current.geocode({ location: { lat, lng } });
        if (res.results && res.results.length > 0) {
            const best = res.results[0];
            // Actualizamos todo además de devolver el string
            commitChange(lat, lng, best.formatted_address, best);
            return best.formatted_address;
        }
        return '';
    }

    async function forwardGeocode(address: string): Promise<google.maps.LatLngLiteral | null> {
        if (!geocoderRef.current) return null;
        const res = await geocoderRef.current.geocode({ address });
        if (res.results && res.results.length > 0) {
            const loc = res.results[0].geometry.location;
            return { lat: loc.lat(), lng: loc.lng() };
        }
        return null;
    }

    return (
        <div>
            <label className="block mb-2 text-sm font-medium">
                {label} {required && <span className="text-red-600">*</span>}
            </label>

            <input
                ref={inputRef}
                type="text"
                defaultValue={value?.address || ''}
                placeholder="Buscar dirección..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />

            <div
                ref={mapRef}
                className="w-full border border-gray-300 rounded-md mt-3"
                style={{ height: mapHeight }}
            />

            <p className="text-xs text-gray-500 mt-2">
                Busca una dirección o arrastra el marcador para ajustar la ubicación.
            </p>
        </div>
    );
}
