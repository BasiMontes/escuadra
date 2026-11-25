/** Lleva el foco al primer campo con error, una vez pintados los mensajes. */
export function focusFirstError(form: HTMLFormElement) {
  requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
}
