import type { ValidateFunction } from "ajv"
import type { ApiFailure, ApiResponse, ApiSuccess, AppError, AppSnapshot, AppSnapshotRequest, Appearance, AppearanceSaveRequest, CancelSearchRequest, CancelSearchResult, ChatListRequest, ChatMessage, ChatSearchRequest, ChatSendRequest, ChatSendResult, DecimalString, DomainEvent, ErrorCode, EventPayload, ExitRequest, ExitResult, MessagePage, MessagePart, MessageState, Participant, ParticipantKind, ParticipantStatus, Retryability, Room, SchemaVersion, SearchHit, SearchPage, SearchSemantics, SenderSnapshot, Theme } from "./index"
export const validateAppSnapshotRequest: ValidateFunction<AppSnapshotRequest>
export const validateAppSnapshotResponse: ValidateFunction<ApiResponse<AppSnapshot>>
export const validateAppearanceSaveRequest: ValidateFunction<AppearanceSaveRequest>
export const validateAppearanceSaveResponse: ValidateFunction<ApiResponse<Appearance>>
export const validateCancelSearchRequest: ValidateFunction<CancelSearchRequest>
export const validateCancelSearchResponse: ValidateFunction<ApiResponse<CancelSearchResult>>
export const validateChatListRequest: ValidateFunction<ChatListRequest>
export const validateChatListResponse: ValidateFunction<ApiResponse<MessagePage>>
export const validateChatSearchRequest: ValidateFunction<ChatSearchRequest>
export const validateChatSearchResponse: ValidateFunction<ApiResponse<SearchPage>>
export const validateChatSendRequest: ValidateFunction<ChatSendRequest>
export const validateChatSendResponse: ValidateFunction<ApiResponse<ChatSendResult>>
export const validateDomainEvent: ValidateFunction<DomainEvent>
export const validateExitRequest: ValidateFunction<ExitRequest>
export const validateExitResponse: ValidateFunction<ApiResponse<ExitResult>>
