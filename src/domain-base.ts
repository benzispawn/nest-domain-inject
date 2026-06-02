export abstract class DomainBase<TDomain extends object> {
  protected get $(): TDomain {
    return this as unknown as TDomain;
  }
}
