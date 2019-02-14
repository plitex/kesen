import { autorun } from 'mobx';
import ClientManager from '../ClientManager';
import Collection from '../Collection';

describe('Without registered client', () => {
  test('Throws error if client not found', () => {
    expect(() => {
      new Collection('my_collection'); // tslint:disable-line
    }).toThrow();
  });
});

describe('With registered default client', () => {
  let client: any;

  beforeAll(() => {
    client = {
      registerCollection: jest.fn()
    };
    ClientManager.getClient = jest.fn(() => client);
  });

  test('Throw error if name is empty', () => {
    expect(() => {
      new Collection(''); // tslint:disable-line
    }).toThrow();
  });

  test('Registers collection', () => {
    const collection = new Collection('my_collection');
    expect(client.registerCollection.mock.calls.length).toBe(1);
    expect(client.registerCollection.mock.calls[0][0]).toBe(collection);
  });

  test('Store collection name', () => {
    const name = 'my_collection';
    const collection = new Collection(name);
    expect(collection.name).toBe(name);
  });

  test('Collection is empty', () => {
    const name = 'my_collection';
    const collection = new Collection(name);
    expect(collection.count()).toBe(0);
  });

  test('Adds document', () => {
    const name = 'my_collection';
    const collection = new Collection(name);
    expect(collection.count()).toBe(0);
    collection.insert('1', { field1: 'value1' });
    expect(collection.count()).toBe(1);
    collection.insert('2', { field1: 'value1' });
    expect(collection.count()).toBe(2);
  });

  test('Count documents', () => {
    const name = 'my_collection';
    const collection = new Collection(name);
    expect(collection.count()).toBe(0);
    collection.insert('1', { field1: 'value1' });
    expect(collection.count()).toBe(1);
    collection.insert('2', { field1: 'value1' });
    expect(collection.count()).toBe(2);
  });

  test('Find documents without selector', () => {
    const name = 'my_collection';
    const doc1 = { _id: '1', field1: 'value1' };
    const doc2 = { _id: '2', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert(doc1._id, doc1);
    collection.insert(doc2._id, doc2);

    const result = collection.find();
    expect(result).toBeTruthy();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(doc1);
    expect(result[1]).toEqual(doc2);
  });

  test('Find documents by id', () => {
    const name = 'my_collection';
    const doc1 = { _id: '1', field1: 'value1' };
    const doc2 = { _id: '2', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert(doc1._id, doc1);
    collection.insert(doc2._id, doc2);

    let result = collection.find(doc2._id);
    expect(result).toBeTruthy();
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(doc2);

    result = collection.find(doc1._id);
    expect(result).toBeTruthy();
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(doc1);
  });

  test('Find documents with selector', () => {
    const name = 'my_collection';
    const doc1 = { _id: '1', field1: 'value1' };
    const doc2 = { _id: '2', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert(doc1._id, doc1);
    collection.insert(doc2._id, doc2);

    const result = collection.find({});
    expect(result).toBeTruthy();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(doc1);
    expect(result[1]).toEqual(doc2);
  });

  test('Find documents with selector 2', () => {
    const name = 'my_collection';
    const doc1 = { _id: '1', field1: 'value1' };
    const doc2 = { _id: '2', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert(doc1._id, doc1);
    collection.insert(doc2._id, doc2);

    const result = collection.find({ _id: '1' });
    expect(result).toBeTruthy();
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(doc1);
  });

  test('Find one document by id', () => {
    const name = 'my_collection';
    const doc1 = { _id: '1', field1: 'value1' };
    const doc2 = { _id: '2', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert(doc1._id, doc1);
    collection.insert(doc2._id, doc2);

    expect(collection.findOne(doc2._id)).toEqual(doc2);
    expect(collection.findOne(doc1._id)).toEqual(doc1);
  });

  test('Find one document without selector', () => {
    const name = 'my_collection';
    const doc1 = { _id: '1', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert(doc1._id, doc1);

    expect(collection.findOne()).toEqual(doc1);
  });

  test('Change throw error if document not found', () => {
    const name = 'my_collection';
    const collection = new Collection(name);
    expect(() => {
      collection.update('badid', { field1: 'xxx' });
    }).toThrow();
  });

  test('Change documents', () => {
    const name = 'my_collection';
    const doc = { _id: '1', field1: 'value1' };
    const collection = new Collection(name);

    collection.insert(doc._id, doc);

    collection.update(doc._id, { field1: 'xxx' });
    let result = collection.find(doc._id);
    expect(result[0]).toEqual({ _id: '1', field1: 'xxx' });

    collection.update(doc._id, { field2: 'yyy' });
    result = collection.find(doc._id);
    expect(result[0]).toEqual({ _id: '1', field1: 'xxx', field2: 'yyy' });

    collection.update(doc._id, {}, ['field1']);
    result = collection.find(doc._id);
    expect(result[0]).toEqual({ _id: '1', field2: 'yyy' });
  });

  test('Removes document', () => {
    const name = 'my_collection';
    const doc = { _id: '1', field1: 'value1' };
    const collection = new Collection(name);
    collection.insert('1', doc);
    expect(collection.count()).toBe(1);
    collection.remove('1');
    expect(collection.count()).toBe(0);
  });

  test('Trigger MobX Autorun', () => {
    const name = 'my_collection';
    const doc = { _id: '1', field1: 'value1' };
    const collection = new Collection(name);

    const mockFn = jest.fn().mockImplementation(() => {
      collection.find();
    });
    autorun(mockFn);

    expect(mockFn.mock.calls.length).toBe(1);
    collection.insert('1', doc);
    expect(mockFn.mock.calls.length).toBe(2);
    collection.update('1', { a: 1 });
    expect(mockFn.mock.calls.length).toBe(3);
    collection.remove('1');
    expect(mockFn.mock.calls.length).toBe(4);
    collection.count();
    expect(mockFn.mock.calls.length).toBe(4);
  });
});
