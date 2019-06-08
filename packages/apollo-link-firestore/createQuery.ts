import {firestore} from 'firebase/app';
import {CollectionQueryDirectiveArgs, ResolverContextExports} from './types';

type Operation<T = any> = {
  arg: T;
  op(query: firestore.Query, arg: NonNullable<T>): firestore.Query;
};

function applyOperations(
  collectionRef: firestore.CollectionReference,
  ...operations: Operation[]
) {
  return operations.reduce<firestore.CollectionReference | firestore.Query>(
    (query, {arg, op}) => (arg ? op(query, arg) : query),
    collectionRef,
  );
}

function operation<T>(
  arg: T,
  op: (query: firestore.Query, arg: NonNullable<T>) => firestore.Query,
): Operation<T> {
  return {arg, op};
}

const exportRegex = /\$fields\{(\w+)\}/;

function preprocessExports(
  args: {[key: string]: any},
  fields: ResolverContextExports,
  ref?: firestore.CollectionReference,
) {
  Object.entries(args).forEach(([arg, val]) => {
    // process fields in variables with function resolver
    // e.g., {userPath: (({fields}) => `/users/${fields.userId}`)};
    if (typeof val === 'function') {
      args[arg] = val({ref, fields});
    }
    // simple replacement
    // e.g., startAt: "user-$fields.userId"
    else if (typeof val === 'string') {
      const match = val.match(exportRegex);

      if (match) {
        const key = match[1];

        if (fields[key]) {
          args[arg] = val.replace(exportRegex, fields[key]);
        }
      }
    }

    // complex replacement
    // e.g., where: { path: "age", op: ">=", val: "$fields{minAge}" }
    else if (typeof val === 'object') {
      Object.entries(val).forEach(([paramArg, paramVal]) => {
        if (typeof paramVal === 'string') {
          const match = paramVal.match(exportRegex);

          if (match) {
            const key = match[1];

            if (fields[key]) {
              args[arg][paramArg] = paramVal.replace(exportRegex, fields[key]);
            }
          }
        }
      });
    }
  });

  return args;
}

export function createQuery(
  args: CollectionQueryDirectiveArgs,
  fields: ResolverContextExports,
  collectionRef: firestore.CollectionReference,
) {
  preprocessExports(args, fields, collectionRef);

  return applyOperations(
    collectionRef,

    // window
    operation(args.endAt, (query, docPath) =>
      query.endAt(collectionRef.doc(docPath)),
    ),
    operation(args.endBefore, (query, docPath) =>
      query.endBefore(collectionRef.doc(docPath)),
    ),
    operation(args.startAfter, (query, docPath) =>
      query.startAfter(collectionRef.doc(docPath)),
    ),
    operation(args.startAt, (query, docPath) =>
      query.startAt(collectionRef.doc(docPath)),
    ),

    // filter
    operation(args.where, (query, conditions) => {
      return conditions.reduce(
        (subQuery, {op, fieldPath, val}) => subQuery.where(fieldPath, op, val),
        query,
      );
    }),

    // order
    operation(args.orderBy, (query, {direction, fieldPath}) =>
      query.orderBy(fieldPath, direction),
    ),

    // limit
    operation(args.limit, (query, limit) => query.limit(limit)),
  );
}
