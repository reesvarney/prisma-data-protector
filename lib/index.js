"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectData = void 0;
// This is not good practice to rely on, should just be used as a final line of defence to prevent data leaks
/**
 * Prisma middleware to filter out certain fields when a SELECT parameter is not specified on a query
 * @param {Object} models (Prisma.dmmf.datamodel.models) - Provides the fields to be included
 * @param {Object[]} data Dictionary of fields to filter out for each model
 * @param {Object} options Options for the middleware
 * @param {Boolean} options.warn Whether to log a warning when a query is filtered, default is true
 * @returns Prisma Middleware
 */
function protectData(models, data, { warn = true }) {
    function filterModel(model) {
        var _a, _b, _c;
        if (warn)
            console.warn(`⚠️ Warning: Prisma query on "${model}" model is missing a select parameter, the following sensitive fields are being excluded:`, data[model]);
        const fields = (_b = (_a = models.find(a => a.name === model)) === null || _a === void 0 ? void 0 : _a.fields) !== null && _b !== void 0 ? _b : [];
        const selectData = {};
        for (const field of fields) {
            if (field.kind === "object") {
                continue;
            }
            selectData[field.name] = (_c = !data[field.name]) !== null && _c !== void 0 ? _c : true;
        }
        return selectData;
    }
    function checkObject(model, objectData) {
        var _a, _b;
        // if its true just filter and return
        if (objectData === true) {
            return filterModel(model);
        }
        // Else we need to check for select/ include properties
        for (const propertyName of ["include", "select"]) {
            if (objectData[propertyName] !== undefined) {
                const modelFields = (_b = (_a = models.find(a => a.name === model)) === null || _a === void 0 ? void 0 : _a.fields) !== null && _b !== void 0 ? _b : [];
                // Loop through each field inside the select
                for (const field of Object.keys(objectData[propertyName])) {
                    const selectField = modelFields.find(a => a.name === field);
                    // If the field is an object (relation)
                    if ((selectField === null || selectField === void 0 ? void 0 : selectField.kind) === "object") {
                        // If its not a filtered model, skip it
                        if (data[selectField.type] === undefined) {
                            continue;
                        }
                        objectData.select[field] = checkObject(selectField.type, objectData[propertyName][field]);
                    }
                    ;
                }
            }
        }
        objectData.include = undefined;
        return objectData;
    }
    return async (params, next) => {
        if (params.action.includes("find")) {
            // If primary model needs to be filtered
            if (data[params.model] !== undefined && params.args.select === undefined) {
                params.args.select = filterModel(params.model);
                // Don't check select
                return await next(params);
            }
            params.args = checkObject(params.model, params.args);
        }
        return await next(params);
    };
}
exports.protectData = protectData;
