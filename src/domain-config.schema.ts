import { z } from 'zod';

const requiredString = (fieldName: string) =>
  z
    .string({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a string`,
    })
    .trim()
    .min(1, `${fieldName} cannot be empty`);

export const domainInjectItemSchema = z.object({
  type: requiredString('inject[].type'),
  name: requiredString('inject[].name'),
  property: requiredString('inject[].property').regex(
    /^[A-Za-z_$][A-Za-z0-9_$]*$/,
    'inject[].property must be a valid TypeScript identifier',
  ),
  providerKey: requiredString('inject[].providerKey'),
});

export const domainContextConfigSchema = z.object({
  context: requiredString('context'),
  inject: z
    .array(domainInjectItemSchema, {
      invalid_type_error: 'inject must be an array',
    })
    .min(1, 'inject must contain at least one dependency'),
});

export const domainModuleRegisterSchema = z
  .object({
    configs: z.array(domainContextConfigSchema, {
      invalid_type_error: 'configs must be an array',
    }),
    imports: z
      .array(z.unknown(), {
        invalid_type_error: 'imports must be an array',
      })
      .optional(),
    providers: z
      .array(z.unknown(), {
        invalid_type_error: 'providers must be an array',
      })
      .optional(),
    providerTokens: z.record(z.string(), z.unknown(), {
      invalid_type_error: 'providerTokens must be an object map',
      required_error: 'providerTokens is required',
    }),
  })
  .superRefine((value, ctx) => {
    const contextSeen = new Set<string>();
    const providerTokenKeys = new Set(Object.keys(value.providerTokens));

    value.configs.forEach((config, configIndex) => {
      if (contextSeen.has(config.context)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['configs', configIndex, 'context'],
          message: `duplicate context "${config.context}"`,
        });
      }
      contextSeen.add(config.context);

      const propertySeen = new Set<string>();
      config.inject.forEach((injectItem, injectIndex) => {
        if (propertySeen.has(injectItem.property)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['configs', configIndex, 'inject', injectIndex, 'property'],
            message: `duplicate property "${injectItem.property}" in context "${config.context}"`,
          });
        }
        propertySeen.add(injectItem.property);

        if (!providerTokenKeys.has(injectItem.providerKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              'configs',
              configIndex,
              'inject',
              injectIndex,
              'providerKey',
            ],
            message: `providerKey "${injectItem.providerKey}" is not registered in providerTokens`,
          });
        }
      });
    });
  });

export type DomainInjectItemConfig = Readonly<{
  type: string;
  name: string;
  property: string;
  providerKey: string;
}>;

export type DomainContextConfig = Readonly<{
  context: string;
  inject: readonly DomainInjectItemConfig[];
}>;

export type DomainModuleRegisterInput = Readonly<{
  configs: readonly DomainContextConfig[];
  imports?: readonly unknown[];
  providers?: readonly unknown[];
  providerTokens: Record<string, unknown>;
}>;
