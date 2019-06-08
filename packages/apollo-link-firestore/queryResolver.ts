import {pascalCase} from 'change-case';
import {firestore} from 'firebase/app';
import {createQuery} from './createQuery';
import {
  ResolverRoot,
  QueryResolverContext,
  FirestoreExecInfo,
  FirestoreReferenceType,
  FirestoreReference,
  DocDirectiveArgs,
  CollectionDirectiveArgs,
  RefQueryDirectiveArgs,
  TypeDirectiveArg,
  CollectionQueryDirectiveArgs,
  SubscribeDirectiveArg,
  RefDirectiveArgs,
} from './types';

export function queryResolver(
  fieldName: string,
  {__typename, snapshot}: ResolverRoot,
  _args: any,
  context: QueryResolverContext,
  info: FirestoreExecInfo,
) {
  // debugger;
  const {fields, store} = context;
  const {directives} = info;

  if (directives && directives.query) {
    const {path = fieldName, rootType} = directives.query;
    const queryRef = refForPath(path, rootType, store);

    return queryRef instanceof firestore.CollectionReference
      ? resolveCollectionQuery(
          createQuery(
            directives.query as CollectionQueryDirectiveArgs,
            fields,
            queryRef,
          ),
          fieldName,
          context,
          directives.query,
        )
      : resolveDocQuery(queryRef, fieldName, context, directives.query);
  } else if (__typename && snapshot) {
    return resolveSnapshot(
      fieldName,
      {__typename, snapshot},
      _args,
      context,
      info,
    );
  }

  throw new Error('Invalid query: no snapshot or query directive');
}

export function refForPath(
  path: string,
  rootType: FirestoreReferenceType,
  store: firestore.Firestore,
) {
  if (!rootType) {
    throw new Error('rootType is required');
  }

  const [rootPath, ...pathElems] = path.split('.');
  return pathElems.reduce(
    (ref, pathElem) => {
      if (ref instanceof firestore.CollectionReference) {
        return ref.doc(pathElem);
      } else {
        return ref.collection(pathElem);
      }
    },
    (rootType === FirestoreReferenceType.Collection
      ? store.collection(rootPath)
      : store.doc(rootPath)) as FirestoreReference,
  );
}

export function resolveTypename({type}: TypeDirectiveArg, fieldName: string) {
  return type || pascalCase(fieldName.replace(/s$/i, ''));
}

export function resolveQuerySnapshot(
  ref: firestore.DocumentReference,
  context: QueryResolverContext,
  directive?: SubscribeDirectiveArg & RefDirectiveArgs,
): Promise<firestore.DocumentSnapshot>;
export function resolveQuerySnapshot(
  ref: firestore.Query,
  context: QueryResolverContext,
  directive?: SubscribeDirectiveArg & RefDirectiveArgs,
): Promise<firestore.QuerySnapshot>;
export function resolveQuerySnapshot(
  ref: any,
  {onSnapshot}: QueryResolverContext,
  {source, subscribe}: SubscribeDirectiveArg & RefDirectiveArgs = {},
) {
  if (onSnapshot && subscribe) {
    ref.onSnapshot(onSnapshot);
  }

  return ref.get({source});
}

export async function resolveCollectionQuery(
  query: firestore.Query,
  fieldName: string,
  context: QueryResolverContext,
  directive: CollectionDirectiveArgs | RefQueryDirectiveArgs = {},
) {
  const snapshot = await resolveQuerySnapshot(query, context, directive);

  return snapshot.docs.map<ResolverRoot>((doc) => ({
    __typename: resolveTypename(directive, fieldName),
    snapshot: doc,
  }));
}

export async function resolveDocQuery(
  ref: firestore.DocumentReference,
  fieldName: string,
  context: QueryResolverContext,
  directive: DocDirectiveArgs,
) {
  const snapshot = await resolveQuerySnapshot(ref, context, directive);

  return {
    __typename: resolveTypename(directive, fieldName),
    snapshot,
  };
}

export function resolveSnapshot(
  fieldName: string,
  {__typename, snapshot}: Required<ResolverRoot>,
  _args: any,
  context: QueryResolverContext,
  {directives, isLeaf}: FirestoreExecInfo,
) {
  const {fields} = context;

  if (isLeaf) {
    if (fieldName === '__typename') {
      return __typename;
    } else if (fieldName === 'id') {
      return snapshot.id;
    }

    const {key = undefined, serverTimestamps = undefined} =
      (directives && directives.field) || {};

    const result = snapshot.get(fieldName, {serverTimestamps});

    if (key) {
      fields[typeof key === 'string' ? key : fieldName] = result;
    }

    return result;
  } else {
    const directive = (directives && directives.ref) || {};

    return resolveCollectionQuery(
      createQuery(
        directive,
        fields,
        snapshot.ref.collection(directive.path || fieldName),
      ),
      fieldName,
      context,
      directives ? directives.ref : undefined,
    );
  }
}
