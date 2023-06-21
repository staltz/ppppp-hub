const Path = require('node:path')
const AtomicFileRW = require('atomic-file-rw')

class Members {
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
    this.#filePath = Path.join(parentPath, 'members.json')
    this.#set = new Set()

    AtomicFileRW.readFile(this.#filePath, (err, buf) => {
      if (err) {
        if (err.code === 'ENOENT') {
          this.#loaded = true
        } else {
          console.warn('Problem loading members file:', err)
        }
        return
      }
      const json = typeof buf === 'string' ? buf : buf.toString('utf-8')
      const arr = JSON.parse(json)
      for (const pubkey of arr) {
        this.#set.add(pubkey)
      }
      this.#loaded = true
    })
  }

  /**
   * @param {string} pubkey
   * @returns {boolean}
   */
  static has(pubkey) {
    if (!this.#loaded) {
      throw new Error('Members not loaded yet, cannot call has()')
    }
    return this.#set.has(pubkey)
  }

  /**
   * @param {string} pubkey
   */
  static add(pubkey) {
    if (!this.#loaded) {
      throw new Error('Members not loaded yet, cannot call create()')
    }
    this.#set.add(pubkey)
    this.#save((err, _) => {
      if (err) console.warn('Problem saving members file:', err)
    })
  }
}

module.exports = Members
