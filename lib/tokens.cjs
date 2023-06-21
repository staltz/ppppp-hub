const Crypto = require('node:crypto')
const Path = require('node:path')
const AtomicFileRW = require('atomic-file-rw')
const Base58 = require('bs58')

class Tokens {
  static #filePath

  /**
   * @type {Set<string>}
   */
  static #set

  static #loaded = false

  static #save(cb) {
    const json = JSON.stringify([...this.#set])
    AtomicFileRW.writeFile(this.#filePath, json, cb)
  }

  static load(parentPath) {
    if (this.#loaded) return
    this.#filePath = Path.join(parentPath, 'tokens.json')
    this.#set = new Set()

    AtomicFileRW.readFile(this.#filePath, (err, buf) => {
      if (err) {
        if (err.code === 'ENOENT') {
          this.#loaded = true
        } else {
          console.log('Problem loading tokens file:', err)
        }
        return
      }
      const json = typeof buf === 'string' ? buf : buf.toString('utf-8')
      const arr = JSON.parse(json)
      for (const token of arr) {
        this.#set.add(token)
      }
      this.#loaded = true
    })
  }

  /**
   * @param {string} token
   * @returns {boolean}
   */
  static has(token) {
    if (!this.#loaded) {
      throw new Error('Tokens not loaded yet, cannot call has()')
    }
    return this.#set.has(token)
  }

  static create() {
    if (!this.#loaded) {
      throw new Error('Tokens not loaded yet, cannot call create()')
    }
    let token
    do {
      token = Base58.encode(Crypto.randomBytes(32))
    } while (this.#set.has(token))
    this.#set.add(token)
    this.#save((err, _) => {
      if (err) console.log('Problem saving tokens file:', err)
    })
    return token
  }

  static delete(token) {
    if (!this.#loaded) {
      throw new Error('Tokens not loaded yet, cannot call delete()')
    }
    this.#set.delete(token)
    this.#save((err, _) => {
      if (err) console.log('Problem saving tokens file:', err)
    })
  }
}

module.exports = Tokens