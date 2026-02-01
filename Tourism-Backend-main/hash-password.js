const bcrypt = require('bcryptjs');

const password = 'password123'; // Change if you want
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✅ Password hash for "' + password + '":');
    console.log(hash);
  }
});

