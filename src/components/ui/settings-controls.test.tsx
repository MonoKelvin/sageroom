import { useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { SettingsSelect, type SettingsSelectOption } from "./settings-select"
import { Checkbox } from "./checkbox"
import { Switch } from "./switch"
import { SettingRow, SettingSection } from "./setting-row"

vi.mock("@/app/ipc", () => ({ errorMessage: () => "操作未完成，请重试。" }))

// jsdom 不提供布局和指针捕获，仅补环境缺口，不替代 Radix 键盘行为。
const missingMethods = ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const
const addedMethods: string[] = []
beforeAll(() => {
  for (const method of missingMethods) {
    if (!(method in HTMLElement.prototype)) {
      Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: method === "hasPointerCapture" ? () => false : () => {} })
      addedMethods.push(method)
    }
  }
  if (!globalThis.ResizeObserver) {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
  }
})
afterAll(() => {
  for (const method of addedMethods) Reflect.deleteProperty(HTMLElement.prototype, method)
  vi.unstubAllGlobals()
})

const options: SettingsSelectOption[] = [
  { value: "opaque:7", label: "本地" },
  { value: "", label: "不指定" },
  { value: "1", label: "数字 ID" },
  { value: "blocked", label: "不可用", disabled: true },
  { value: "remote", label: "远程" },
]

describe("Radix SettingsSelect", () => {
  it("supports keyboard selection of a business-empty option without colliding with opaque IDs", async () => {
    const onValueChange = vi.fn()
    function Example() {
      const [value, setValue] = useState("opaque:7")
      return <SettingsSelect value={value} options={options} label="来源" onValueChange={(next) => { onValueChange(next); setValue(next) }} />
    }
    render(<Example />)
    await userEvent.tab()
    expect(screen.getByRole("combobox", { name: "来源" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await screen.findByRole("listbox")
    await waitFor(() => expect(screen.getByRole("option", { name: "本地" })).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(onValueChange).toHaveBeenCalledExactlyOnceWith(""))
    expect(screen.getByRole("combobox")).toHaveTextContent("不指定")
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(screen.getByRole("option", { name: "不指定" })).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("1"))
    expect(screen.getByRole("combobox")).toHaveTextContent("数字 ID")
  })

  it("skips disabled items and returns focus to the trigger", async () => {
    const onValueChange = vi.fn()
    render(<SettingsSelect value="1" options={options} label="来源" onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(screen.getByRole("option", { name: "数字 ID" })).toHaveFocus())
    expect(screen.getByRole("option", { name: "不可用" })).toHaveAttribute("aria-disabled", "true")
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(onValueChange).toHaveBeenCalledExactlyOnceWith("remote"))
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus())
  })

  it("option removal or reorder never silently selects or calls back", () => {
    const onValueChange = vi.fn()
    const view = render(<SettingsSelect value="1" options={options} label="来源" onValueChange={onValueChange} />)
    expect(screen.getByRole("combobox")).toHaveTextContent("数字 ID")
    view.rerender(<SettingsSelect value="1" options={[...options].reverse()} label="来源" onValueChange={onValueChange} />)
    expect(screen.getByRole("combobox")).toHaveTextContent("数字 ID")
    view.rerender(<SettingsSelect value="1" options={options.filter((option) => option.value !== "1")} label="来源" onValueChange={onValueChange} />)
    expect(screen.getByRole("combobox")).toHaveTextContent("1")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("disabled select cannot open or change", async () => {
    const onValueChange = vi.fn()
    render(<SettingsSelect value="" options={options} label="来源" onValueChange={onValueChange} disabled />)
    const trigger = screen.getByRole("combobox")
    expect(trigger).toBeDisabled()
    await userEvent.click(trigger)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe("Radix Checkbox and Switch", () => {
  it.each(["checkbox", "switch"] as const)("%s supports Space and controlled checked ARIA", async (kind) => {
    const onCheckedChange = vi.fn()
    function Example() {
      const [checked, setChecked] = useState(false)
      const Component = kind === "checkbox" ? Checkbox : Switch
      return <Component checked={checked} label="启用" onCheckedChange={(next) => { onCheckedChange(next); setChecked(next) }} />
    }
    render(<Example />)
    const node = screen.getByRole(kind, { name: "启用" })
    expect(node).not.toBeChecked()
    await userEvent.tab()
    expect(node).toHaveFocus()
    await userEvent.keyboard(" ")
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(node).toBeChecked()
    await userEvent.keyboard(" ")
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(node).not.toBeChecked()
  })

  it.each(["checkbox", "switch"] as const)("disabled %s is not keyboard or pointer interactive", async (kind) => {
    const onCheckedChange = vi.fn()
    const Component = kind === "checkbox" ? Checkbox : Switch
    render(<Component checked={false} label="启用" disabled onCheckedChange={onCheckedChange} />)
    const node = screen.getByRole(kind, { name: "启用" })
    expect(node).toBeDisabled()
    await userEvent.click(node)
    await userEvent.tab()
    expect(node).not.toHaveFocus()
    await userEvent.keyboard(" ")
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it("handles rejected asynchronous callbacks without leaking raw exceptions", async () => {
    const onCheckedChange = vi.fn().mockRejectedValue(new Error("private raw failure"))
    render(<Checkbox checked={false} label="启用" onCheckedChange={onCheckedChange} />)
    await userEvent.click(screen.getByRole("checkbox"))
    expect(await screen.findByRole("alert")).toHaveTextContent("操作未完成，请重试。")
    expect(document.body.textContent).not.toContain("private raw failure")
  })
})

describe("SettingRow/SettingSection", () => {
  it("associates the row label and description with controls and announces pending/error", () => {
    render(<SettingSection title="基础设置" description="即时应用">
      <SettingRow title="名称" description="供成员识别" htmlFor="name" pending error="未完成">
        <input id="name" />
      </SettingRow>
    </SettingSection>)
    expect(screen.getByRole("region", { name: "基础设置" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "名称" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "名称" })).toHaveAccessibleDescription("供成员识别")
    expect(screen.getByRole("status")).toHaveTextContent("正在应用")
    expect(screen.getByRole("alert")).toHaveTextContent("未完成")
  })
})
