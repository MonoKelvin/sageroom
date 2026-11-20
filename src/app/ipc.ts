import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import type {
  ApiResponse,
  AppError,
  AppSnapshot,
  AppSnapshotRequest,
  Room,
  RoomSaveRequest,
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
  ExitReadyRequest,
  AppLifecycleEvent,
  ExitResult,
  MessagePage,
  SearchPage,
  GlobalConfiguration,
  GlobalConfigurationGetRequest,
  GlobalConfigurationSaveRequest,
  AgentConfiguration,
  AgentListRequest,
  AgentSaveRequest,
  UserProfile,
  UserProfileGetRequest,
  UserProfileSaveRequest,
  SecretSetRequest,
  SecretDeleteRequest,
  SecretStatusRequest,
  SecretStatus,
  ModelProfileTestRequest,
  ModelTestResult,
  DevelopmentModelImportRequest,
  AvatarImportRequest,
  AvatarReadRequest,
  AvatarObject,
  AvatarData,
} from "@/contracts/generated"
import {
  validateAppSnapshotRequest,
  validateAppSnapshotResponse,
  validateRoomSaveRequest,
  validateRoomSaveResponse,
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
  validateExitReadyRequest,
  validateExitReadyResponse,
  validateAppLifecycleEvent,
  validateGlobalConfigurationGetRequest,
  validateGlobalConfigurationGetResponse,
  validateGlobalConfigurationSaveRequest,
  validateGlobalConfigurationSaveResponse,
  validateAgentListRequest,
  validateAgentListResponse,
  validateAgentSaveRequest,
  validateAgentSaveResponse,
  validateUserProfileGetRequest,
  validateUserProfileGetResponse,
  validateUserProfileSaveRequest,
  validateUserProfileSaveResponse,
  validateSecretSetRequest,
  validateSecretSetResponse,
  validateSecretDeleteRequest,
  validateSecretDeleteResponse,
  validateSecretStatusRequest,
  validateSecretStatusResponse,
  validateModelProfileTestRequest,
  validateModelProfileTestResponse,
  validateDevelopmentModelImportRequest,
  validateDevelopmentModelImportResponse,
  validateAvatarImportRequest,
  validateAvatarImportResponse,
  validateAvatarReadRequest,
  validateAvatarReadResponse,
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
  saveRoom: (input: RoomSaveRequest): Promise<Room> =>
    request("room_save", input, validateRoomSaveRequest, validateRoomSaveResponse),
  saveAppearance: (input: AppearanceSaveRequest): Promise<Appearance> =>
    request("appearance_save", input, validateAppearanceSaveRequest, validateAppearanceSaveResponse),
  getGlobalConfiguration: (input: GlobalConfigurationGetRequest): Promise<GlobalConfiguration> =>
    request("global_configuration_get", input, validateGlobalConfigurationGetRequest, validateGlobalConfigurationGetResponse),
  saveGlobalConfiguration: (input: GlobalConfigurationSaveRequest): Promise<GlobalConfiguration> =>
    request("global_configuration_save", input, validateGlobalConfigurationSaveRequest, validateGlobalConfigurationSaveResponse),
  listAgents: (input: AgentListRequest): Promise<AgentConfiguration[]> =>
    request("agent_list", input, validateAgentListRequest, validateAgentListResponse),
  saveAgent: (input: AgentSaveRequest): Promise<AgentConfiguration> =>
    request("agent_save", input, validateAgentSaveRequest, validateAgentSaveResponse),
  getUserProfile: (input: UserProfileGetRequest): Promise<UserProfile> =>
    request("user_profile_get", input, validateUserProfileGetRequest, validateUserProfileGetResponse),
  saveUserProfile: (input: UserProfileSaveRequest): Promise<UserProfile> =>
    request("user_profile_save", input, validateUserProfileSaveRequest, validateUserProfileSaveResponse),
  setSecret: (input: SecretSetRequest): Promise<SecretStatus> =>
    request("secret_set", input, validateSecretSetRequest, validateSecretSetResponse),
  deleteSecret: (input: SecretDeleteRequest): Promise<SecretStatus> =>
    request("secret_delete", input, validateSecretDeleteRequest, validateSecretDeleteResponse),
  secretStatus: (input: SecretStatusRequest): Promise<SecretStatus> =>
    request("secret_status", input, validateSecretStatusRequest, validateSecretStatusResponse),
  testModel: (input: ModelProfileTestRequest): Promise<ModelTestResult> =>
    request("model_profile_test", input, validateModelProfileTestRequest, validateModelProfileTestResponse),
  importDevelopmentModel: (input: DevelopmentModelImportRequest): Promise<GlobalConfiguration> =>
    request("development_model_import", input, validateDevelopmentModelImportRequest, validateDevelopmentModelImportResponse),
  importAvatar: (input: AvatarImportRequest): Promise<AvatarObject | null> =>
    request("avatar_import", input, validateAvatarImportRequest, validateAvatarImportResponse),
  readAvatar: (input: AvatarReadRequest): Promise<AvatarData> =>
    request("avatar_read", input, validateAvatarReadRequest, validateAvatarReadResponse),
  exit: (input: ExitRequest): Promise<ExitResult> =>
    request("app_request_exit", input, validateExitRequest, validateExitResponse),
  completeExit: (input: ExitReadyRequest): Promise<ExitResult> =>
    request("app_exit_ready", input, validateExitReadyRequest, validateExitReadyResponse),
  async subscribeLifecycle(onEvent: (event: AppLifecycleEvent) => void, onError: (error: IpcError) => void) {
    if (!isDesktopEnvironment()) throw clientError("请在桌面应用中使用窗口生命周期。", "CAPABILITY_UNSUPPORTED")
    return listen<unknown>("sageroom://lifecycle", ({ payload }) => {
      if (!validateAppLifecycleEvent(payload)) { onError(clientError("收到的生命周期事件不符合当前合同。")); return }
      onEvent(payload as AppLifecycleEvent)
    })
  },
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
