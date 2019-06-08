import {firestore} from 'firebase/app';
import {
  refForPath,
  resolveDocQuery,
  resolveSnapshot,
  resolveTypename,
} from './queryResolver';
import {
  FirestoreExecInfo,
  FirestoreMutationType,
  FirestoreReference,
  MutationResolverContext,
  ResolverRoot,
  MutationDirectiveArgs,
  FirestoreReferenceType,
} from './types';

export async function mutationResolver(
  fieldName: string,
  {__typename, snapshot}: ResolverRoot,
  args: Record<string, any> | null,
  context: MutationResolverContext,
  info: FirestoreExecInfo,
) {
  const {store} = context;
  const {directives} = info;

  if (directives && directives.mutation) {
    const {
      dataArg,
      dataVar = 'input',
      mutationType,
      path = fieldName,
      rootType,
      ...directive
    } = directives.mutation;

    if (!mutationType) {
      throw new Error('mutationType is required');
    }

    const data = dataArg || (args && args[dataVar]);

    if (!data) {
      throw new Error('mutation requires a valid dataArg or dataVar');
    }

    const docRef = await resolveMutation(
      mutationRefForPath(path, rootType, store, mutationType, data),
      data,
      directives.mutation,
    );

    if (mutationType === FirestoreMutationType.Delete) {
      return {
        __typename: resolveTypename(directive, fieldName),
        id: docRef.id,
      };
    }

    return resolveDocQuery(docRef, fieldName, context, directives.mutation);
  } else if (__typename && snapshot) {
    return resolveSnapshot(
      fieldName,
      {__typename, snapshot},
      args,
      context,
      info,
    );
  }

  throw new Error('Invalid mutation: no snapshot or mutation directive');
}

export function mutationRefForPath(
  path: string,
  rootType: FirestoreReferenceType,
  store: firestore.Firestore,
  mutationType: FirestoreMutationType,
  {id}: Record<string, any>,
) {
  const ref = refForPath(path, rootType, store);

  if (
    ref instanceof firestore.CollectionReference &&
    mutationType !== FirestoreMutationType.Add
  ) {
    return ref.doc(id);
  }

  return ref;
}

async function resolveMutation(
  mutationRef: FirestoreReference,
  data: Record<string, any>,
  {merge, mergeFields, mutationType}: MutationDirectiveArgs,
) {
  if (mutationRef instanceof firestore.CollectionReference) {
    if (mutationType !== FirestoreMutationType.Add) {
      throw new Error(
        'Invalid Mutation: collection reference only supports the add mutation',
      );
    }

    return mutationRef.add(data);
  }

  if (mutationType === FirestoreMutationType.Add) {
    throw new Error(
      'Invalid Mutation: document reference does not support the add mutation',
    );
  }

  switch (mutationType) {
    case FirestoreMutationType.Delete:
      await mutationRef.delete();
      break;
    case FirestoreMutationType.Set:
      await mutationRef.set(data, {
        merge: Boolean(merge || mergeFields),
        mergeFields,
      });
      break;
    case FirestoreMutationType.Update:
      await mutationRef.update(data);
      break;
  }

  return mutationRef;
}
