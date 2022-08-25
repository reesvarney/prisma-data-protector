// This is not good practice to rely on, should just be used as a final line of defence to prevent data leaks
/**
 * Prisma middleware to filter out certain fields when a SELECT parameter is not specified on a query
 * @param {Object} models (Prisma.dmmf.datamodel.models) - Provides the fields to be included
 * @param {Object[]} data Dictionary of fields to filter out for each model
 * @param {Object} options Options for the middleware
 * @param {Boolean} options.warn Whether to log a warning when a query is filtered, default is true
 * @returns Prisma Middleware
 */
export function protectData(models, data: {[model: string]: {[field: string]: boolean}}, {warn=true}){

  function filterModel(model: string, exclude: {[field: string]: boolean}){
    if(warn) console.warn(`⚠️ Warning: Prisma query on "${model}" model is missing a select parameter, the following sensitive fields are being excluded:`, exclude);
    const fields = models.find(a => a.name === model)?.fields ?? [];
    const selectData: {[field: string]: boolean} = {};
    for(const field of fields){
      if(field.kind === "object"){
        continue;
      }
      selectData[field.name] = !exclude[field.name] ?? true;
    }
    return selectData;
  }
  
  return async (params, next)=>{
    if(params.action.includes("find")){
      // If primary model needs to be filtered
      if(data[params.model] !== undefined && params.args.select === undefined){
        params.args.select = filterModel(params.model, data[params.model])
      }
      // todo - if select already exists, detect if field in select is a object or scalar value
      // if it is an object (relation) value, check if it needs to be filtered

      // if included model needs to be filtered
      if(params.args.include !== undefined){
        if(params.args.select === undefined){
          params.args.select = filterModel(params.model, {});
        }
        for(const model of Object.keys(params.args.include)){
          if(data[model] === undefined || params.args.include[model].select !== undefined || model[0] === "_"){
            params.args.select[model] = params.args.include[model];
            continue;
          }
          params.args.select[model] = filterModel(model, data[model]);
        }
      }
    }
    params.args.include = undefined;
    return await next(params)
  }
}