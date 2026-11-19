"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
type Props = {
  children: ReactNode;
  name?: string;
  id?: string;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  onChange?: (event: { target: { value: string } }) => void;
};
type Option = { value: string; label: string; disabled: boolean };
function textOf(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("");
}
export default function AdminSelect({
  children,
  name,
  id,
  value,
  defaultValue,
  disabled = false,
  required = false,
  onChange,
  ...aria
}: Props) {
  const uid = useId(),
    listId = uid + "-options",
    root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const options: Option[] = Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number;
        disabled?: boolean;
        children?: ReactNode;
      }>(child)
    )
      return [];
    const label = textOf(child.props.children);
    return [
      {
        value: String(child.props.value ?? label),
        label,
        disabled: Boolean(child.props.disabled),
      },
    ];
  });
  const [internal, setInternal] = useState(
      String(defaultValue ?? options[0]?.value ?? ""),
    ),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [invalid, setInvalid] = useState(false),
    [position, setPosition] = useState<CSSProperties>({}),
    [host, setHost] = useState<HTMLElement | null>(null);
  const selected = String(value ?? internal),
    selectedIndex = options.findIndex((option) => option.value === selected),
    label = options[selectedIndex]?.label || "Selecione uma opção";
  const query = useRef({ text: "", time: 0 });
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    setInternal(option.value);
    onChange?.({ target: { value: option.value } });
    setInvalid(false);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function show() {
    if (disabled || !options.length) return;
    setActive(Math.max(0, selectedIndex));
    setHost(trigger.current?.closest("dialog") || document.body);
    setOpen(true);
  }
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = innerHeight - rect.bottom - 14,
        spaceAbove = rect.top - 14,
        above = spaceBelow < 190 && spaceAbove > spaceBelow;
      const width = Math.min(Math.max(rect.width, 180), innerWidth - 28);
      setPosition({
        position: "fixed",
        left: Math.max(14, Math.min(rect.left, innerWidth - width - 14)),
        width,
        maxHeight: Math.max(
          100,
          Math.min(300, above ? spaceAbove - 8 : spaceBelow - 8),
        ),
        ...(above
          ? { bottom: innerHeight - rect.top + 7 }
          : { top: rect.bottom + 7 }),
      });
    }
    place();
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !menu.current?.contains(target))
        setOpen(false);
    }
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const panel = menu.current,
      option = panel?.querySelector<HTMLElement>('[data-active="true"]');
    if (!panel || !option) return;
    const top = option.offsetTop,
      bottom = top + option.offsetHeight;
    if (top < panel.scrollTop) panel.scrollTop = top;
    else if (bottom > panel.scrollTop + panel.clientHeight)
      panel.scrollTop = bottom - panel.clientHeight;
  }, [active, open]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  function move(step: number) {
    let index = active;
    for (let count = 0; count < options.length; count++) {
      index = (index + step + options.length) % options.length;
      if (!options[index].disabled) {
        setActive(index);
        break;
      }
    }
  }
  return (
    <div className="admin-select" ref={root}>
      <button
        {...aria}
        id={id || uid}
        ref={trigger}
        className="admin-select-trigger"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? listId + "-" + active : undefined}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            return;
          }
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            if (!open) show();
            else move(event.key === "ArrowDown" ? 1 : -1);
            return;
          }
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            if (!open) show();
            const indexes = options
              .map((option, index) => (option.disabled ? -1 : index))
              .filter((index) => index >= 0);
            setActive(
              event.key === "Home"
                ? indexes[0] || 0
                : indexes[indexes.length - 1] || 0,
            );
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(active);
            else show();
            return;
          }
          if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
          ) {
            const now = Date.now();
            query.current = {
              text:
                (now - query.current.time < 700 ? query.current.text : "") +
                event.key.toLocaleLowerCase("pt-BR"),
              time: now,
            };
            const index = options.findIndex(
              (option) =>
                !option.disabled &&
                option.label
                  .toLocaleLowerCase("pt-BR")
                  .startsWith(query.current.text),
            );
            if (index >= 0) {
              if (open) setActive(index);
              else choose(index);
            }
          }
        }}
      >
        <span className="admin-select-value">{label}</span>
        <svg
          className={"admin-select-chevron" + (open ? " is-open" : "")}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      <select
        className="admin-select-native"
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={selected}
        disabled={disabled}
        required={required}
        onChange={(event) => {
          setInternal(event.target.value);
          onChange?.({ target: { value: event.target.value } });
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        {children}
      </select>
      {open &&
        host &&
        createPortal(
          <div
            ref={menu}
            id={listId}
            className="admin-select-popup"
            role="listbox"
            aria-label={aria["aria-label"] || "Opções"}
            style={position}
          >
            {options.map((option, index) => (
              <div
                id={listId + "-" + index}
                key={option.value}
                role="option"
                aria-selected={option.value === selected}
                aria-disabled={option.disabled || undefined}
                data-active={index === active}
                className="admin-select-option"
                onPointerMove={() => {
                  if (!option.disabled) setActive(index);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                {option.value === selected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                )}
              </div>
            ))}
          </div>,
          host,
        )}
    </div>
  );
}
