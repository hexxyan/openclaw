import type { AgentEventPayload } from "../../infra/agent-events.js";

export type StreamingBridgeReplyOptions = {
  onPartialReply?: (payload: { text: string; mediaUrls?: string[] }) => Promise<void> | void;
};

export type AgentStreamingBridge = {
  handlers: {
    onBlockReply?: (payload: { text: string; mediaUrls?: string[] }) => Promise<void> | void;
  };
  handleAgentEvent: (evt: Partial<AgentEventPayload>) => void;
  isDispatchActive: () => boolean;
  markDispatchIdle: () => void;
};

export function createAgentStreamingBridge(params: {
  runId: string;
  replyOptions: StreamingBridgeReplyOptions;
  onBlockReply?: (payload: { text: string; mediaUrls?: string[] }) => Promise<void> | void;
}): AgentStreamingBridge {
  let dispatchActive = false;

  return {
    handlers: {
      onBlockReply: async (payload) => {
        dispatchActive = true;
        if (params.onBlockReply) {
          await params.onBlockReply(payload);
        }
        if (params.replyOptions.onPartialReply) {
          await params.replyOptions.onPartialReply(payload);
        }
      },
    },
    handleAgentEvent: (evt) => {
      if (evt.stream === "assistant" && evt.data?.delta) {
        dispatchActive = true;
        // Optimization: don't emit to bridge if it's just a thinking block
        // (This logic might vary by bridge implementation)
      }
    },
    isDispatchActive: () => dispatchActive,
    markDispatchIdle: () => {
      dispatchActive = false;
    },
  };
}
