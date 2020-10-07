const isMacOrIos = () => navigator.appVersion.search(/mac/i) !== -1

const isNotMacOrIos = () => !isMacOrIos()

// this is just a super basic test which shouldn't always be trusted
export default {
  isMac: isMacOrIos,
  isIos: isMacOrIos,
  isMacOrIos: isMacOrIos,
  isLinux: isNotMacOrIos,
  isWindows: isNotMacOrIos,
}

export {
  isMacOrIos as isMac,
  isMacOrIos as isIos,
  isMacOrIos as isMacOrIos,
  isNotMacOrIos as isLinux,
  isNotMacOrIos as isWindows,
}

