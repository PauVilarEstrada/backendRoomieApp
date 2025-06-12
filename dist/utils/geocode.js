"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = void 0;
const axios_1 = __importDefault(require("axios"));
const geocodeAddress = async (address) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
        const res = await axios_1.default.get(url);
        const result = res.data.results?.[0];
        if (!result) {
            console.warn('[GEOCODE] No se encontraron coordenadas para:', address);
            return null;
        }
        const { lat, lng } = result.geometry.location;
        return { lat, lng };
    }
    catch (err) {
        console.error('[GEOCODE ERROR]', err);
        return null;
    }
};
exports.geocodeAddress = geocodeAddress;
