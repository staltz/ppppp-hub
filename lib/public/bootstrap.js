let hasFocus = true
window.addEventListener('blur', () => {
  hasFocus = false
})
window.addEventListener('focus', () => {
  hasFocus = true
})

const host = window.location.hostname
const hostFormat = /[a-zA-Z]/.test(window.location.hostname) ? 'dns' : 'ip4';
const { tcpPort, shseCredentials } = window.hubInvite
const uri = `ppppp://invite/join/${hostFormat}/${host}/tcp/${tcpPort}/shse/${shseCredentials}`

const inviteLinkElem = document.getElementById('invite')
inviteLinkElem.href = uri
// Autoredirect to the PPPPP URI as soon as possible
setTimeout(() => {
  window.location.replace(uri)
}, 100)

// Redirect to uri or show failure state
inviteLinkElem.onclick = function handleURI(ev) {
  ev.preventDefault()
  const uri = inviteLinkElem.href
  inviteLinkElem.classList.remove('hidden')
  setTimeout(function () {
    if (hasFocus) {
      inviteLinkElem.classList.add('hidden')
    }
  }, 5000)
  window.location.replace(uri)
}
