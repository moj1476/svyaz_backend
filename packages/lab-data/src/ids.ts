export const id = (n: number) =>
  `10000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
export const ids = {
  alice: id(1),
  bob: id(2),
  outsider: id(3),
  suspended: id(4),
  workspace: id(10),
  otherWorkspace: id(11),
  channel: id(30),
  privateChannel: id(31),
  direct: id(32),
  group: id(33),
  otherChannel: id(34),
  root: id(100),
  file: id(200),
  call: id(400),
};
export const at = '2026-11-02T09:00:00.000Z';
