/* file : materialize-operator.js
MIT License

Copyright (c) 2018 Thomas Minier

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

const { BufferedIterator } = require('asynciterator')

/**
 * An operator that first materialize the input iterator before processing all its bindings
 * @extends BufferedIterator
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
class MaterializeOperator extends BufferedIterator {
  constructor (source) {
    super()
    this._source = source
    this._readingFromSource = true
    this._bufferedValues = []
    this._source.on('error', err => this.emit('error', err))
  }

  _transformAll (values) {
    throw new Error('A Valid MaterializeOperator must implements a "_transformAll" method')
  }

  _transform (value, done) {
    this._push(value)
    done()
  }

  _read (count, done) {
    if (this._readingFromSource) {
      this._source.on('end', () => {
        this._readingFromSource = false
        this._bufferedValues = this._transformAll(this._bufferedValues)
        this._read(count, done)
      })
      this._source.on('data', v => {
        this._bufferedValues.push(v)
      })
    } else {
      if (this._bufferedValues.length > 0) {
        const value = this._bufferedValues.shift()
        this._transform(value, done)
      } else {
        this.close()
        done()
      }
    }
  }
}

module.exports = MaterializeOperator