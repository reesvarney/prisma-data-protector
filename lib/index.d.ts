/**
 *
 * @param models (Prisma.dmmf.datamodel.models) - Provides the fields to be included
 * @param data Dictionary of fields to filter out for each model
 * @returns Prisma Middleware
 */
export declare function protectData(models: any, data: {
    [model: string]: {
        [field: string]: boolean;
    };
}, { warn }: {
    warn?: boolean;
}): (params: any, next: any) => Promise<any>;
