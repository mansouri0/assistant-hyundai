const { processDTCs } = require('./modules/dtcProcessor');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./modules/promptBuilder');
const { generateDiagnostic } = require('./modules/ollamaClient');
async function runDiagnosticPipeline(inputData) {
    const processedCodes = processDTCs(inputData.errorCodes);
    const vehicleInfo = {
        ...inputData,
        errorCodes: processedCodes
    };
    const userPrompt = buildUserPrompt(vehicleInfo);
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
    ];
    console.log(`[Pipeline] Analysis starting for Hyundai ${inputData.model} (${inputData.year})`);
    try {
        const stream = await generateDiagnostic(messages);
        return stream;
    } catch (err) {
        console.error(`[Pipeline] AI Connection Failed: ${err.message}`);
        throw err;
    }
}
module.exports = { runDiagnosticPipeline };
