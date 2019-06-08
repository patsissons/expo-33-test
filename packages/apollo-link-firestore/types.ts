import {firestore} from 'firebase/app';
import {ExecInfo} from 'graphql-anywhere';
import {ZenObservable} from 'zen-observable-ts';

export enum FirestoreReferenceType {
  Collection = 'collection',
  Document = 'document',
}

export enum FirestoreMutationType {
  Add = 'add',
  Delete = 'delete',
  Set = 'set',
  Update = 'update',
}

export interface PathDirectiveArg {
  path?: string;
}

export interface TypeDirectiveArg {
  type?: string;
}

export interface RefDirectiveArgs extends firestore.GetOptions {}

export interface SnapshotDirectiveArg extends firestore.SnapshotOptions {}

export interface SubscribeDirectiveArg {
  subscribe?: boolean;
}

export interface RootTypeDirectiveArg {
  rootType: FirestoreReferenceType;
}

export interface CollectionDirectiveOrderByArgs {
  fieldPath: string;
  direction?: firestore.OrderByDirection;
}

export interface CollectionDirectiveWhereArgs {
  fieldPath: string;
  op: firestore.WhereFilterOp;
  val: boolean | number | string;
}

export interface CollectionQueryDirectiveArgs {
  endAt?: string;
  endBefore?: string;
  limit?: number;
  orderBy?: CollectionDirectiveOrderByArgs;
  startAfter?: string;
  startAt?: string;
  where?: CollectionDirectiveWhereArgs[];
}

export type FirestoreRefDirectiveArgs = PathDirectiveArg &
  TypeDirectiveArg &
  RefDirectiveArgs;

export type RootRefDirectiveArgs = FirestoreRefDirectiveArgs &
  RootTypeDirectiveArg;

export type RootQueryDirectiveArgs = RootRefDirectiveArgs &
  SubscribeDirectiveArg;

export type DocDirectiveArgs = RootQueryDirectiveArgs;

export type CollectionDirectiveArgs = RootQueryDirectiveArgs &
  CollectionQueryDirectiveArgs;

export type RefQueryDirectiveArgs = FirestoreRefDirectiveArgs &
  SubscribeDirectiveArg &
  CollectionQueryDirectiveArgs;

export interface MutationOptionsDirectiveArgs {
  dataArg?: Record<string, any>;
  dataVar?: string;
  merge?: boolean;
  mergeFields?: string[];
  mutationType: FirestoreMutationType;
}

export type MutationDirectiveArgs = RootRefDirectiveArgs &
  MutationOptionsDirectiveArgs;

export interface FieldDirectiveArgs extends SnapshotDirectiveArg {
  key?: string | true;
}

export type QueryDirectiveArgs = CollectionDirectiveArgs | DocDirectiveArgs;

export type FirestoreDirectiveArgs =
  | CollectionDirectiveArgs
  | DocDirectiveArgs
  | FieldDirectiveArgs
  | MutationDirectiveArgs
  | RefDirectiveArgs;

export interface FirestoreDirectives {
  field?: FieldDirectiveArgs;
  mutation?: MutationDirectiveArgs;
  query?: QueryDirectiveArgs;
  ref?: RefQueryDirectiveArgs;
}

export interface FirestoreExecInfo extends Omit<ExecInfo, 'directives'> {
  directives: FirestoreDirectives | null;
}

export type ResolverContextExports = Record<string, any>;

export type OnSnapshotSubscriber = ZenObservable.SubscriptionObserver<
  firestore.DocumentSnapshot | firestore.QuerySnapshot
>;

export interface ResolverContext {
  fields: ResolverContextExports;
  store: firestore.Firestore;
}

export interface QueryResolverContext extends ResolverContext {
  onSnapshot?: OnSnapshotSubscriber;
}

export interface MutationResolverContext extends ResolverContext {}

export type FirestoreReference =
  | firestore.CollectionReference
  | firestore.DocumentReference;

export interface ResolverRoot {
  __typename?: string;
  snapshot?: firestore.DocumentSnapshot;
}
