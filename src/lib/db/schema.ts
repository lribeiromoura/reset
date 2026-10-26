export * from "./auth-schema";
export * from "./domain-schema";
import * as authSchema from "./auth-schema";
import * as domainSchema from "./domain-schema";

export const schema = { ...authSchema, ...domainSchema };
