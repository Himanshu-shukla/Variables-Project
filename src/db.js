import Dexie from 'dexie';

const db = new Dexie('MyAppDB');
db.version(1).stores({
  variables: '++id, name, unit, minValue, maxValue, selected',
});

export default db;