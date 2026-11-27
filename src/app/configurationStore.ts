import type { AgentConfiguration, AgentModelSnapshot, Appearance, AppSnapshot, ExperienceEntry, GlobalConfiguration, ModelListResult, ModelProfile, ModelProfileInput, NewsConfigurationState, PersonaPreset, SecretStatus, UserProfile } from "@/contracts/generated"
import { defaultDimensions } from "@/features/settings/configurationDefaults"
import { AppliedResource, type ApplicationState } from "./appliedResource"
import { errorMessage, ipc } from "./ipc"

export type AgentListState = { resources: AppliedResource<AgentConfiguration>[]; loading: boolean; error: string | null }

function profileInput(profile: ModelProfile): ModelProfileInput {
  const { id, name, protocol, base_url, model_name } = profile
  return { id, name: name.trim(), protocol, base_url: base_url.trim(), model_name: model_name.trim() }
}

export function modelIsComplete(profile: ModelProfileInput) { return Boolean(profile.base_url.trim() && profile.model_name.trim()) }

export class ConfigurationStore {
  readonly global: AppliedResource<GlobalConfiguration>
  readonly news: AppliedResource<NewsConfigurationState>
  readonly user: AppliedResource<UserProfile>
  readonly appearance: AppliedResource<Appearance>
  private agents = new Map<string, AppliedResource<AgentConfiguration>>()
  private agentState: AgentListState = { resources: [], loading: false, error: null }
  private agentListeners = new Set<() => void>()
  private agentsLoading: Promise<void> | null = null
  private agentsLoaded = false
  private disposed = false
  private frozen = false

  constructor(readonly snapshot: AppSnapshot) {
    const generation = snapshot.data_generation_id
    this.global = new AppliedResource({
      load: () => ipc.getGlobalConfiguration({ data_generation_id: generation }),
      write: (value, revision, requestId) => ipc.saveGlobalConfiguration({ data_generation_id: generation, client_request_id: requestId, expected_revision: revision, model_profiles: value.model_profiles.map(profileInput), persona_presets: value.persona_presets.map((persona) => ({ ...persona, name: persona.name.trim() })) }),
    })
    this.news = new AppliedResource({
      load: () => ipc.getNewsConfiguration({ data_generation_id: generation }),
      write: (value, revision, requestId) => ipc.saveNewsConfiguration({
        data_generation_id: generation,
        client_request_id: requestId,
        expected_revision: revision,
        configuration: value.configuration,
      }),
    })
    this.user = new AppliedResource({
      load: () => ipc.getUserProfile({ data_generation_id: generation }),
      write: (value, revision, requestId) => ipc.saveUserProfile({ data_generation_id: generation, client_request_id: requestId, expected_revision: revision, display_name: value.display_name.trim(), avatar_id: value.avatar_id, bio: value.bio }),
    })
    this.appearance = new AppliedResource({
      initial: snapshot.appearance,
      load: async () => (await ipc.snapshot({ data_generation_id: generation, last_event_seq: null })).appearance,
      write: (value, revision, requestId) => ipc.saveAppearance({ data_generation_id: generation, client_request_id: requestId, expected_revision: revision, theme: value.theme, reduce_motion: value.reduce_motion }),
    })
  }

  getAgentSnapshot = () => this.agentState
  subscribeAgents = (listener: () => void) => { this.agentListeners.add(listener); return () => this.agentListeners.delete(listener) }

  private publishAgents(partial: Partial<AgentListState> = {}) {
    this.agentState = { ...this.agentState, ...partial, resources: Array.from(this.agents.values()) }
    for (const listener of this.agentListeners) listener()
  }

  private registerAgent(initial: AgentConfiguration) {
    const generation = this.snapshot.data_generation_id
    const resource = new AppliedResource<AgentConfiguration>({
      initial,
      load: async () => {
        const current = (await ipc.listAgents({ data_generation_id: generation })).find((agent) => agent.agent_id === initial.agent_id)
        if (!current) throw new Error("成员配置不存在。")
        return current
      },
      write: (value, revision, requestId) => ipc.saveAgent({ data_generation_id: generation, client_request_id: requestId, expected_revision: revision === "0" ? null : revision, configuration: { ...value, display_name: value.display_name.trim() } }),
    })
    resource.freeze(this.frozen)
    resource.subscribe(() => this.publishAgents())
    this.agents.set(initial.agent_id, resource)
    this.publishAgents()
    return resource
  }

