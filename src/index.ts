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
  function filterModel(model: string){
    if(warn) console.warn(`⚠️ Warning: Prisma query on "${model}" model is missing a select parameter, the following sensitive fields are being excluded:`, data[model]);
    const fields = models.find(a => a.name === model)?.fields ?? [];
    const selectData: {[field: string]: boolean} = {};
    for(const field of fields){
      if(field.kind === "object"){
        continue;
      }
      selectData[field.name] = !data[field.name] ?? true;
    }
    return selectData;
  }
  
  function checkObject(model, objectData){
    // if its true just filter and return
    if(objectData === true){
      return filterModel(model);
    }

    // Else we need to check for select/ include properties
    for(const propertyName of ["include", "select"]){
      if(objectData[propertyName] !== undefined){
        const modelFields = models.find(a => a.name === model)?.fields ?? [];
  
        // Loop through each field inside the select
        for(const field of Object.keys(objectData[propertyName])){
          const selectField = modelFields.find(a => a.name === field);
  
          // If the field is an object (relation)
          if(selectField?.kind === "object"){
  
            // If its not a filtered model, skip it
            if(data[selectField.type] === undefined){
              continue;
            }
  
            objectData.select[field] = checkObject(selectField.type, objectData[propertyName][field]);
          };
        }
      }
    }
    objectData.include = undefined;
    return objectData;
  }

  return async (params, next)=>{
    if(params.action.includes("find")){

      // If primary model needs to be filtered
      if(data[params.model] !== undefined && params.args.select === undefined){
        params.args.select = filterModel(params.model)
        // Don't check select
        return await next(params)
      }

      params.args = checkObject(params.model, params.args);
    }

    return await next(params)
  }
}