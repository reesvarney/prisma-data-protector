/**
 * Prisma middleware to filter out certain fields when a SELECT parameter is not specified on a query
 * @param {Object} models (Prisma.dmmf.datamodel.models) - Provides the fields to be included
 * @param {Object[]} data Dictionary of fields to filter out for each model
 * @param {Object} options Options for the middleware
 * @param {Boolean} options.warn Whether to log a warning when a query is filtered, default is true
 * @returns Prisma Middleware
 */
export declare function protectData(models: any, data: {
    [model: string]: {
        [field: string]: boolean;
    };
}, { warn }: {
    warn?: boolean;
}): (params: any, next: any) => Promise<any>;
