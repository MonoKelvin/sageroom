import type { ComponentType } from "react"
import type { UserProfile } from "@/contracts/generated"

export type UserSectionKind = "chat_style" | "speaking_frequency" | "interests" | "personality_analysis"
export type UserSectionProps = { profile: UserProfile; generation: string; active: boolean }
export type UserSection = { id: UserSectionKind; component: ComponentType<UserSectionProps> }

export const userSections: UserSection[] = []
