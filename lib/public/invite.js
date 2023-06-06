let hasFocus = true
window.addEventListener('blur', () => {
  hasFocus = false
})
window.addEventListener('focus', () => {
  hasFocus = true
})

const inviteLinkElem = document.getElementById('invite')
const failureElem = document.getElementById('failure')

const hash = window.location.hash
if (hash) {
  let uri = decodeURIComponent(hash.slice(1))
  if (!uri.startsWith('ppppp:')) uri = 'ppppp://invite' + uri
  inviteLinkElem.href = uri

  // Autoredirect to the PPPPP URI as soon as possible
  setTimeout(() => {
    console.log(uri)
    // window.location.replace(uri);
  }, 100)

  // Redirect to uri or show failure state
  // FIXME:
  // inviteLinkElem.onclick = function handleURI(ev) {
  //   ev.preventDefault();
  //   const uri = inviteLinkElem.href;
  //   inviteLinkElem.classList.remove('hidden');
  //   setTimeout(function () {
  //     if (hasFocus) {
  //       inviteLinkElem.classList.add('hidden');
  //       failureElem.classList.remove('hidden');
  //     }
  //   }, 5000);
  //   window.location.replace(uri);
  // };
} else {
  inviteLinkElem.classList.add('hidden')
  failureElem.classList.remove('hidden')
}
