# Prisma Data Protector Middleware
This is an extra line of defence to protect sensitive data in your database from being leaked due to dev laziness. It works by applying a default `select` parameter to queries which do not contain one to filter out certain supplied fields. To access the "protected" data simply include it in a `select` on your query.

This should not be relied on as an excuse to not be careful when you select data, aside from the many performance drawbacks of retrieving every field there are probably some edge cases where it may not work.

## Usage
```js
import {Prisma, PrismaClient} from "@prisma/client";
import {protectData} from 'prisma-data-protector';

const db = new PrismaClient()

db.$use(protectData(Prisma.dmmf.datamodel.models, {
  // Data you want to protect
  User: {
    password: true
  }
}, {
  warn: true // Gives console warning when protected data is filtered
}));
```

## Supported Queries
Currently the middleware supports `findUnique`, `findMany` and `findFirst`.

## Todo
 - Deeply nested includes
 - Filter relations included through the `select` parameter