import Storage from '../Storage';

class LocalStorageMock {
  [key: string]: any;
}

describe('Without local storage', () => {
  const windowAny: any = window;
  windowAny.localStorage = undefined;

  const storage = new Storage();

  test('Stores a key', () => {
    storage.set('key 1', 'value 1');
    expect(storage.get('key 1')).toBe('value 1');
  });

  test('Returns undefined if key not exists', () => {
    expect(storage.get('unknown')).toBeUndefined();
  });

  test('Updates a key', () => {
    storage.set('key 1', 'value 2');
    expect(storage.get('key 1')).toBe('value 2');
  });

  test('Deletes a key', () => {
    storage.del('key 1');
    expect(storage.get('key 1')).toBeUndefined();
  });
});

describe('With local storage', () => {
  const windowAny: any = window;
  windowAny.localStorage = new LocalStorageMock();

  const storage = new Storage();

  test('Stores a key', () => {
    storage.set('key 1', 'value 1');
    expect(storage.get('key 1')).toBe('value 1');
    expect(windowAny.localStorage['key 1']).toBe('value 1');
  });

  test('Returns undefined if key not exists', () => {
    expect(storage.get('unknown')).toBeUndefined();
  });

  test('Updates a key', () => {
    storage.set('key 1', 'value 2');
    expect(storage.get('key 1')).toBe('value 2');
    expect(windowAny.localStorage['key 1']).toBe('value 2');
  });

  test('Deletes a key', () => {
    storage.del('key 1');
    expect(storage.get('key 1')).toBeUndefined();
    expect(windowAny.localStorage['key 1']).toBeUndefined();
  });
});
