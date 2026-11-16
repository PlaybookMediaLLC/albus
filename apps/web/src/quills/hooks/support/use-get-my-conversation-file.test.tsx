import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getMyConversationFileFixture } from "../../api/support/get-my-conversation-file.fixture";
import { useGetMyConversationFile } from "./use-get-my-conversation-file";
describe("useGetMyConversationFile", () => {
  describeHookContract({
    kind: "query",
    hook: useGetMyConversationFile,
    operationId: "getQuillsMyConversationFile",
    request: {
      param: {
        workspace: "workspace_test_1",
        conversationId: "conversation-id_test_1",
        fileId: "file-id_test_1",
      },
    },
    emptyRequest: {
      param: {
        workspace: "",
        conversationId: "conversation-id_test_1",
        fileId: "file-id_test_1",
      },
    },
    response: getMyConversationFileFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
