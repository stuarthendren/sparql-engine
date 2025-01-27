/* file : execution-context.ts
MIT License

Copyright (c) 2018-2020 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

import { rdf } from '../../utils/index.js'
import { BGPCache } from '../cache/bgp-cache.js'
import { QueryHints } from './query-hints.js'

/**
 * An execution context conatains control information for query execution.
 */
export default class ExecutionContext {
  protected _properties: Map<symbol, unknown>
  protected _hints: QueryHints
  protected _defaultGraphs: Array<rdf.NamedNode | rdf.Variable>
  protected _namedGraphs: rdf.NamedNode[]
  protected _cache: BGPCache | null

  constructor() {
    this._properties = new Map()
    this._hints = new QueryHints()
    this._defaultGraphs = []
    this._namedGraphs = []
    this._cache = null
  }

  /**
   * The set of graphs used as the default graph
   * @return The set of graphs used as the default graph
   */
  get defaultGraphs() {
    return this._defaultGraphs
  }

  /**
   * Update the set of graphs used as the default graph
   * @param  values - The set of graphs used as the default graph
   */
  set defaultGraphs(values: Array<rdf.NamedNode | rdf.Variable>) {
    this._defaultGraphs = values.slice(0)
  }

  /**
   * The set of graphs used as named graphs
   * @return The set of graphs used as named graphs
   */
  get namedGraphs() {
    return this._namedGraphs
  }

  /**
   * Update the set of graphs used as named graphs
   * @param  values - The set of graphs used as named graphs
   */
  set namedGraphs(values: rdf.NamedNode[]) {
    this._namedGraphs = values.slice(0)
  }

  /**
   * Get query hints collected until now
   * @return All query hints collected until now
   */
  get hints() {
    return this._hints
  }

  /**
   * Update the query hints
   * @param  newHints - New query hints
   */
  set hints(newHints: QueryHints) {
    this._hints = newHints
  }

  /**
   * Get the BGP cache currently used by the query engine.
   * returns null if caching is disabled
   * @return The BGP cache currently used by the query engine, or null if caching is disabled.
   */
  get cache(): BGPCache | null {
    return this._cache
  }

  /**
   * Set the BGP cache currently used by the query engine.
   * Use null to disable caching
   * @param newCache - The BGP cache to use for caching.
   */
  set cache(newCache: BGPCache | null) {
    this._cache = newCache
  }

  /**
   * Test the caching is enabled
   * @return True if the caching is enabled, false otherwise
   */
  cachingEnabled(): boolean {
    return this._cache !== null
  }

  /**
   * Get a property associated with a key
   * @param  key - Key associated with the property
   * @return  The value associated with the key
   */
  getProperty<T>(key: symbol): T {
    return this._properties.get(key) as T
  }

  /**
   * Test if the context contains a property associated with a key
   * @param  key - Key associated with the property
   * @return True if the context contains a property associated with the key
   */
  hasProperty(key: symbol): boolean {
    return this._properties.has(key)
  }

  /**
   * Set a (key, value) property in the context
   * @param key - Key of the property
   * @param value - Value of the property
   */
  setProperty(key: symbol, value: unknown): void {
    this._properties.set(key, value)
  }

  /**
   * Clone the execution context
   * @return A clone of the execution context
   */
  clone(): ExecutionContext {
    const res = new ExecutionContext()
    this._properties.forEach((value, key) => res.setProperty(key, value))
    res._hints = this.hints.clone()
    res._defaultGraphs = this._defaultGraphs.slice(0)
    res._namedGraphs = this._namedGraphs.slice(0)
    res._cache = this._cache
    return res
  }

  /**
   * Merge the context with another execution context
   * @param  other - Execution context to merge with
   * @return The merged execution context
   */
  merge(other: ExecutionContext): ExecutionContext {
    const res = this.clone()
    other._properties.forEach((value, key) => res.setProperty(key, value))
    res._hints = this._hints.merge(other._hints)
    res._defaultGraphs = this._defaultGraphs.concat(other._defaultGraphs)
    res._namedGraphs = this._namedGraphs.concat(other.namedGraphs)
    return res
  }
}
