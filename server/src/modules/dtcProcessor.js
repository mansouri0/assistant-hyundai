const DTC_REGEX = /^[PCBU]\d{4}$/;
function processDTCs(rawCodes) {
    if (!rawCodes || typeof rawCodes !== 'string' || rawCodes.trim() === '') {
        return "None provided";
    }
    const codes = rawCodes
        .split(/[\s,]+/)
        .map(code => code.trim().toUpperCase())
        .filter(code => DTC_REGEX.test(code));
    return codes.length > 0 ? codes.join(', ') : "None provided";
}
module.exports = { processDTCs };
