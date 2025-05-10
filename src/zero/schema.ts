// These data structures define your client-side schema.
// They must be equal to or a subset of the server-side schema.
// Note the "relationships" field, which defines first-class
// relationships between tables.
// See https://github.com/rocicorp/mono/blob/main/apps/zbugs/schema.ts
// for more complex examples, including many-to-many.

import {
  ANYONE_CAN,
  definePermissions,
  ExpressionBuilder,
  PermissionsConfig,
  Row,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

export type Message = Row<typeof schema.tables.messages>;
export type Medium = Row<typeof schema.tables.mediums>;
export type User = Row<typeof schema.tables.users>;

// The contents of your decoded JWT.
type AuthData = {
  sub: string | null;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfLoggedIn = (
    authData: AuthData,
    { cmpLit }: ExpressionBuilder<Schema, keyof Schema["tables"]>
  ) => cmpLit(authData.sub, "IS NOT", null);

  const allowIfMessageSender = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, "messages">
  ) => cmp("senderId", "=", authData.sub ?? "");

  return {
    mediums: {
      row: {
        select: ANYONE_CAN,
      },
    },
    users: {
      row: {
        select: ANYONE_CAN,
      },
    },
    messages: {
      row: {
        // anyone can insert
        insert: ANYONE_CAN,
        update: {
          // sender can only edit own messages
          preMutation: [allowIfMessageSender],
          // sender can only edit messages to be owned by self
          postMutation: [allowIfMessageSender],
        },
        // must be logged in to delete
        delete: [allowIfLoggedIn],
        // everyone can read current messages
        select: ANYONE_CAN,
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
