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
  ChatMessage,
  ChatRecallRequest,
  ChatRecallResult,
  ChatResolveQuotesRequest,
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
  InboxGetRequest,
  InboxMarkReadRequest,
  InboxMuteRequest,
  InboxSummary,
  TrayOpenRequest,
  TrayOpenResult,
  ChatOpenRequest,
  ChatOpenState,
  AutostartRequest,
  AutostartSetRequest,
  AutostartState,
  TraySyncRequest,
  UiPreferences,
  UiPreferencesSaveRequest,
  UiPreferencesGetRequest,
  DataDirectoryMigrateRequest,
  TraySyncState,
  NewsConfigurationGetRequest,
  NewsConfigurationSaveRequest,
  NewsConfigurationState,
  NewsPreviewRequest,
  NewsPreviewResponse,
  NewsSecretStatusRequest,
  NewsSecretSetRequest,
  NewsSecretStatus,
  AgentConfiguration,
  AgentListRequest,
  AgentSaveRequest,
  AgentDeleteRequest,
  AgentRuntimeControlRequest,
  AgentRuntimeState,
  UserProfile,
  UserProfileGetRequest,
  UserProfileSaveRequest,
  SecretSetRequest,
  SecretStatusRequest,
  SecretStatus,
  ModelProfileTestRequest,
  ModelTestResult,
  ModelListRequest,
  ModelListResult,
  ExperienceAgentRequest,
  ExperienceAddRequest,
  ExperienceUpdateRequest,
  ExperienceDeleteRequest,
  ExperiencePruneRequest,
  ExperienceEntry,
  DevelopmentModelImportRequest,
  AvatarImportRequest,
  AvatarReadRequest,
  AvatarObject,
  AvatarData,
  AttachmentImportRequest,
  AttachmentImportResult,
  AttachmentPasteRequest,
  AttachmentObject,
  AttachmentReadRequest,
  AttachmentData,
  AttachmentOpenRequest,
  AttachmentDiscardRequest,
  AttachmentDiscardResult,
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
  validateChatRecallRequest,
  validateChatRecallResponse,
  validateChatResolveQuotesRequest,
  validateChatResolveQuotesResponse,
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
  validateInboxGetRequest,
  validateInboxGetResponse,
  validateInboxMarkReadRequest,
  validateInboxMarkReadResponse,
  validateInboxMuteRequest,
  validateInboxMuteResponse,
  validateTraySyncRequest,
  validateUiPreferencesGetRequest,
  validateDataDirectoryPickResponse,
  validateOpenExternalLinkResponse,
  validateDataDirectoryMigrateRequest,
  validateDataDirectoryMigrateResponse,
  validateDataDirectoryResetResponse,
  validateUiPreferencesGetResponse,
  validateUiPreferencesSaveRequest,
  validateUiPreferencesSaveResponse,
  validateTraySyncResponse,
  validateTrayOpenRequest,
  validateTrayOpenResponse,
  validateChatOpenRequest,
  validateChatOpenResponse,
  validateAutostartRequest,
  validateAutostartStatusResponse,
  validateAutostartSetRequest,
  validateAutostartSetResponse,
  validateNewsConfigurationGetRequest,
  validateNewsConfigurationGetResponse,
  validateNewsConfigurationSaveRequest,
  validateNewsConfigurationSaveResponse,
  validateNewsPreviewRequest,
  validateNewsPreviewResponse,
  validateNewsSecretStatusRequest,
  validateNewsSecretStatusResponse,
  validateNewsSecretSetRequest,
  validateNewsSecretSetResponse,
  validateAgentListRequest,
  validateAgentListResponse,
  validateAgentSaveRequest,
  validateAgentDeleteRequest,
  validateAgentDeleteResponse,
  validateAgentSaveResponse,
  validateAgentRuntimeControlRequest,
  validateAgentRuntimeControlResponse,
  validateUserProfileGetRequest,
  validateUserProfileGetResponse,
  validateUserProfileSaveRequest,
  validateUserProfileSaveResponse,
  validateSecretSetRequest,
  validateSecretSetResponse,
  validateSecretStatusRequest,
  validateSecretStatusResponse,
  validateModelProfileTestRequest,
  validateModelProfileTestResponse,
  validateModelListRequest,
  validateModelListResponse,
  validateExperienceAgentRequest,
  validateExperienceListResponse,
  validateExperienceAddRequest,
  validateExperienceUpdateRequest,
  validateExperienceUpdateResponse,
  validateExperienceAddResponse,
  validateExperienceDeleteRequest,
  validateExperienceDeleteResponse,
  validateExperiencePruneRequest,
  validateExperiencePruneResponse,
  validateDevelopmentModelImportRequest,
  validateDevelopmentModelImportResponse,
  validateAvatarImportRequest,
  validateAvatarImportResponse,
  validateAvatarReadRequest,
  validateAvatarReadResponse,
  validateAttachmentImportRequest,
  validateAttachmentPickResponse,
  validateAttachmentPasteRequest,
  validateAttachmentPasteResponse,
  validateAttachmentReadRequest,
  validateAttachmentReadResponse,
  validateAttachmentOpenRequest,
  validateAttachmentOpenResponse,
  validateAttachmentDiscardRequest,
  validateAttachmentDiscardResponse,
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

