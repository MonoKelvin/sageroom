import type { ComponentType } from "react"
import { IconMessageCircle, IconRobot, IconSettings, IconUserCircle, type TablerIcon } from "@tabler/icons-react"
import { ChatView } from "@/features/chat/ChatView"
import { AgentsPage } from "@/features/agents/AgentsPage"
import { SettingsPage } from "@/features/settings/SettingsPage"
import { UserPage } from "@/features/user/UserPage"
import type { useChatSession } from "@/features/chat/useChatSession"

export type PageId = "chat" | "agents" | "settings" | "user"

export type ApplicationPageProps = {
  session: ReturnType<typeof useChatSession>
  active: boolean
  onNavigate: (page: PageId) => void
}

export type ApplicationPageDefinition = {
  id: PageId
  title: string
  icon: TablerIcon
  component: ComponentType<ApplicationPageProps>
}

export const applicationPages: readonly ApplicationPageDefinition[] = [
  { id: "chat", title: "聊天", icon: IconMessageCircle, component: ChatView },
  { id: "agents", title: "智能体", icon: IconRobot, component: AgentsPage },
  { id: "settings", title: "设置", icon: IconSettings, component: SettingsPage },
  { id: "user", title: "用户", icon: IconUserCircle, component: UserPage },
]
