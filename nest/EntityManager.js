"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
const util_1 = require("util");
const utils_1 = require("./utils");
const entity_1 = require("./entity");
const unit_of_work_1 = require("./unit-of-work");
const enums_1 = require("./enums");
const events_1 = require("./events");
const errors_1 = require("./errors");
/**
 * The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
 * such as UnitOfWork, Query Language and Repository API.
 * @template {D} current driver type
 */
class EntityManager {
  /**
   * @internal
   */
  constructor(config, driver, metadata, useContext = true, eventManager = new events_1.EventManager(config.get('subscribers'))) {
    this.config = config;
    this.driver = driver;
    this.metadata = metadata;
    this.useContext = useContext;
    this.eventManager = eventManager;
    this._id = EntityManager.counter++;
    this.global = false;
    this.name = this.config.get('contextName');
    this.validator = new entity_1.EntityValidator(this.config.get('strict'));
    this.repositoryMap = {};
    this.entityLoader = new entity_1.EntityLoader(this);
    this.comparator = this.config.getComparator(this.metadata);
    this.entityFactory = new entity_1.EntityFactory(this);
    this.unitOfWork = new unit_of_work_1.UnitOfWork(this);
    this.resultCache = this.config.getResultCacheAdapter();
    this.filters = {};
    this.filterParams = {};
  }
  /**
   * Gets the Driver instance used by this EntityManager.
   * Driver is singleton, for one MikroORM instance, only one driver is created.
   */
  getDriver() {
    return this.driver;
  }
  /**
   * Gets the Connection instance, by default returns write connection
   */
  getConnection(type) {
    return this.driver.getConnection(type);
  }
  /**
   * Gets the platform instance. Just like the driver, platform is singleton, one for a MikroORM instance.
   */
  getPlatform() {
    return this.driver.getPlatform();
  }
  /**
   * Gets repository for given entity. You can pass either string name or entity class reference.
   */
  getRepository(entityName) {
    entityName = utils_1.Utils.className(entityName);
    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata.get(entityName);
      const RepositoryClass = this.config.getRepositoryClass(meta.customRepository);
      this.repositoryMap[entityName] = new RepositoryClass(this.getContext(false), entityName);
    }
    return this.repositoryMap[entityName];
  }
  /**
   * Shortcut for `em.getRepository()`.
   */
  repo(entityName) {
    return this.getRepository(entityName);
  }
  /**
   * Gets EntityValidator instance
   */
  getValidator() {
    return this.validator;
  }
  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find(entityName, where, options = {}) {
    if (options.disableIdentityMap) {
      const em = this.getContext(false);
      const fork = em.fork();
      const ret = await fork.find(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();
      return ret;
    }

    console.log("GETTING CONTEXT IN FIND");

    const em = this.getContext();
    await em.tryFlush(entityName, options);
    entityName = utils_1.Utils.className(entityName);
    where = await em.processWhere(entityName, where, options, 'read');
    em.validator.validateParams(where);
    options.orderBy = options.orderBy || {};
    options.populate = em.preparePopulate(entityName, options);
    const populate = options.populate;
    const cached = await em.tryCache(entityName, options.cache, [entityName, 'em.find', options, where], options.refresh, true);
    if (cached?.data) {
      await em.entityLoader.populate(entityName, cached.data, populate, {
        ...options,
        ...em.getPopulateWhere(where, options),
        convertCustomTypes: false,
        ignoreLazyScalarProperties: true,
        lookup: false,
      });
      return cached.data;
    }
    const results = await em.driver.find(entityName, where, { ctx: em.transactionContext, ...options });
    if (results.length === 0) {
      await em.storeCache(options.cache, cached, []);
      return [];
    }
    const meta = this.metadata.get(entityName);
    const ret = [];
    for (const data of results) {
      const entity = em.entityFactory.create(entityName, data, {
        merge: true,
        refresh: options.refresh,
        schema: options.schema,
        convertCustomTypes: true,
      });
      if (!meta.virtual) {
        em.unitOfWork.registerManaged(entity, data, { refresh: options.refresh, loaded: true });
      }
      ret.push(entity);
    }
    if (meta.virtual) {
      await em.unitOfWork.dispatchOnLoadEvent();
      await em.storeCache(options.cache, cached, () => ret);
      return ret;
    }
    const unique = utils_1.Utils.unique(ret);
    await em.entityLoader.populate(entityName, unique, populate, {
      ...options,
      ...em.getPopulateWhere(where, options),
      convertCustomTypes: false,
      ignoreLazyScalarProperties: true,
      lookup: false,
    });
    await em.unitOfWork.dispatchOnLoadEvent();
    await em.storeCache(options.cache, cached, () => unique.map(e => (0, entity_1.helper)(e).toPOJO()));
    return unique;
  }
  getPopulateWhere(where, options) {
    if (options.populateWhere === undefined) {
      options.populateWhere = this.config.get('populateWhere');
    }
    if (options.populateWhere === enums_1.PopulateHint.ALL) {
      return { where: {}, populateWhere: options.populateWhere };
    }
    if (options.populateWhere === enums_1.PopulateHint.INFER) {
      return { where, populateWhere: options.populateWhere };
    }
    return { where: options.populateWhere };
  }
  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter(name, cond, entityName, enabled = true) {
    const options = { name, cond, default: enabled };
    if (entityName) {
      options.entity = utils_1.Utils.asArray(entityName).map(n => utils_1.Utils.className(n));
    }
    this.getContext(false).filters[name] = options;
  }
  /**
   * Sets filter parameter values globally inside context defined by this entity manager.
   * If you want to set shared value for all contexts, be sure to use the root entity manager.
   */
  setFilterParams(name, args) {
    this.getContext().filterParams[name] = args;
  }
  /**
   * Returns filter parameters for given filter set in this context.
   */
  getFilterParams(name) {
    return this.getContext().filterParams[name];
  }
  setFlushMode(flushMode) {
    this.getContext(false).flushMode = flushMode;
  }
  async processWhere(entityName, where, options, type) {
    where = utils_1.QueryHelper.processWhere({
      where: where,
      entityName,
      metadata: this.metadata,
      platform: this.driver.getPlatform(),
      convertCustomTypes: options.convertCustomTypes,
      aliased: type === 'read',
    });
    where = await this.applyFilters(entityName, where, options.filters ?? {}, type);
    where = await this.applyDiscriminatorCondition(entityName, where);
    return where;
  }
  applyDiscriminatorCondition(entityName, where) {
    const meta = this.metadata.find(entityName);
    if (!meta?.discriminatorValue) {
      return where;
    }
    const types = Object.values(meta.root.discriminatorMap).map(cls => this.metadata.find(cls));
    const children = [];
    const lookUpChildren = (ret, type) => {
      const children = types.filter(meta2 => meta2.extends === type);
      children.forEach(m => lookUpChildren(ret, m.className));
      ret.push(...children.filter(c => c.discriminatorValue));
      return children;
    };
    lookUpChildren(children, meta.className);
    where[meta.root.discriminatorColumn] = children.length > 0 ? { $in: [meta.discriminatorValue, ...children.map(c => c.discriminatorValue)] } : meta.discriminatorValue;
    return where;
  }
  /**
   * @internal
   */
  async applyFilters(entityName, where, options, type) {
    const meta = this.metadata.find(entityName);
    const filters = [];
    const ret = [];
    if (!meta) {
      return where;
    }
    const active = new Set();
    const push = (source) => {
      const activeFilters = utils_1.QueryHelper
        .getActiveFilters(entityName, options, source)
        .filter(f => !active.has(f.name));
      filters.push(...activeFilters);
      activeFilters.forEach(f => active.add(f.name));
    };
    push(this.config.get('filters'));
    push(this.filters);
    push(meta.filters);
    if (filters.length === 0) {
      return where;
    }
    for (const filter of filters) {
      let cond;
      if (filter.cond instanceof Function) {
        const args = utils_1.Utils.isPlainObject(options[filter.name]) ? options[filter.name] : this.getContext().filterParams[filter.name];
        if (!args && filter.cond.length > 0 && filter.args !== false) {
          throw new Error(`No arguments provided for filter '${filter.name}'`);
        }
        cond = await filter.cond(args, type, this);
      }
      else {
        cond = filter.cond;
      }
      ret.push(utils_1.QueryHelper.processWhere({
        where: cond,
        entityName,
        metadata: this.metadata,
        platform: this.driver.getPlatform(),
        aliased: type === 'read',
      }));
    }
    const conds = [...ret, where].filter(c => utils_1.Utils.hasObjectKeys(c));
    return conds.length > 1 ? { $and: conds } : conds[0];
  }
  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount(entityName, where, options = {}) {
    const [entities, count] = await Promise.all([
      this.find(entityName, where, options),
      this.count(entityName, where, options),
    ]);
    return [entities, count];
  }
  /**
   * Refreshes the persistent state of an entity from the database, overriding any local changes that have not yet been persisted.
   */
  async refresh(entity, options = {}) {
    const fork = this.fork();
    const entityName = entity.constructor.name;
    const reloaded = await fork.findOne(entityName, entity, {
      schema: (0, entity_1.helper)(entity).__schema,
      ...options,
      flushMode: 0 /* FlushMode.COMMIT */,
    });
    if (reloaded) {
      this.config.getHydrator(this.metadata).hydrate(entity, (0, entity_1.helper)(entity).__meta, (0, entity_1.helper)(reloaded).toPOJO(), this.getEntityFactory(), 'full');
    }
    else {
      this.getUnitOfWork().unsetIdentity(entity);
    }
    return reloaded;
  }
  /**
   * Finds first entity matching your `where` query.
   */
  async findOne(entityName, where, options = {}) {
    if (options.disableIdentityMap) {
      const em = this.getContext(false);
      const fork = em.fork();
      const ret = await fork.findOne(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();
      return ret;
    }
    const em = this.getContext();
    await em.tryFlush(entityName, options);
    entityName = utils_1.Utils.className(entityName);
    const meta = em.metadata.get(entityName);
    where = await em.processWhere(entityName, where, options, 'read');
    em.validator.validateEmptyWhere(where);
    em.checkLockRequirements(options.lockMode, meta);
    let entity = em.unitOfWork.tryGetById(entityName, where, options.schema);
    const isOptimisticLocking = !utils_1.Utils.isDefined(options.lockMode) || options.lockMode === enums_1.LockMode.OPTIMISTIC;
    if (entity && !em.shouldRefresh(meta, entity, options) && isOptimisticLocking) {
      return em.lockAndPopulate(entityName, entity, where, options);
    }
    em.validator.validateParams(where);
    options.populate = em.preparePopulate(entityName, options);
    const cached = await em.tryCache(entityName, options.cache, [entityName, 'em.findOne', options, where], options.refresh, true);
    if (cached?.data) {
      await em.entityLoader.populate(entityName, [cached.data], options.populate, {
        ...options,
        ...em.getPopulateWhere(where, options),
        convertCustomTypes: false,
        ignoreLazyScalarProperties: true,
        lookup: false,
      });
      em.unitOfWork.saveSnapshots();
      return cached.data;
    }
    const data = await em.driver.findOne(entityName, where, { ctx: em.transactionContext, ...options });
    if (!data) {
      await em.storeCache(options.cache, cached, null);
      return null;
    }
    entity = em.entityFactory.create(entityName, data, {
      merge: true,
      refresh: options.refresh,
      schema: options.schema,
      convertCustomTypes: true,
    });
    if (!meta.virtual) {
      em.unitOfWork.registerManaged(entity, data, { refresh: options.refresh, loaded: true });
      await em.lockAndPopulate(entityName, entity, where, options);
    }
    await em.unitOfWork.dispatchOnLoadEvent();
    await em.storeCache(options.cache, cached, () => (0, entity_1.helper)(entity).toPOJO());
    return entity;
  }
  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * If the `strict` option is specified and nothing is found or more than one matching entity is found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` (`findExactlyOneOrFailHandler` when specifying `strict`) globally.
   */
  async findOneOrFail(entityName, where, options = {}) {
    let entity;
    let isStrictViolation = false;
    if (options.strict) {
      const ret = await this.find(entityName, where, { ...options, limit: 2 });
      isStrictViolation = ret.length !== 1;
      entity = ret[0];
    }
    else {
      entity = await this.findOne(entityName, where, options);
    }
    if (!entity || isStrictViolation) {
      const key = options.strict ? 'findExactlyOneOrFailHandler' : 'findOneOrFailHandler';
      options.failHandler ?? (options.failHandler = this.config.get(key));
      entityName = utils_1.Utils.className(entityName);
      throw options.failHandler(entityName, where);
    }
    return entity;
  }
  /**
   * Creates or updates the entity, based on whether it is already present in the database.
   * This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed
   * entity instance. The method accepts either `entityName` together with the entity `data`, or just entity instance.
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
   * ```
   *
   * The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * // select "id" from "author" where "email" = 'foo@bar.com'
   * const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
   * ```
   *
   * Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.
   *
   * If the entity is already present in current context, there won't be any queries - instead, the entity data will be assigned and an explicit `flush` will be required for those changes to be persisted.
   */
  async upsert(entityNameOrEntity, data, options = {}) {
    const em = this.getContext(false);
    let entityName;
    let where;
    let entity;
    if (data === undefined) {
      entityName = entityNameOrEntity.constructor.name;
      data = entityNameOrEntity;
    }
    else {
      entityName = utils_1.Utils.className(entityNameOrEntity);
    }
    const meta = this.metadata.get(entityName);
    if (utils_1.Utils.isEntity(data)) {
      entity = data;
      if ((0, entity_1.helper)(entity).__managed && (0, entity_1.helper)(entity).__em === em) {
        em.entityFactory.mergeData(meta, entity, data);
        return entity;
      }
      where = (0, entity_1.helper)(entity).getPrimaryKey();
      data = em.comparator.prepareEntity(entity);
    }
    else {
      where = utils_1.Utils.extractPK(data, meta);
      if (where) {
        const exists = em.unitOfWork.getById(entityName, where, options.schema);
        if (exists) {
          return em.assign(exists, data);
        }
      }
    }
    const unique = meta.props.filter(p => p.unique).map(p => p.name);
    const propIndex = unique.findIndex(p => data[p] != null);
    if (where == null) {
      if (propIndex >= 0) {
        where = { [unique[propIndex]]: data[unique[propIndex]] };
      }
      else if (meta.uniques.length > 0) {
        for (const u of meta.uniques) {
          if (utils_1.Utils.asArray(u.properties).every(p => data[p])) {
            where = utils_1.Utils.asArray(u.properties).reduce((o, key) => {
              o[key] = data[key];
              return o;
            }, {});
            break;
          }
        }
      }
    }
    if (where == null) {
      const compositeUniqueProps = meta.uniques.map(u => utils_1.Utils.asArray(u.properties).join(' + '));
      const uniqueProps = meta.primaryKeys.concat(...unique).concat(compositeUniqueProps);
      throw new Error(`Unique property value required for upsert, provide one of: ${uniqueProps.join(', ')}`);
    }
    data = utils_1.QueryHelper.processObjectParams(data);
    em.validator.validateParams(data, 'insert data');
    const ret = await em.driver.nativeUpdate(entityName, where, data, {
      ctx: em.transactionContext,
      upsert: true,
      convertCustomTypes: false,
      ...options,
    });
    if (ret.row) {
      const prop = meta.getPrimaryProps()[0];
      const value = ret.row[prop.fieldNames[0]];
      data[prop.name] = prop.customType ? prop.customType.convertToJSValue(value, this.getPlatform()) : value;
    }
    entity ?? (entity = em.entityFactory.create(entityName, data, {
      refresh: true,
      initialized: true,
      schema: options.schema,
      convertCustomTypes: true,
    }));
    if (!(0, entity_1.helper)(entity).hasPrimaryKey()) {
      const pk = await this.driver.findOne(meta.className, where, {
        fields: meta.primaryKeys,
        ctx: em.transactionContext,
        convertCustomTypes: true,
      });
      em.entityFactory.mergeData(meta, entity, pk);
    }
    em.unitOfWork.registerManaged(entity, data, { refresh: true });
    return entity;
  }
  /**
   * Creates or updates the entity, based on whether it is already present in the database.
   * This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed
   * entity instance. The method accepts either `entityName` together with the entity `data`, or just entity instance.
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
   * ```
   *
   * The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com'), (666, 'lol@lol.lol') on conflict ("email") do update set "age" = excluded."age"
   * // select "id" from "author" where "email" = 'foo@bar.com'
   * const author = await em.upsertMany(Author, [
   *   { email: 'foo@bar.com', age: 33 },
   *   { email: 'lol@lol.lol', age: 666 },
   * ]);
   * ```
   *
   * Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.
   *
   * If the entity is already present in current context, there won't be any queries - instead, the entity data will be assigned and an explicit `flush` will be required for those changes to be persisted.
   */
  async upsertMany(entityNameOrEntity, data, options = {}) {
    const em = this.getContext(false);
    let entityName;
    let propIndex;
    if (data === undefined) {
      entityName = entityNameOrEntity[0].constructor.name;
      data = entityNameOrEntity;
    }
    else {
      entityName = utils_1.Utils.className(entityNameOrEntity);
    }
    const meta = this.metadata.get(entityName);
    const allData = [];
    const allWhere = [];
    const entities = new Map();
    for (let row of data) {
      let where;
      if (utils_1.Utils.isEntity(row)) {
        const entity = row;
        if ((0, entity_1.helper)(entity).__managed && (0, entity_1.helper)(entity).__em === em) {
          em.entityFactory.mergeData(meta, entity, row);
          entities.set(entity, row);
          continue;
        }
        where = (0, entity_1.helper)(entity).getPrimaryKey();
        row = em.comparator.prepareEntity(entity);
      }
      else {
        where = utils_1.Utils.extractPK(row, meta);
        if (where) {
          const exists = em.unitOfWork.getById(entityName, where, options.schema);
          if (exists) {
            em.assign(exists, row);
            entities.set(exists, row);
            continue;
          }
        }
      }
      const unique = meta.props.filter(p => p.unique).map(p => p.name);
      propIndex = unique.findIndex(p => row[p] != null);
      if (where == null) {
        if (propIndex >= 0) {
          where = { [unique[propIndex]]: row[unique[propIndex]] };
        }
        else if (meta.uniques.length > 0) {
          for (const u of meta.uniques) {
            if (utils_1.Utils.asArray(u.properties).every(p => row[p])) {
              where = utils_1.Utils.asArray(u.properties).reduce((o, key) => {
                o[key] = row[key];
                return o;
              }, {});
              break;
            }
          }
        }
      }
      if (where == null) {
        const compositeUniqueProps = meta.uniques.map(u => utils_1.Utils.asArray(u.properties).join(' + '));
        const uniqueProps = meta.primaryKeys.concat(...unique).concat(compositeUniqueProps);
        throw new Error(`Unique property value required for upsert, provide one of: ${uniqueProps.join(', ')}`);
      }
      row = utils_1.QueryHelper.processObjectParams(row);
      em.validator.validateParams(row, 'insert data');
      allData.push(row);
      allWhere.push(where);
    }
    if (entities.size === data.length) {
      return [...entities.keys()];
    }
    const ret = await em.driver.nativeUpdateMany(entityName, allWhere, allData, { ctx: em.transactionContext, upsert: true, ...options });
    if (ret.rows?.length) {
      const prop = meta.getPrimaryProps()[0];
      ret.rows.forEach((row, idx) => {
        const value = row[prop.fieldNames[0]];
        allData[idx][prop.name] = prop.customType ? prop.customType.convertToJSValue(value, this.getPlatform()) : value;
        if (utils_1.Utils.isEntity(data[idx])) {
          em.entityFactory.mergeData(meta, data[idx], { [prop.name]: value });
        }
      });
    }
    entities.clear();
    const loadPK = new Map();
    allData.forEach((row, i) => {
      const entity = utils_1.Utils.isEntity(data[i]) ? data[i] : em.entityFactory.create(entityName, row, {
        refresh: true,
        initialized: true,
        schema: options.schema,
        convertCustomTypes: true,
      });
      if (!(0, entity_1.helper)(entity).hasPrimaryKey()) {
        loadPK.set(entity, allWhere[i]);
      }
      entities.set(entity, row);
    });
    // skip if we got the PKs via returning statement (`rows`)
    if (!ret.rows?.length && loadPK.size > 0) {
      const unique = meta.props.filter(p => p.unique).map(p => p.name);
      const add = propIndex >= 0 ? [unique[propIndex]] : [];
      const pks = await this.driver.find(meta.className, { $or: [...loadPK.values()] }, {
        fields: meta.primaryKeys.concat(...add),
        ctx: em.transactionContext,
        convertCustomTypes: true,
      });
      let i = 0;
      for (const entity of loadPK.keys()) {
        em.entityFactory.mergeData(meta, entity, pks[i]);
        i++;
      }
    }
    for (const [entity, data] of entities) {
      em.unitOfWork.registerManaged(entity, data, { refresh: true });
    }
    return [...entities.keys()];
  }
  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async transactional(cb, options = {}) {
    const em = this.getContext(false);
    const fork = em.fork({
      clear: false,
      flushMode: options.flushMode,
      cloneEventManager: true,
    });
    options.ctx ?? (options.ctx = em.transactionContext);
    return utils_1.TransactionContext.createAsync(fork, async () => {
      return fork.getConnection().transactional(async (trx) => {
        fork.transactionContext = trx;
        fork.eventManager.registerSubscriber({
          afterFlush(args) {
            args.uow.getChangeSets()
              .filter(cs => [unit_of_work_1.ChangeSetType.DELETE, unit_of_work_1.ChangeSetType.DELETE_EARLY].includes(cs.type))
              .forEach(cs => em.unitOfWork.unsetIdentity(cs.entity));
          },
        });
        const ret = await cb(fork);
        await fork.flush();
        // ensure all entities from inner context are merged to the upper one
        for (const entity of fork.unitOfWork.getIdentityMap()) {
          em.unitOfWork.registerManaged(entity);
          entity.__helper.__em = em;
        }
        return ret;
      }, { ...options, eventBroadcaster: new events_1.TransactionEventBroadcaster(fork) });
    });
  }
  /**
   * Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.
   */
  async begin(options = {}) {
    const em = this.getContext(false);
    em.transactionContext = await em.getConnection('write').begin({ ...options, eventBroadcaster: new events_1.TransactionEventBroadcaster(em) });
  }
  /**
   * Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.
   */
  async commit() {
    const em = this.getContext(false);
    if (!em.transactionContext) {
      throw errors_1.ValidationError.transactionRequired();
    }
    await em.flush();
    await em.getConnection('write').commit(em.transactionContext, new events_1.TransactionEventBroadcaster(em));
    delete em.transactionContext;
  }
  /**
   * Rollbacks the transaction bound to this EntityManager.
   */
  async rollback() {
    const em = this.getContext(false);
    if (!em.transactionContext) {
      throw errors_1.ValidationError.transactionRequired();
    }
    await em.getConnection('write').rollback(em.transactionContext, new events_1.TransactionEventBroadcaster(em));
    delete em.transactionContext;
    em.unitOfWork.clearActionsQueue();
  }
  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async lock(entity, lockMode, options = {}) {
    options = utils_1.Utils.isPlainObject(options) ? options : { lockVersion: options };
    await this.getUnitOfWork().lock(entity, { lockMode, ...options });
  }
  /**
   * alias for `em.insert()`
   * @deprecated use `em.insert()` instead
   */
  async nativeInsert(entityNameOrEntity, data, options = {}) {
    return this.insert(entityNameOrEntity, data, options);
  }
  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async insert(entityNameOrEntity, data, options = {}) {
    const em = this.getContext(false);
    let entityName;
    if (data === undefined) {
      entityName = entityNameOrEntity.constructor.name;
      data = entityNameOrEntity;
    }
    else {
      entityName = utils_1.Utils.className(entityNameOrEntity);
    }
    if (utils_1.Utils.isEntity(data)) {
      const meta = (0, entity_1.helper)(data).__meta;
      const payload = em.comparator.prepareEntity(data);
      const cs = new unit_of_work_1.ChangeSet(data, unit_of_work_1.ChangeSetType.CREATE, payload, meta);
      await em.unitOfWork.getChangeSetPersister().executeInserts([cs], { ctx: em.transactionContext, ...options });
      return cs.getPrimaryKey();
    }
    data = utils_1.QueryHelper.processObjectParams(data);
    em.validator.validateParams(data, 'insert data');
    const res = await em.driver.nativeInsert(entityName, data, { ctx: em.transactionContext, ...options });
    return res.insertId;
  }
  /**
   * Fires native multi-insert query. Calling this has no side effects on the context (identity map).
   */
  async insertMany(entityNameOrEntities, data, options = {}) {
    const em = this.getContext(false);
    let entityName;
    if (data === undefined) {
      entityName = entityNameOrEntities[0].constructor.name;
      data = entityNameOrEntities;
    }
    else {
      entityName = utils_1.Utils.className(entityNameOrEntities);
    }
    if (utils_1.Utils.isEntity(data[0])) {
      const meta = (0, entity_1.helper)(data[0]).__meta;
      const css = data.map(row => {
        const payload = em.comparator.prepareEntity(row);
        return new unit_of_work_1.ChangeSet(row, unit_of_work_1.ChangeSetType.CREATE, payload, meta);
      });
      await em.unitOfWork.getChangeSetPersister().executeInserts(css, { ctx: em.transactionContext, ...options });
      return css.map(cs => cs.getPrimaryKey());
    }
    data = data.map(row => utils_1.QueryHelper.processObjectParams(row));
    data.forEach(row => em.validator.validateParams(row, 'insert data'));
    const res = await em.driver.nativeInsertMany(entityName, data, { ctx: em.transactionContext, ...options });
    return res.insertedIds;
  }
  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate(entityName, where, data, options = {}) {
    const em = this.getContext(false);
    entityName = utils_1.Utils.className(entityName);
    data = utils_1.QueryHelper.processObjectParams(data);
    where = await em.processWhere(entityName, where, options, 'update');
    em.validator.validateParams(data, 'update data');
    em.validator.validateParams(where, 'update condition');
    const res = await em.driver.nativeUpdate(entityName, where, data, { ctx: em.transactionContext, ...options });
    return res.affectedRows;
  }
  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete(entityName, where, options = {}) {
    const em = this.getContext(false);
    entityName = utils_1.Utils.className(entityName);
    where = await em.processWhere(entityName, where, options, 'delete');
    em.validator.validateParams(where, 'delete condition');
    const res = await em.driver.nativeDelete(entityName, where, { ctx: em.transactionContext, ...options });
    return res.affectedRows;
  }
  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map(entityName, result, options = {}) {
    entityName = utils_1.Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    const data = this.driver.mapResult(result, meta);
    Object.keys(data).forEach(k => {
      const prop = meta.properties[k];
      if (prop && prop.reference === enums_1.ReferenceType.SCALAR && enums_1.SCALAR_TYPES.includes(prop.type) && (prop.setter || !prop.getter)) {
        data[k] = this.validator.validateProperty(prop, data[k], data);
      }
    });
    return this.merge(entityName, data, { convertCustomTypes: true, refresh: true, ...options });
  }
  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge(entityName, data, options = {}) {
    const em = this.getContext();
    if (utils_1.Utils.isEntity(entityName)) {
      return em.merge(entityName.constructor.name, entityName, data);
    }
    entityName = utils_1.Utils.className(entityName);
    em.validator.validatePrimaryKey(data, em.metadata.get(entityName));
    let entity = em.unitOfWork.tryGetById(entityName, data, options.schema, false);
    if (entity && (0, entity_1.helper)(entity).__initialized && !options.refresh) {
      return entity;
    }
    const meta = em.metadata.find(entityName);
    const childMeta = em.metadata.getByDiscriminatorColumn(meta, data);
    entity = utils_1.Utils.isEntity(data) ? data : em.entityFactory.create(entityName, data, { merge: true, ...options });
    em.validator.validate(entity, data, childMeta ?? meta);
    em.unitOfWork.merge(entity);
    em.unitOfWork.saveSnapshots();
    return entity;
  }
  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the options parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   */
  create(entityName, data, options = {}) {
    const em = this.getContext();
    const entity = em.entityFactory.create(entityName, data, {
      ...options,
      newEntity: !options.managed,
      merge: options.managed,
    });
    options.persist ?? (options.persist = em.config.get('persistOnCreate'));
    if (options.persist) {
      em.persist(entity);
    }
    return entity;
  }
  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity, data, options = {}) {
    return entity_1.EntityAssigner.assign(entity, data, { em: this.getContext(), ...options });
  }
  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(entityName, id, options = {}) {
    options.convertCustomTypes ?? (options.convertCustomTypes = false);
    const meta = this.metadata.get(utils_1.Utils.className(entityName));
    if (utils_1.Utils.isPrimaryKey(id)) {
      if (meta.compositePK) {
        throw errors_1.ValidationError.invalidCompositeIdentifier(meta);
      }
      id = [id];
    }
    const entity = this.getEntityFactory().createReference(entityName, id, { merge: true, ...options });
    if (options.wrapped) {
      return entity_1.Reference.create(entity);
    }
    return entity;
  }
  /**
   * Returns total number of entities matching your `where` query.
   */
  async count(entityName, where = {}, options = {}) {
    const em = this.getContext(false);
    entityName = utils_1.Utils.className(entityName);
    where = await em.processWhere(entityName, where, options, 'read');
    options.populate = em.preparePopulate(entityName, options);
    em.validator.validateParams(where);
    const cached = await em.tryCache(entityName, options.cache, [entityName, 'em.count', options, where]);
    if (cached?.data) {
      return cached.data;
    }
    const count = await em.driver.count(entityName, where, { ctx: em.transactionContext, ...options });
    await em.storeCache(options.cache, cached, () => count);
    return count;
  }
  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist(entity) {
    const em = this.getContext();
    if (utils_1.Utils.isEntity(entity)) {
      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      em.unitOfWork.persist(entity, undefined, { cascade: false });
      return em;
    }
    const entities = utils_1.Utils.asArray(entity);
    for (const ent of entities) {
      if (!utils_1.Utils.isEntity(ent, true)) {
        /* istanbul ignore next */
        const meta = typeof ent === 'object' ? em.metadata.find(ent.constructor.name) : undefined;
        throw errors_1.ValidationError.notDiscoveredEntity(ent, meta);
      }
      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      em.unitOfWork.persist(entity_1.Reference.unwrapReference(ent), undefined, { cascade: false });
    }
    return this;
  }
  /**
   * Persists your entity immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.persist(e).flush()`.
   */
  async persistAndFlush(entity) {
    await this.persist(entity).flush();
  }
  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `persist()`
   */
  persistLater(entity) {
    this.persist(entity);
  }
  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * To remove entities by condition, use `em.nativeDelete()`.
   */
  remove(entity) {
    const em = this.getContext();
    if (utils_1.Utils.isEntity(entity)) {
      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      em.unitOfWork.remove(entity, undefined, { cascade: false });
      return em;
    }
    const entities = utils_1.Utils.asArray(entity, true);
    for (const ent of entities) {
      if (!utils_1.Utils.isEntity(ent, true)) {
        throw new Error(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
      }
      // do not cascade just yet, cascading of entities in remove stack is done when flushing
      em.unitOfWork.remove(entity_1.Reference.unwrapReference(ent), undefined, { cascade: false });
    }
    return em;
  }
  /**
   * Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.remove(e).flush()`
   */
  async removeAndFlush(entity) {
    await this.remove(entity).flush();
  }
  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `remove()`
   */
  removeLater(entity) {
    this.remove(entity);
  }
  /**
   * Flushes all changes to objects that have been queued up to now to the database.
   * This effectively synchronizes the in-memory state of managed objects with the database.
   */
  async flush() {
    await this.getUnitOfWork().commit();
  }
  /**
   * @internal
   */
  async tryFlush(entityName, options) {
    const em = this.getContext();
    const flushMode = options.flushMode ?? em.flushMode ?? em.config.get('flushMode');
    entityName = utils_1.Utils.className(entityName);
    const meta = em.metadata.get(entityName);
    if (flushMode === 0 /* FlushMode.COMMIT */) {
      return;
    }
    if (flushMode === 2 /* FlushMode.ALWAYS */ || em.getUnitOfWork().shouldAutoFlush(meta)) {
      await em.flush();
    }
  }
  /**
   * Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.
   */
  clear() {
    this.getContext().unitOfWork.clear();
  }
  /**
   * Checks whether given property can be populated on the entity.
   */
  canPopulate(entityName, property) {
    entityName = utils_1.Utils.className(entityName);
    const [p, ...parts] = property.split('.');
    const meta = this.metadata.find(entityName);
    if (!meta) {
      return true;
    }
    const ret = p in meta.properties;
    if (!ret) {
      return !!this.metadata.find(property)?.pivotTable;
    }
    if (parts.length > 0) {
      return this.canPopulate((meta.properties)[p].type, parts.join('.'));
    }
    return ret;
  }
  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate(entities, populate, options = {}) {
    entities = utils_1.Utils.asArray(entities);
    if (entities.length === 0) {
      return entities;
    }
    const em = this.getContext();
    const entityName = entities[0].constructor.name;
    const preparedPopulate = em.preparePopulate(entityName, { populate: populate });
    await em.entityLoader.populate(entityName, entities, preparedPopulate, options);
    return entities;
  }
  /**
   * Returns new EntityManager instance with its own identity map
   */
  fork(options = {}) {
    const em = options.disableContextResolution ? this : this.getContext(false);
    options.clear ?? (options.clear = true);
    options.useContext ?? (options.useContext = false);
    options.freshEventManager ?? (options.freshEventManager = false);
    options.cloneEventManager ?? (options.cloneEventManager = false);
    const eventManager = options.freshEventManager
      ? new events_1.EventManager(em.config.get('subscribers'))
      : options.cloneEventManager
        ? em.eventManager.clone()
        : em.eventManager;
    // we need to allow global context here as forking from global EM is fine
    const allowGlobalContext = em.config.get('allowGlobalContext');
    em.config.set('allowGlobalContext', true);
    const fork = new em.constructor(em.config, em.driver, em.metadata, options.useContext, eventManager);
    fork.setFlushMode(options.flushMode ?? em.flushMode);
    em.config.set('allowGlobalContext', allowGlobalContext);
    fork.filters = { ...em.filters };
    fork.filterParams = utils_1.Utils.copy(em.filterParams);
    if (!options.clear) {
      for (const entity of em.unitOfWork.getIdentityMap()) {
        fork.unitOfWork.registerManaged(entity);
      }
      for (const entity of em.unitOfWork.getOrphanRemoveStack()) {
        fork.unitOfWork.getOrphanRemoveStack().add(entity);
      }
    }
    return fork;
  }
  /**
   * Gets the UnitOfWork used by the EntityManager to coordinate operations.
   */
  getUnitOfWork(useContext = true) {
    if (!useContext) {
      return this.unitOfWork;
    }
    return this.getContext().unitOfWork;
  }
  /**
   * Gets the EntityFactory used by the EntityManager.
   */
  getEntityFactory() {
    return this.getContext().entityFactory;
  }
  /**
   * Gets the EntityManager based on current transaction/request context.
   * @internal
   */
  getContext(validate = true) {
    if (!this.useContext) {
      return this;
    }
    let em = utils_1.TransactionContext.getEntityManager(this.name); // prefer the tx context
    if (em) {
      console.log("WHOA!!! USING TX EM");
      return em;
    }

    console.log("NO TX EM!");
    // no explicit tx started
    em = this.config.get('context')(this.name) ?? this;

    console.log("allowGlobalContext?", this.config.get('allowGlobalContext'));
    console.log("validate?", validate);
    console.log("em.global?", em.global);

    if (validate && !this.config.get('allowGlobalContext') && em.global) {
      throw errors_1.ValidationError.cannotUseGlobalContext();
    }
    return em;
  }
  getEventManager() {
    return this.eventManager;
  }
  /**
   * Checks whether this EntityManager is currently operating inside a database transaction.
   */
  isInTransaction() {
    return !!this.transactionContext;
  }
  /**
   * Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).
   */
  getTransactionContext() {
    return this.transactionContext;
  }
  /**
   * Sets the transaction context.
   */
  setTransactionContext(ctx) {
    this.transactionContext = ctx;
  }
  /**
   * Resets the transaction context.
   */
  resetTransactionContext() {
    delete this.transactionContext;
  }
  /**
   * Gets the MetadataStorage.
   */
  getMetadata() {
    return this.metadata;
  }
  /**
   * Gets the EntityComparator.
   */
  getComparator() {
    return this.comparator;
  }
  checkLockRequirements(mode, meta) {
    if (!mode) {
      return;
    }
    if (mode === enums_1.LockMode.OPTIMISTIC && !meta.versionProperty) {
      throw errors_1.OptimisticLockError.notVersioned(meta);
    }
    if ([enums_1.LockMode.PESSIMISTIC_READ, enums_1.LockMode.PESSIMISTIC_WRITE].includes(mode) && !this.isInTransaction()) {
      throw errors_1.ValidationError.transactionRequired();
    }
  }
  async lockAndPopulate(entityName, entity, where, options) {
    if (options.lockMode === enums_1.LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, {
        lockVersion: options.lockVersion,
        lockTableAliases: options.lockTableAliases,
      });
    }
    const preparedPopulate = this.preparePopulate(entityName, options);
    await this.entityLoader.populate(entityName, [entity], preparedPopulate, {
      ...options,
      ...this.getPopulateWhere(where, options),
      convertCustomTypes: false,
      ignoreLazyScalarProperties: true,
      lookup: false,
    });
    return entity;
  }
  buildFields(fields) {
    return fields.reduce((ret, f) => {
      if (utils_1.Utils.isPlainObject(f)) {
        Object.keys(f).forEach(ff => ret.push(...this.buildFields(f[ff]).map(field => `${ff}.${field}`)));
      }
      else {
        ret.push(f);
      }
      return ret;
    }, []);
  }
  preparePopulate(entityName, options) {
    // infer populate hint if only `fields` are available
    if (!options.populate && options.fields) {
      options.populate = this.buildFields(options.fields);
    }
    if (!options.populate) {
      return this.entityLoader.normalizePopulate(entityName, [], options.strategy);
    }
    if (Array.isArray(options.populate)) {
      options.populate = options.populate.map(field => {
        if (utils_1.Utils.isString(field)) {
          return { field, strategy: options.strategy };
        }
        return field;
      });
    }
    const ret = this.entityLoader.normalizePopulate(entityName, options.populate, options.strategy);
    const invalid = ret.find(({ field }) => !this.canPopulate(entityName, field));
    if (invalid) {
      throw errors_1.ValidationError.invalidPropertyName(entityName, invalid.field);
    }
    return ret.map(field => {
      // force select-in strategy when populating all relations as otherwise we could cause infinite loops when self-referencing
      field.strategy = options.populate === true ? enums_1.LoadStrategy.SELECT_IN : (options.strategy ?? field.strategy);
      return field;
    });
  }
  /**
   * when the entity is found in identity map, we check if it was partially loaded or we are trying to populate
   * some additional lazy properties, if so, we reload and merge the data from database
   */
  shouldRefresh(meta, entity, options) {
    if (!(0, entity_1.helper)(entity).__initialized || options.refresh) {
      return true;
    }
    let autoRefresh;
    if (options.fields) {
      autoRefresh = options.fields.some(field => !(0, entity_1.helper)(entity).__loadedProperties.has(field));
    }
    else {
      autoRefresh = meta.comparableProps.some(prop => !prop.lazy && !(0, entity_1.helper)(entity).__loadedProperties.has(prop.name));
    }
    if (autoRefresh) {
      return true;
    }
    if (Array.isArray(options.populate)) {
      return options.populate.some(field => !(0, entity_1.helper)(entity).__loadedProperties.has(field));
    }
    return !!options.populate;
  }
  /**
   * @internal
   */
  async tryCache(entityName, config, key, refresh, merge) {
    if (!config) {
      return undefined;
    }
    const em = this.getContext();
    const cacheKey = Array.isArray(config) ? config[0] : JSON.stringify(key);
    const cached = await em.resultCache.get(cacheKey);
    if (cached) {
      let data;
      if (Array.isArray(cached) && merge) {
        data = cached.map(item => em.entityFactory.create(entityName, item, { merge: true, convertCustomTypes: true, refresh }));
      }
      else if (utils_1.Utils.isObject(cached) && merge) {
        data = em.entityFactory.create(entityName, cached, { merge: true, convertCustomTypes: true, refresh });
      }
      else {
        data = cached;
      }
      await em.unitOfWork.dispatchOnLoadEvent();
      return { key: cacheKey, data };
    }
    return { key: cacheKey };
  }
  /**
   * @internal
   */
  async storeCache(config, key, data) {
    if (config) {
      const em = this.getContext();
      const expiration = Array.isArray(config) ? config[1] : (utils_1.Utils.isNumber(config) ? config : undefined);
      await em.resultCache.set(key.key, data instanceof Function ? data() : data, '', expiration);
    }
  }
  /**
   * Clears result cache for given cache key. If we want to be able to call this method,
   * we need to set the cache key explicitly when storing the cache.
   *
   * ```ts
   * // set the cache key to 'book-cache-key', with expiration of 60s
   * const res = await em.find(Book, { ... }, { cache: ['book-cache-key', 60_000] });
   *
   * // clear the cache key by name
   * await em.clearCache('book-cache-key');
   * ```
   */
  async clearCache(cacheKey) {
    await this.getContext().resultCache.remove(cacheKey);
  }
  /**
   * Returns the ID of this EntityManager. Respects the context, so global EM will give you the contextual ID
   * if executed inside request context handler.
   */
  get id() {
    return this.getContext(false)._id;
  }
  /**
   * @internal
   */
  [util_1.inspect.custom]() {
    return `[EntityManager<${this.id}>]`;
  }
}
exports.EntityManager = EntityManager;
EntityManager.counter = 1;
