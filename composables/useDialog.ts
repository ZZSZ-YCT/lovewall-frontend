/**
 * 统一对话框系统 - 桥接到useAdminDialog
 * 所有对话框使用AdminDialog的样式和实现
 */

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface PromptOptions {
  title?: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
}

/**
 * useConfirm - 统一使用AdminDialog样式的确认对话框
 * 为了保持向后兼容，这里桥接到useAdminDialog
 */
export const useConfirm = () => {
  const adminDialog = useAdminDialog()

  const confirm = (options: string | ConfirmOptions) => {
    const normalized: ConfirmOptions = typeof options === 'string'
      ? { message: options }
      : options

    return adminDialog.confirm({
      title: normalized.title || '确认',
      message: normalized.message,
      confirmText: normalized.confirmText,
      cancelText: normalized.cancelText
    })
  }

  // 包装respond以保持向后兼容 - 旧API接受boolean，新API需要AdminDialogResult
  const respond = (result: boolean) => {
    adminDialog.respond({ confirmed: result, inputValue: '' })
  }

  return {
    state: adminDialog.state,
    confirm,
    respond
  }
}

/**
 * usePrompt - 统一使用AdminDialog样式的输入对话框
 * 为了保持向后兼容，这里桥接到useAdminDialog
 */
export const usePrompt = () => {
  const adminDialog = useAdminDialog()

  const prompt = (messageOrOptions: string | PromptOptions, defaultValue?: string) => {
    const normalized: PromptOptions = typeof messageOrOptions === 'string'
      ? { message: messageOrOptions, defaultValue }
      : messageOrOptions

    return adminDialog.prompt({
      title: normalized.title || '输入',
      message: normalized.message,
      placeholder: normalized.placeholder,
      defaultValue: normalized.defaultValue,
      confirmText: normalized.confirmText,
      cancelText: normalized.cancelText
    })
  }

  const setValue = (value: string) => {
    adminDialog.state.value.inputValue = value
  }

  // 包装respond以保持向后兼容 - 旧API接受string|null，新API需要AdminDialogResult
  const respond = (value: string | null) => {
    adminDialog.respond({
      confirmed: value !== null,
      inputValue: value || ''
    })
  }

  return {
    state: adminDialog.state,
    prompt,
    respond,
    setValue
  }
}
