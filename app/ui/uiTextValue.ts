export type UiTextValue = string | number | null;

export type UiTextProps = {
  className: string;
  value: UiTextValue;
};

export type InventoryCountProps = {
  value: UiTextValue;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatUiTextValue(value: UiTextValue): string | null {
  if (value === null) {
    return null;
  }

  return String(value);
}

export function renderUiTextHtml({ className, value }: UiTextProps): string {
  const textValue = formatUiTextValue(value);

  if (textValue === null) {
    return "";
  }

  return `<span class="${escapeHtml(className)}">${escapeHtml(textValue)}</span>`;
}

export function renderInventoryCountHtml(props: InventoryCountProps): string {
  return renderUiTextHtml({
    className: "inventory-count",
    value: props.value
  });
}
