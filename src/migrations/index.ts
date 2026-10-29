import * as migration_20260923_085127_initial from './20260923_085127_initial';

export const migrations = [
  {
    up: migration_20260923_085127_initial.up,
    down: migration_20260923_085127_initial.down,
    name: '20260923_085127_initial'
  },
];
