////////////////////////////////////////////////////////////////////////////
//
// Copyright 2022 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

import * as binding from "@realm/bindgen";

import { Object as RealmObject } from "./Object";
import { Results } from "./Results";
import { transformObjectSchema } from "./schema-utils";
import { RealmInsertionModel } from "./InsertionModel";
import { Configuration } from "./Configuration";
import { CanonicalObjectSchema, DefaultObject, RealmObjectConstructor } from "./schema-types";
import { ClassMap } from "./ClassMap";

export class Realm {
  public static Object = RealmObject;
  public static Results = Results;

  private internal: binding.Realm;
  private classes: ClassMap;

  constructor(config: Configuration = {}) {
    this.internal = binding.Realm.getSharedRealm({
      path: config.path || this.getDefaultPath(),
      fifoFilesFallbackPath: this.fifoFilesFallbackPath(),
    });
    // Generate property type converters for every object schema
    this.classes = new ClassMap(this, this.internal.schema);
  }

  get empty(): boolean {
    // ObjectStore::is_empty(realm->read_group())
    throw new Error("Not yet implemented");
  }

  get path(): string {
    return this.internal.config.path;
  }

  get readOnly(): boolean {
    // schema_mode == SchemaMode::Immutable
    throw new Error("Not yet implemented");
  }

  get schema(): CanonicalObjectSchema[] {
    return this.internal.schema.map(transformObjectSchema);
  }

  get schemaVersion(): number {
    return Number(this.internal.schemaVersion);
  }

  get isInTransaction(): boolean {
    return this.internal.isInTransaction;
  }

  get isClosed(): boolean {
    return this.internal.isClosed;
  }

  get syncSession(): any {
    throw new Error("Not yet implemented");
  }

  get subscriptions(): any {
    throw new Error("Not yet implemented");
  }

  close(): void {
    this.internal.close();
  }

  create<T = DefaultObject>(type: string, values: RealmInsertionModel<T>): RealmObject<T> & T;
  create<T = DefaultObject>(type: RealmObjectConstructor<T>, values: RealmInsertionModel<T>): RealmObject<T> & T;
  create<T = DefaultObject>(
    type: string | RealmObjectConstructor<T>,
    values: RealmInsertionModel<T>,
  ): RealmObject<T> & T {
    // Implements https://github.com/realm/realm-js/blob/v11/src/js_realm.hpp#L1260-L1321
    throw new Error("Not yet implemented");
  }

  delete(): void {
    throw new Error("Not yet implemented");
  }

  deleteModel(): void {
    throw new Error("Not yet implemented");
  }

  deleteAll(): void {
    throw new Error("Not yet implemented");
  }

  objectForPrimaryKey<T = DefaultObject>(type: string, primaryKey: T[keyof T]): RealmObject<T> & T;
  objectForPrimaryKey<T = DefaultObject>(type: RealmObjectConstructor<T>, primaryKey: T[keyof T]): RealmObject<T> & T;
  objectForPrimaryKey<T = DefaultObject>(
    type: string | RealmObjectConstructor<T>,
    primaryKey: T[keyof T],
  ): RealmObject<T> & T {
    // Implements https://github.com/realm/realm-js/blob/v11/src/js_realm.hpp#L1240-L1258
    const objectSchema = this.findObjectSchema(type);
    if (objectSchema.primaryKey === "") {
      throw new Error(`Expected a primary key on "${objectSchema.name}"`);
    }
    const table = binding.Helpers.getTable(this.internal, objectSchema.tableKey);
    const { converters, createObjectWrapper } = this.classes.get(typeof type === "string" ? type : type.name);
    const value = converters.get(objectSchema.primaryKey).toMixed(primaryKey);
    try {
      const obj = table.getObjectWithPrimaryKey(value);
      return createObjectWrapper(obj) as RealmObject<T> & T;
    } catch (err) {
      // TODO: Match on something else than the error message, when exposed by the binding
      if (err instanceof Error && err.message.startsWith("No object with key")) {
        throw new Error(`No '${objectSchema.name}' with key '${primaryKey}'`);
      } else {
        throw err;
      }
    }
  }

  objects<T = DefaultObject>(type: string): Results<T>;
  objects<T = DefaultObject>(type: RealmObjectConstructor<T>): Results<T>;
  objects<T = DefaultObject>(type: string | RealmObjectConstructor<T>): Results<T> {
    throw new Error("Not yet implemented");
  }

  addListener(): unknown {
    throw new Error("Not yet implemented");
  }

  removeListener(): unknown {
    throw new Error("Not yet implemented");
  }

  removeAllListeners(): unknown {
    throw new Error("Not yet implemented");
  }

  write<T>(callback: () => T): T {
    try {
      this.internal.beginTransaction();
      const result = callback();
      this.internal.commitTransaction();
      return result;
    } catch (err) {
      this.internal.cancelTransaction();
      throw err;
    }
  }

  beginTransaction(): void {
    this.internal.beginTransaction();
  }

  commitTransaction(): void {
    this.internal.commitTransaction();
  }

  cancelTransaction(): void {
    this.internal.cancelTransaction();
  }

  compact(): boolean {
    throw new Error("Not yet implemented");
  }

  writeCopyTo(): unknown {
    throw new Error("Not yet implemented");
  }

  _updateSchema(): unknown {
    throw new Error("Not yet implemented");
  }

  /**
   * TODO: Make this platform dependent
   */
  private getDefaultPath() {
    return "default.realm";
  }

  /**
   * TODO: Make this platform dependent
   */
  private fifoFilesFallbackPath() {
    return "";
  }

  /**
   * Finds the object schema from a specific name
   * @see https://github.com/realm/realm-js/blob/v11/src/js_realm.hpp#L465-L508
   * TODO: Memoize this
   */
  private findObjectSchema(name: string | RealmObjectConstructor<unknown>) {
    if (typeof name === "string") {
      const schema = this.internal.schema.find((schema) => schema.name === name);
      if (!schema) {
        throw new Error("Unable to find object schema");
      }
      return schema;
    } else {
      throw new Error("Not yet implemented");
    }
  }
}