  async loadAgents() {
    if (this.agentsLoaded || this.disposed) return
    if (!this.agentsLoading) {
      this.publishAgents({ loading: true, error: null })
      this.agentsLoading = ipc.listAgents({ data_generation_id: this.snapshot.data_generation_id }).then((agents) => {
        if (this.disposed) return
        for (const agent of agents) if (!this.agents.has(agent.agent_id)) this.registerAgent(agent)
        this.agentsLoaded = true
      }).catch((cause: unknown) => { if (!this.disposed) this.publishAgents({ error: errorMessage(cause) }) }).finally(() => {
        this.agentsLoading = null
        if (!this.disposed) this.publishAgents({ loading: false })
      })
    }
    await this.agentsLoading
  }

  agent(id: string) { return this.agents.get(id)! }

  async deleteAgent(agentId: string): Promise<void> {
    await ipc.deleteAgent({ data_generation_id: this.snapshot.data_generation_id, agent_id: agentId })
  }

  async createAgent(source?: AgentConfiguration) {
    await this.global.ensureLoaded()
    const agent: AgentConfiguration = source ? { ...structuredClone(source), agent_id: crypto.randomUUID(), revision: "0", display_name: `${source.display_name} 副本`.slice(0, 80), local_tools_enabled: false } : { agent_id: crypto.randomUUID(), revision: "0", display_name: "新智能体", gender_description: null, language_style: "自然、清晰", skill: "", dimensions: { ...defaultDimensions }, avatar_id: null, agent_type: "social", model: null }
    const resource = this.registerAgent(agent)
    const applied = resource.persistInitial()
    applied.catch(() => {})
    return { agent, applied }
  }

  updateAgent(id: string, patch: Partial<AgentConfiguration>) { return this.agent(id).change((current) => ({ ...current, ...patch })) }
  updateUser(patch: Partial<UserProfile>) { return this.user.change((current) => ({ ...current, ...patch })) }
  updateAppearance(patch: Partial<Appearance>) { return this.appearance.change((current) => ({ ...current, ...patch })) }

  updateModel(id: string, patch: Partial<ModelProfileInput>) {
    return this.global.change((current) => ({ ...current, model_profiles: current.model_profiles.map((profile) => profile.id === id ? { ...profile, ...patch } : profile) }))
  }


  updateAgentModel(id: string, patch: Partial<ModelProfileInput>) {
    return this.agent(id).change((current) => current.model ? { ...current, model: { ...current.model, profile: { ...current.model.profile, ...patch } } } : current)
  }


  createModel(source?: ModelProfile) {
    const profile: ModelProfile = source ? { ...structuredClone(source), id: crypto.randomUUID(), revision: "0", name: `${source.name} 副本`.slice(0, 80), credential_configured: false } : { id: crypto.randomUUID(), name: "新模型预设", protocol: "openai_chat_completions", base_url: "", model_name: "", revision: "0", credential_configured: false }
    return this.global.change((current) => ({ ...current, model_profiles: [...current.model_profiles, profile] }))
  }

  createPersona(source?: PersonaPreset) {
    const persona: PersonaPreset = source ? { ...structuredClone(source), id: crypto.randomUUID(), revision: "0", name: `${source.name} 副本`.slice(0, 80) } : { id: crypto.randomUUID(), name: "新人格预设", language_style: "自然、清晰", skill: "", dimensions: { ...defaultDimensions }, revision: "0" }
    return this.global.change((current) => ({ ...current, persona_presets: [...current.persona_presets, persona] }))
  }

  updatePersona(id: string, patch: Partial<PersonaPreset>) {
    return this.global.change((current) => ({ ...current, persona_presets: current.persona_presets.map((persona) => persona.id === id ? { ...persona, ...patch } : persona) }))
  }