const acceptAny: Validator = (value) => value !== undefined

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
  } catch (cause) {
    // Tauri 的 invoke 失败原因（命令未注册、参数解码失败、后端 panic）必须暴露，
    // 否则界面只剩“无法连接本地应用”，无法定位具体是哪一层出错。
    const detail = cause instanceof Error ? cause.message : String(cause)
    throw clientError(`无法连接本地应用：${detail.slice(0, 160)}。请重新加载或重新打开 Sageroom。`)
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
  recall: (input: ChatRecallRequest): Promise<ChatRecallResult> =>
    request("chat_recall", input, validateChatRecallRequest, validateChatRecallResponse),
  resolveQuotes: (input: ChatResolveQuotesRequest): Promise<ChatMessage[]> =>
    request("chat_resolve_quotes", input, validateChatResolveQuotesRequest, validateChatResolveQuotesResponse),
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
  openExternalLink: (url: string): Promise<void> =>
    request("open_external_link", { url }, acceptAny, validateOpenExternalLinkResponse),
  pickDataDirectory: (): Promise<string | null> =>
    request("data_directory_pick", {}, acceptAny, validateDataDirectoryPickResponse),
  migrateDataDirectory: (input: DataDirectoryMigrateRequest): Promise<void> =>
    request("data_directory_migrate", input, validateDataDirectoryMigrateRequest, validateDataDirectoryMigrateResponse),
  resetDataDirectory: (): Promise<void> =>
    request("data_directory_reset", {}, acceptAny, validateDataDirectoryResetResponse),
  getUiPreferences: (input: UiPreferencesGetRequest): Promise<UiPreferences> =>
    request("ui_preferences_get", input, validateUiPreferencesGetRequest, validateUiPreferencesGetResponse),
  saveUiPreferences: (input: UiPreferencesSaveRequest): Promise<void> =>
    request("ui_preferences_save", input, validateUiPreferencesSaveRequest, validateUiPreferencesSaveResponse),
  traySync: (input: TraySyncRequest): Promise<TraySyncState> =>
    request("tray_sync", input, validateTraySyncRequest, validateTraySyncResponse),
  trayOpenMain: (input: TrayOpenRequest): Promise<TrayOpenResult> =>
    request("tray_open_main", input, validateTrayOpenRequest, validateTrayOpenResponse),
  consumeChatOpen: (input: ChatOpenRequest): Promise<ChatOpenState> =>
    request("consume_chat_open", input, validateChatOpenRequest, validateChatOpenResponse),
  autostartStatus: (input: AutostartRequest): Promise<AutostartState> =>
    request("autostart_status", input, validateAutostartRequest, validateAutostartStatusResponse),
  autostartSet: (input: AutostartSetRequest): Promise<AutostartState> =>
    request("autostart_set", input, validateAutostartSetRequest, validateAutostartSetResponse),
  getInbox: (input: InboxGetRequest): Promise<InboxSummary> =>
    request("inbox_get", input, validateInboxGetRequest, validateInboxGetResponse),
  markInboxRead: (input: InboxMarkReadRequest): Promise<InboxSummary> =>
    request("inbox_mark_read", input, validateInboxMarkReadRequest, validateInboxMarkReadResponse),
  setInboxMuted: (input: InboxMuteRequest): Promise<InboxSummary> =>
    request("inbox_set_muted", input, validateInboxMuteRequest, validateInboxMuteResponse),
  getNewsConfiguration: (input: NewsConfigurationGetRequest): Promise<NewsConfigurationState> =>
    request("news_configuration_get", input, validateNewsConfigurationGetRequest, validateNewsConfigurationGetResponse),
  saveNewsConfiguration: (input: NewsConfigurationSaveRequest): Promise<NewsConfigurationState> =>
    request("news_configuration_save", input, validateNewsConfigurationSaveRequest, validateNewsConfigurationSaveResponse),
  newsSecretStatus: (input: NewsSecretStatusRequest): Promise<NewsSecretStatus> =>
    request("news_secret_status", input, validateNewsSecretStatusRequest, validateNewsSecretStatusResponse),
  setNewsSecret: (input: NewsSecretSetRequest): Promise<NewsSecretStatus> =>
    request("news_secret_set", input, validateNewsSecretSetRequest, validateNewsSecretSetResponse),
  previewNews: (input: NewsPreviewRequest): Promise<NewsPreviewResponse> =>
    request("news_preview", input, validateNewsPreviewRequest, validateNewsPreviewResponse),
  listAgents: (input: AgentListRequest): Promise<AgentConfiguration[]> =>
    request("agent_list", input, validateAgentListRequest, validateAgentListResponse),
  deleteAgent: (input: AgentDeleteRequest): Promise<void> =>
    request("agent_delete", input, validateAgentDeleteRequest, validateAgentDeleteResponse),
  saveAgent: (input: AgentSaveRequest): Promise<AgentConfiguration> =>
    request("agent_save", input, validateAgentSaveRequest, validateAgentSaveResponse),
  controlAgentRuntime: (input: AgentRuntimeControlRequest): Promise<AgentRuntimeState> =>
    request("agent_runtime_control", input, validateAgentRuntimeControlRequest, validateAgentRuntimeControlResponse),
  openAgentWorkspace: (input: ExperienceAgentRequest): Promise<void> =>
    request("agent_workspace_open", input, validateExperienceAgentRequest, validateOpenExternalLinkResponse),
  getUserProfile: (input: UserProfileGetRequest): Promise<UserProfile> =>
    request("user_profile_get", input, validateUserProfileGetRequest, validateUserProfileGetResponse),
  saveUserProfile: (input: UserProfileSaveRequest): Promise<UserProfile> =>
    request("user_profile_save", input, validateUserProfileSaveRequest, validateUserProfileSaveResponse),
  setSecret: (input: SecretSetRequest): Promise<SecretStatus> =>
    request("secret_set", input, validateSecretSetRequest, validateSecretSetResponse),
  secretStatus: (input: SecretStatusRequest): Promise<SecretStatus> =>
    request("secret_status", input, validateSecretStatusRequest, validateSecretStatusResponse),
  testModel: (input: ModelProfileTestRequest): Promise<ModelTestResult> =>
    request("model_profile_test", input, validateModelProfileTestRequest, validateModelProfileTestResponse),
  listModels: (input: ModelListRequest): Promise<ModelListResult> =>
    request("model_profile_list", input, validateModelListRequest, validateModelListResponse),
  experienceList: (input: ExperienceAgentRequest): Promise<ExperienceEntry[]> =>
    request("experience_list", input, validateExperienceAgentRequest, validateExperienceListResponse),
  experienceAdd: (input: ExperienceAddRequest): Promise<ExperienceEntry> =>
    request("experience_add", input, validateExperienceAddRequest, validateExperienceAddResponse),
  experienceUpdate: (input: ExperienceUpdateRequest): Promise<ExperienceEntry> =>
    request("experience_update", input, validateExperienceUpdateRequest, validateExperienceUpdateResponse),
  experienceDelete: (input: ExperienceDeleteRequest): Promise<ExperienceEntry[]> =>
    request("experience_delete", input, validateExperienceDeleteRequest, validateExperienceDeleteResponse),
  experiencePrune: (input: ExperiencePruneRequest): Promise<ExperienceEntry[]> =>
    request("experience_prune", input, validateExperiencePruneRequest, validateExperiencePruneResponse),
  importDevelopmentModel: (input: DevelopmentModelImportRequest): Promise<GlobalConfiguration> =>
    request("development_model_import", input, validateDevelopmentModelImportRequest, validateDevelopmentModelImportResponse),
  importAvatar: (input: AvatarImportRequest): Promise<AvatarObject | null> =>
    request("avatar_import", input, validateAvatarImportRequest, validateAvatarImportResponse),
  readAvatar: (input: AvatarReadRequest): Promise<AvatarData> =>
    request("avatar_read", input, validateAvatarReadRequest, validateAvatarReadResponse),
  pickAttachments: (input: AttachmentImportRequest): Promise<AttachmentImportResult> =>
    request("attachment_pick", input, validateAttachmentImportRequest, validateAttachmentPickResponse),
  pasteAttachment: (input: AttachmentPasteRequest): Promise<AttachmentObject> =>
    request("attachment_paste", input, validateAttachmentPasteRequest, validateAttachmentPasteResponse),
  readAttachment: (input: AttachmentReadRequest): Promise<AttachmentData> =>
    request("attachment_read", input, validateAttachmentReadRequest, validateAttachmentReadResponse),
  openAttachment: (input: AttachmentOpenRequest): Promise<boolean> =>
    request("attachment_open", input, validateAttachmentOpenRequest, validateAttachmentOpenResponse),
  discardAttachments: (input: AttachmentDiscardRequest): Promise<AttachmentDiscardResult> =>
    request("attachment_discard", input, validateAttachmentDiscardRequest, validateAttachmentDiscardResponse),
  /** 读取系统剪贴板纯文本；走原生实现，避免 WebView2 对 clipboard.readText 的授权限制。 */
  readClipboardText: async (): Promise<string> => {
    if (!isDesktopEnvironment()) throw clientError("请在 Sageroom 桌面应用中粘贴。", "CAPABILITY_UNSUPPORTED")
    let output: unknown
    try { output = await invoke("clipboard_read_text") } catch {
      throw clientError("无法读取剪贴板，请稍后重试。")
    }
    const response = output as ApiResponse<string>
    if (response && typeof response === "object" && "error" in response) throw new IpcError(response.error)
    if (!response || typeof response !== "object" || !("data" in response) || typeof response.data !== "string") {
      throw clientError("剪贴板返回的数据不符合当前合同。")
    }
    return response.data
  },
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
