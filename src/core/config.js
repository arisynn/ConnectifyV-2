// ===================== BOARD DIMENSIONS =====================
export const ROWS = 10;
export const COLS = 6;

// ===================== SHOP CONFIGURATION =====================
export const SHOP_ITEMS = [];
export const THEME_BADGE_TEXT = "Eksklusif";

// ===================== THEMES =====================
export const THEMES = {};

export function getFallbackThemes() {
    return {
        sweets: { 
            name: 'Dessert (Basic)', price: 0, currency: 'coins', type: 'standar',
            data: ['🍰','🧁','🍩','🍪','🍫','🍬','🍭','🍮','🍯','🍨','🍧','🍦','🥧','🎂','🥐','🥞','🧇','🧋'],
            colors: { bg: '#fdf2f8', border: '#fbcfe8', text: '#ec4899', accent: '#ec4899', buttonActive: '#e11d48' }
        },
        custom: {
            name: 'Tema Pribadi', type: 'reward',
            data: [], // Users can fill this in
            backgroundOptions: [
                { bg: '#fdf4ff', border: '#f0abfc', text: '#db2777', accent: '#f472b6', buttonActive: '#be185d' }
            ],
            colors: { bg: '#fdf4ff', border: '#f0abfc', text: '#db2777', accent: '#f472b6', buttonActive: '#be185d' }
        }
    };
}

// ===================== BACKEND CONFIG =====================
export const PROFILE_API_URL = "/api/profile";
