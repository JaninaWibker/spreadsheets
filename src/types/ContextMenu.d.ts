export type SimpleEntry = {
  key: string,
  simple: boolean,
  submenu: boolean,
  name: string,
  icon?: JSX.Element,
  action?: () => any,
  shortcut?: string[]
}

export type AdvancedEntry = {
  key: string,
  simple: boolean,
  submenu: boolean,
  component: (entry: AdvancedEntry, close: () => void) => JSX.Element,
  shortcut?: string[]
}

export type SimpleSubmenuEntry = {
  key: string,
  simple: boolean,
  submenu: boolean,
  name: string,
  expand_icon?: JSX.Element,
  action?: () => any,
  menu: Entry[],
}

export type AdvancedSubmenuEntry = {
  key: string,
  simple: boolean,
  submenu: boolean,
  menu: any,
  component: (entry: AdvancedEntry, close: () => void) => JSX.Element,
  shortcut?: string[]
}

export type Entry = SimpleEntry | AdvancedEntry | SubmenuEntry