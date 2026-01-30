/* eslint-disable @typescript-eslint/no-explicit-any */

export type PromiseResolveFn<T> = (value: T | PromiseLike<T>) => void;
export type PromiseRejectFn = (reason?: any) => void;

export interface PromiseWithResolvers<T, P extends Promise<T> = Promise<T>> {
  promise: P;
  resolve: PromiseResolveFn<T>;
  reject: PromiseRejectFn;
}

export type PromiseWithResolversBase<P extends Promise<any>> = {
  new (executor: (resolve: any, reject: any) => any): P;
};

export type PromiseWithResolversFromBase<B> =
  B extends PromiseWithResolversBase<infer P>
    ? P extends Promise<infer J>
      ? PromiseWithResolvers<J, P>
      : never
    : never;

export function createPromiseWithResolvers<T>(): PromiseWithResolvers<
  T,
  Promise<T>
>;
export function createPromiseWithResolvers<
  B extends PromiseWithResolversBase<any>,
>(base: B): PromiseWithResolversFromBase<B>;
export function createPromiseWithResolvers<
  T,
  B extends PromiseWithResolversBase<any>,
>(
  base?: B,
): PromiseWithResolvers<T, PromiseWithResolversFromBase<B>["promise"]> {
  let resolve: PromiseResolveFn<T> | undefined;
  let reject: PromiseRejectFn | undefined;

  const promise = new (base || Promise)((resolveFn, rejectFn) => {
    resolve = resolveFn;
    reject = rejectFn;
  });

  if (!resolve || !reject) {
    throw new Error(`Missing Resolvers`);
  }

  return {
    promise,
    resolve,
    reject,
  };
}
