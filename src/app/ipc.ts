import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import type {
  ApiResponse,
  AppError,
  AppSnapshot,
  AppSnapshotRequest,
  Appearance,
  AppearanceSaveRequest,
  CancelSearchRequest,
  CancelSearchResult,
  ChatListRequest,
  ChatSearchRequest,
  ChatSendRequest,
  ChatSendResult,
  DomainEvent,
  ExitRequest,
  ExitResult,
  MessagePage,
  SearchPage,
} from "@/contracts/generated"
import {
  validateAppSnapshotRequest,
  validateAppSnapshotResponse,
  validateAppearanceSaveRequest,
  validateAppearanceSaveResponse,
  validateCancelSearchRequest,
  validateCancelSearchResponse,
  validateChatListRequest,
  validateChatListResponse,
  validateChatSearchRequest,
  validateChatSearchResponse,
  validateChatSendRequest,
  validateChatSendResponse,
  validateDomainEvent,
  validateExitRequest,
  validateExitResponse,
} from "@/contracts/generated/validators.js"

type Validator = (value: unknown) => boolean

export class IpcError extends Error {
  public readonly detail: AppError

  constructor(detail: AppError) {
    super(detail.message)
    this.detail = detail
    this.name = "IpcError"
  }
}

function clientError(message: string, code: AppError["code"] = "INTERNAL_ERROR") {
  return new IpcError({
    code,
    message,
    retryability: "after_user_action",
    field_path: null,
    trace_id: crypto.randomUUID(),
    may_have_been_charged: false,
  })
}

export function errorMessage(error: unknown): string {
  return error instanceof IpcError ? error.message : "操作未完成，请重试。"
}

export function isDesktopEnvironment(): boolean {
  return isTauri()
}

async function request<Input, Data>(
  command: string,
  input: Input,
  validateInput: Validator,
  validateOutput: Validator,
): Promise<Data> {
  if (!isDesktopEnvironment()) {
    throw clientError("请在 Sageroom 桌面应用中使用聊天。", "CAPABILITY_UNSUPPORTED")
  }
  if (!validateInput(input)) {
    throw clientError("请求不符合当前数据合同，请重新加载。", "INVALID_INPUT")
  }
  let output: unknown
  try {
    output = await invoke(command, { request: input })
  } catch {
    throw clientError("无法连接本地应用，请重新加载或重新打开 Sageroom。")
  }
  if (!validateOutput(output)) {
    throw clientError("应用返回的数据不符合当前合同，请重新加载并保留追踪 ID。")
  }
  const response = output as ApiResponse<Data>
  if ("error" in response) throw new IpcError(response.error)
  return response.data
}

export const ipc = {
  snapshot: (input: AppSnapshotRequest): Promise<AppSnapshot> =>
    request("app_get_snapshot", input, validateAppSnapshotRequest, validateAppSnapshotResponse),
  list: (input: ChatListRequest): Promise<MessagePage> =>
    request("chat_list", input, validateChatListRequest, validateChatListResponse),
  send: (input: ChatSendRequest): Promise<ChatSendResult> =>
    request("chat_send", input, validateChatSendRequest, validateChatSendResponse),
  search: (input: ChatSearchRequest): Promise<SearchPage> =>
    request("chat_search", input, validateChatSearchRequest, validateChatSearchResponse),
  cancelSearch: (input: CancelSearchRequest): Promise<CancelSearchResult> =>
    request("cancel_search", input, validateCancelSearchRequest, validateCancelSearchResponse),
  saveAppearance: (input: AppearanceSaveRequest): Promise<Appearance> =>
    request("appearance_save", input, validateAppearanceSaveRequest, validateAppearanceSaveResponse),
  exit: (input: ExitRequest): Promise<ExitResult> =>
    request("app_request_exit", input, validateExitRequest, validateExitResponse),
  async subscribe(onEvent: (event: DomainEvent) => void, onError: (error: IpcError) => void) {
    if (!isDesktopEnvironment()) {
      throw clientError("请在 Sageroom 桌面应用中使用聊天。", "CAPABILITY_UNSUPPORTED")
    }
    return listen<unknown>("sageroom://domain", ({ payload }) => {
      if (!validateDomainEvent(payload)) {
        onError(clientError("收到的数据事件不符合当前合同，请重新加载。"))
        return
      }
      onEvent(payload as DomainEvent)
    })
  },
}
