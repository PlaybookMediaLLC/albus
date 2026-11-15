import { describeRedirectContract } from "@/quills/test/contracts";
import { Route } from "./index";
describeRedirectContract({
  Route,
  params: { workspaceId: "workspace_test_1" },
  expectedTo: "/feedback/$workspaceId/settings/boards",
});