  async applyModel(id: string, profileId: string) {
    await this.global.flush()
    let model: AgentModelSnapshot | null = null
    if (profileId) {
      const profile = this.global.getSnapshot().confirmed!.model_profiles.find((profile) => profile.id === profileId)
      if (!profile || !modelIsComplete(profile)) throw new Error("请先完成模型地址和标识。")
      model = { source_profile_id: profile.id, source_profile_revision: profile.revision, profile: profileInput(profile) }
    }
    await this.updateAgent(id, { model })
  }

  async applyPersona(id: string, personaId: string) {
    await this.global.flush()
    const persona = this.global.getSnapshot().confirmed!.persona_presets.find((persona) => persona.id === personaId)!
    await this.updateAgent(id, { language_style: persona.language_style, skill: persona.skill, dimensions: { ...persona.dimensions } })
  }

  setSecret(profileId: string, apiKey: string): Promise<SecretStatus> {
    return this.global.exclusive((current) => {
      const profile = current.model_profiles.find((profile) => profile.id === profileId)!
      return ipc.setSecret({ data_generation_id: this.snapshot.data_generation_id, profile_id: profileId, expected_revision: profile.revision, api_key: apiKey })
    })
  }


  async testModel(profileId: string) {
    await this.global.flush()
    const profile = this.global.getSnapshot().confirmed!.model_profiles.find((profile) => profile.id === profileId)!
    return ipc.testModel({ data_generation_id: this.snapshot.data_generation_id, profile_id: profileId, expected_revision: profile.revision })
  }


  async listModelNames(profileId: string): Promise<ModelListResult> {
    // 只读操作，不走写 barrier，避免触发「正在应用到本机」的 pending 状态。
    await this.global.flush()
    const profile = this.global.getSnapshot().confirmed!.model_profiles.find((profile) => profile.id === profileId)!
    return ipc.listModels({ data_generation_id: this.snapshot.data_generation_id, profile_id: profileId, expected_revision: profile.revision })
  }

  listExperience(agentId: string): Promise<ExperienceEntry[]> {
    return ipc.experienceList({ data_generation_id: this.snapshot.data_generation_id, agent_id: agentId })
  }

  addExperience(agentId: string, content: string, score: number): Promise<ExperienceEntry> {
    return ipc.experienceAdd({ data_generation_id: this.snapshot.data_generation_id, agent_id: agentId, content, score })
  }

  updateExperience(agentId: string, entryId: string, content: string, recordedAt: string, score: number): Promise<ExperienceEntry> {
    return ipc.experienceUpdate({ data_generation_id: this.snapshot.data_generation_id, agent_id: agentId, entry_id: entryId, content, recorded_at: recordedAt, score })
  }

  deleteExperience(agentId: string, entryId: string): Promise<ExperienceEntry[]> {
    return ipc.experienceDelete({ data_generation_id: this.snapshot.data_generation_id, agent_id: agentId, entry_id: entryId })
  }

  pruneExperience(agentId: string, maxEntries: number): Promise<ExperienceEntry[]> {
    return ipc.experiencePrune({ data_generation_id: this.snapshot.data_generation_id, agent_id: agentId, max_entries: maxEntries })
  }
  importDevelopmentModel() { return this.global.exclusive(() => ipc.importDevelopmentModel({ data_generation_id: this.snapshot.data_generation_id })) }

  freeze(value: boolean) {
    this.frozen = value
    for (const resource of [this.global, this.news, this.user, this.appearance, ...this.agents.values()]) resource.freeze(value)
  }

  async flush() { await Promise.all([this.global.flush(), this.news.flush(), this.user.flush(), this.appearance.flush(), ...Array.from(this.agents.values(), (resource) => resource.flush())]) }

  dispose() {
    this.disposed = true
    for (const resource of [this.global, this.news, this.user, this.appearance, ...this.agents.values()]) resource.dispose()
    this.agentListeners.clear()
  }
}

export type ConfigurationResourceState<T> = ApplicationState<T>
