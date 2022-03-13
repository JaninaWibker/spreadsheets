export type SimpleEntry = {
  key: string,
  simple: true,
  submenu: false,
  name: string,
  icon?: JSX.Element,
  action?: () => any,
  shortcut?: string[]
}

export type AdvancedEntry = {
  key: string,
  simple: false,
  submenu: false,
  component: (entry: AdvancedEntry, close: () => void) => JSX.Element,
  shortcut?: string[]
}

export type SimpleSubmenuEntry = {
  key: string,
  simple: true,
  submenu: true,
  name: string,
  expand_icon?: JSX.Element,
  action?: () => any,
  menu: Entry[],
}

export type AdvancedSubmenuEntry = {
  key: string,
  simple: false,
  submenu: true,
  component: (
    entry: AdvancedSumenuEntry,
    close: () => void,
    register_submenu: (menu: { is_open: boolean, close: () => void}) => number,
    notify_open_submenu: (idx: number, is_open: boolean) => void
  ) => JSX.Element,
  shortcut?: string[]
}

export type Entry = SimpleEntry | AdvancedEntry | SubmenuEntry