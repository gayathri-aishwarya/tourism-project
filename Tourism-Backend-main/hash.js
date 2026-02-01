const bcrypt = require('bcryptjs')

// The password you want to hash
const plainPassword = 'master_admin'

// The 'salt rounds' determine how strong the hash is. 10 or 12 is standard.
const saltRounds = 10

// We use hashSync here because this is a simple, one-off script,
// not a server handling multiple requests.
bcrypt.hashSync(plainPassword, saltRounds)
