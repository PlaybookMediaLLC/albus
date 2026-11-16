import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getMyConversationFile } from "./get-my-conversation-file";
import { getMyConversationFileFixture } from "./get-my-conversation-file.fixture";
describe("getMyConversationFile", () => {
  describeOperationContract({
    operationId: "getQuillsMyConversationFile",
    operation: getMyConversationFile,
    request: {
      param: {
        workspace: "workspace_test_1",
        conversationId: "conversation-id_test_1",
        fileId: "file-id_test_1",
      },
    },
    response: getMyConversationFileFixture.ok(),
    method: "get",
    path: "/api/quills-public/workspace_test_1/support/conversations/conversation-id_test_1/files/file-id_test_1",
    statuses: [401, 403, 404],
  });
});
