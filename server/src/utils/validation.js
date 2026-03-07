function validateResponse(data) {
    if (!data || !Array.isArray(data.diagnostics)) {
        throw new Error("Invalid structure: Missing 'diagnostics' array.");
    }
    if (data.diagnostics.length === 0) {
        throw new Error("Invalid structure: 'diagnostics' array is empty.");
    }
    data.diagnostics.forEach((item, index) => {
        if (!item.cause || typeof item.cause !== 'string') {
            throw new Error(`Item ${index}: Missing or invalid 'cause'.`);
        }
        if (!item.fix || typeof item.fix !== 'string') {
            throw new Error(`Item ${index}: Missing or invalid 'fix'.`);
        }
        if (!item.practice || typeof item.practice !== 'string') {
            throw new Error(`Item ${index}: Missing or invalid 'practice'.`);
        }
        if (typeof item.certainty !== 'number' || item.certainty < 0 || item.certainty > 100) {
            throw new Error(`Item ${index}: Invalid 'certainty' score (must be 0-100).`);
        }
    });
    return data;
}
module.exports = { validateResponse };
