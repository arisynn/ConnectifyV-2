// ===================== FORMATTING HELPERS =====================
export const formatNumber = (num) => {
    if (num >= 1000000) {
        return Number((num / 1000000).toFixed(1)) + 'M';
    } else if (num >= 1000) {
        return Number((num / 1000).toFixed(1)) + 'k';
    }
    return new Intl.NumberFormat('id-ID').format(num);
};
