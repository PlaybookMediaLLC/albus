import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("../database", () => ({ default: {} }));

const { tokenSignInUser } = await import("./quills-portal-session");

type User = { id: string; email: string; role?: string };
function adapter(state: {
  users: User[];
  accounts: { userId: string; providerId: string; accountId: string }[];
  createFails?: boolean;
}) {
  return {
    findAccountByKey: vi.fn(
      async ({ providerId, accountId }) =>
        state.accounts.find(
          (a) => a.providerId === providerId && a.accountId === accountId,
        ) ?? null,
    ),
    findUserById: vi.fn(
      async (id: string) => state.users.find((u) => u.id === id) ?? null,
    ),
    findUserByEmail: vi.fn(async (email: string) => {
      const user = state.users.find((u) => u.email === email);
      return user ? { user, accounts: [] } : null;
    }),
    createUser: vi.fn(async (data: { email: string }) => {
      if (state.createFails) throw new Error("Registration is closed");
      const user = { id: `u${state.users.length + 1}`, email: data.email };
      state.users.push(user);
      return user;
    }),
    createAccount: vi.fn(async (account) => {
      state.accounts.push(account);
      return account;
    }),
  };
}
const grant = {
  workspaceId: "w1",
  customerId: "c1",
  email: "ada@example.test",
  name: "Ada",
};
const portalOnly = async (user: { role?: unknown }) => user.role !== "member";

describe("tokenSignInUser", () => {
  it("creates a portal-only account for a new email and links it to the workspace customer", async () => {
    const state = { users: [] as User[], accounts: [] as never[] };
    const fake = adapter(state);
    const user = await tokenSignInUser(fake as never, grant, portalOnly);
    expect(user).toMatchObject({ email: "ada@example.test" });
    expect(state.accounts).toEqual([
      { userId: user!.id, providerId: "quills-portal", accountId: "w1:c1" },
    ]);
    // The next sign-in finds the same account through its link.
    expect(await tokenSignInUser(fake as never, grant, portalOnly)).toEqual(
      user,
    );
    expect(fake.createUser).toHaveBeenCalledTimes(1);
  });

  it("never signs in to an account it did not create, or one that joined a team", async () => {
    const existing = adapter({
      users: [{ id: "u9", email: "ada@example.test" }],
      accounts: [],
    });
    expect(
      await tokenSignInUser(existing as never, grant, portalOnly),
    ).toBeNull();
    expect(existing.createUser).not.toHaveBeenCalled();

    // Another workspace's token for the same email: its account is not this customer's.
    const otherWorkspace = adapter({
      users: [{ id: "u1", email: "ada@example.test" }],
      accounts: [
        { userId: "u1", providerId: "quills-portal", accountId: "w2:c7" },
      ],
    });
    expect(
      await tokenSignInUser(otherWorkspace as never, grant, portalOnly),
    ).toBeNull();

    const joined = adapter({
      users: [{ id: "u1", email: "ada@example.test", role: "member" }],
      accounts: [
        { userId: "u1", providerId: "quills-portal", accountId: "w1:c1" },
      ],
    });
    expect(
      await tokenSignInUser(joined as never, grant, portalOnly),
    ).toBeNull();
  });

  it("sends the person to the Kaneo sign-in when the instance refuses the new account", async () => {
    const closed = adapter({ users: [], accounts: [], createFails: true });
    expect(
      await tokenSignInUser(closed as never, grant, portalOnly),
    ).toBeNull();
  });
});
